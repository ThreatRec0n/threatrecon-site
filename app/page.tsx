"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import scenarioData from "@/app/data/enterprise";
import type { Scenario, Host, Firewall } from "@/lib/sim/types";
import { pingFromHost, tracerouteFromHost, nslookupHost, hopsToNodes } from "@/lib/sim/engine";
import TopologyCanvas from "@/components/TopologyCanvas";
import MissionTimer from "@/components/MissionTimer";
import HintPanel from "@/components/HintPanel";
import NetTerminal from "@/components/NetTerminal";
import NatFirewallPanel from "@/components/NatFirewallPanel";
import CircuitBackground from "@/components/CircuitBackground";
import EscapeStory from "@/components/EscapeStory";
import OxygenMeter from "@/components/OxygenMeter";

type Tab = "Configure" | "Diagnostics" | "Firewall & NAT";

export default function Page() {
  const scn = scenarioData as Scenario;
  const [activeTab, setActiveTab] = useState<Tab>("Configure");
  const [fw, setFw] = useState<Firewall>({...scn.devices.firewall, nat:{}, rules:[]});
  const [lan1, setLan1] = useState<Host>({...scn.devices.lanHosts[0]});
  const [lan2, setLan2] = useState<Host>({...scn.devices.lanHosts[1]});
  const [dmz1, setDmz1] = useState<Host>({...scn.devices.dmzHosts[0]});
  const [dmz2, setDmz2] = useState<Host>({...scn.devices.dmzHosts[1]});
  const [logs, setLogs] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const [packetPath, setPacketPath] = useState<Array<any>>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [lanR, setLanR] = useState(scn.devices.lanRouter);
  const [natOverlay, setNatOverlay] = useState<{from: string; to: string; visible: boolean}>({from: "", to: "", visible: false});
  const [oxygenLevel, setOxygenLevel] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [hasEscaped, setHasEscaped] = useState(false);

  const addLog = (s: string) => setLogs(l => [s, ...l].slice(0, 200));

  // Oxygen depletion system
  useEffect(() => {
    if (hasEscaped || isConnected) return;
    
    const interval = setInterval(() => {
      setOxygenLevel(prev => {
        const newLevel = Math.max(0, prev - 0.05); // Deplete slowly
        if (newLevel <= 0) {
          // Game over
          return 0;
        }
        return newLevel;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [hasEscaped, isConnected]);

  // Check for successful connection
  useEffect(() => {
    const checkConnection = () => {
      const res = pingFromHost(scn, lan1, scn.internet.pingTarget, fw);
      if (res.success) {
        setIsConnected(true);
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [scn, lan1, fw]);

  function inSame24(a:string,b:string){const A=a.split(".").map(n=>+n),B=b.split(".").map(n=>+n);return A[0]===B[0]&&A[1]===B[1]&&A[2]===B[2];}

  // Calculate device status
  const getNodeStatus = (nodeId: string, ip?: string, gw?: string): "ok"|"warning"|"error"|undefined => {
    if (nodeId === "LAN1") {
      if (inSame24(lan1.ip, lanR.lanIp) && lan1.gw === lanR.lanIp) return "ok";
      if (!inSame24(lan1.ip, lanR.lanIp) || lan1.gw !== lanR.lanIp) return "warning";
    }
    if (nodeId === "LAN2") {
      if (inSame24(lan2.ip, lanR.lanIp) && lan2.gw === lanR.lanIp) return "ok";
      if (!inSame24(lan2.ip, lanR.lanIp) || lan2.gw !== lanR.lanIp) return "warning";
    }
    if (nodeId === "LAN_ROUTER") {
      if (lanR.gw === fw.ifaces.lan) return "ok";
      return "warning";
    }
    if (nodeId === "FW") {
      const hasRules = fw.rules && fw.rules.length > 0;
      const hasSnat = !!fw.nat?.snat && fw.nat.snat.outIface === "wan";
      if (hasRules && hasSnat) return "ok";
      if (!hasRules || !hasSnat) return "warning";
    }
    return undefined;
  };

  // Build topology nodes/links for the diagram
  const topo = useMemo(()=>{
    // Determine which links are currently valid (only show when configured)
    const linkHostToLanRouter = inSame24(lan1.ip, lanR.lanIp) && lan1.gw === lanR.lanIp;
    const linkLanRouterToFw = lanR.gw === fw.ifaces.lan;
    const linkFwToWan = !!fw.nat?.snat && fw.nat?.snat?.outIface === "wan";
    return {
      nodes: [
        { id:"DMZ1", x:110, y:180, label:"dmz1", ip:dmz1.ip, zone:"dmz", status: getNodeStatus("DMZ1") },
        { id:"DMZ2", x:110, y:260, label:"dmz2", ip:dmz2.ip, zone:"dmz", status: getNodeStatus("DMZ2") },
        { id:"FW", x:430, y:220, label:"firewall", ip:fw.ifaces.wan, zone:"wan", status: getNodeStatus("FW") },
        { id:"WAN_ROUTER", x:430, y:100, label:"wan gw", ip:scn.subnets.wan.gw, zone:"wan" },
        { id:"LAN_ROUTER", x:700, y:120, label:"lan rtr", ip:lanR.lanIp, zone:"lan", status: getNodeStatus("LAN_ROUTER") },
        { id:"LAN1", x:700, y:200, label:"lan1", ip:lan1.ip, zone:"lan", status: getNodeStatus("LAN1") },
        { id:"LAN2", x:700, y:280, label:"lan2", ip:lan2.ip, zone:"lan", status: getNodeStatus("LAN2") },
        { id:"INTERNET", x:430, y:36, label:"internet", ip:scn.internet.pingTarget, zone:"internet", status: "ok" as const }
      ],
      links: [
        { from:"DMZ1", to:"FW", ok:true, active:false },                 // stays local only
        { from:"DMZ2", to:"FW", ok:true, active:false },
        { from:"LAN1", to:"LAN_ROUTER", ok:linkHostToLanRouter, active:linkHostToLanRouter },
        { from:"LAN2", to:"LAN_ROUTER", ok:inSame24(lan2.ip, lanR.lanIp) && lan2.gw===lanR.lanIp, active:false },
        { from:"LAN_ROUTER", to:"FW", ok:linkLanRouterToFw, active:linkLanRouterToFw },
        { from:"FW", to:"WAN_ROUTER", ok:linkFwToWan, active:linkFwToWan },
        { from:"WAN_ROUTER", to:"INTERNET", ok:linkFwToWan, active:false }
      ]
    };
  }, [dmz1, dmz2, fw, lan1, lan2, lanR, failed, scn]);

  const getHints = () => {
    return [
      "✓ Each host IP must be in the same /24 subnet as its gateway (first 3 octets must match).",
      "✓ The LAN router's gateway must point to the firewall's LAN interface IP.",
      "✓ Firewall needs TWO rules: ALLOW ICMP on LAN interface (ingress) AND WAN interface (egress).",
      "✓ SNAT must translate 192.168.1.0/24 to the firewall's WAN IP address exactly.",
      "✓ Use 'ping 8.8.8.8' in the terminal to test connectivity.",
      oxygenLevel < 50 ? "⚠️ Time is running out! Check each configuration carefully." : ""
    ].filter(Boolean);
  };

  const handleEscape = () => {
    setHasEscaped(true);
    setIsConnected(true);
  };

  const handleOxygenDepleted = () => {
    // Game over - show message
    alert("Oxygen depleted. You didn't make it in time. The door remains locked.");
  };

  if (hasEscaped) {
    return (
      <main className="min-h-screen relative">
        <CircuitBackground />
        <div className="relative z-50 flex items-center justify-center min-h-screen">
          <div className="bg-slate-900/95 backdrop-blur border-2 border-emerald-500 rounded-xl p-12 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-8xl mb-6"
            >
              🎉
            </motion.div>
            <h1 className="text-4xl font-bold text-emerald-400 mb-4">Escape Successful!</h1>
            <p className="text-xl text-slate-300 mb-6">
              You successfully configured the network and established a connection to the outside world.
            </p>
            <p className="text-lg text-slate-400">
              The door unlocked, and you made it out alive. Well done!
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <CircuitBackground />
      <OxygenMeter level={oxygenLevel} onDepleted={handleOxygenDepleted} />
      <EscapeStory oxygenLevel={oxygenLevel} onEscape={handleEscape} isConnected={isConnected} />
      <header className="relative z-10 flex items-center justify-between p-4 border-b bg-slate-900/80 backdrop-blur-sm text-white">
        <div className="font-semibold text-white">🚪 Escape Room: Network Configuration</div>
        <div className="flex items-center gap-3">
          <MissionTimer minutes={Math.floor(oxygenLevel / 6.67)} onExpire={handleOxygenDepleted} />
          <div className="text-sm text-slate-300">Connect to Internet to Unlock Door</div>
        </div>
      </header>
      <div className="relative z-10 p-6 grid grid-cols-12 gap-4">
        {/* Animated Topology */}
        <section className="col-span-7 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-4">
          <h2 className="font-medium mb-2">Network Topology</h2>
          <TopologyCanvas nodes={topo.nodes as any} links={topo.links as any} packetPath={packetPath as any} natOverlay={natOverlay}/>
          <div className="mt-2 text-xs text-slate-500">
            <span className="font-semibold text-red-400">⚠️ OBJECTIVE:</span> Configure the network correctly to establish Internet connectivity. 
            The door will unlock when {lan1.id} successfully reaches {scn.internet.pingTarget}.
            {oxygenLevel < 30 && <span className="block mt-1 text-red-400 animate-pulse">⚡ CRITICAL: Oxygen running low!</span>}
          </div>
        </section>
        <section className="col-span-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-4 flex flex-col">
          <div className="flex gap-2 text-sm">
            {(["Configure","Diagnostics","Firewall & NAT"] as Tab[]).map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} className={`px-3 py-1 border rounded ${activeTab===t?"bg-slate-900 text-white":"bg-white"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-3">
            <HintPanel getHints={getHints}/>
          </div>
          {activeTab === "Configure" && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <DeviceConfig title="LAN Host (browser)" host={lan1} onChange={setLan1} />
              <DeviceConfig title="LAN Host 2" host={lan2} onChange={setLan2} />
              <DeviceConfig title="DMZ Host 1" host={dmz1} onChange={setDmz1} />
              <DeviceConfig title="DMZ Host 2" host={dmz2} onChange={setDmz2} />
              <LanRouterConfig lanR={lanR} onChange={setLanR} />
              <FirewallConfig fw={fw} onChange={setFw} />
            </div>
          )}
          {activeTab === "Diagnostics" && (
            <div className="mt-3 text-sm">
              <NetTerminal exec={(cmd,args)=>{
                if (cmd==="ping") {
                  const res = pingFromHost(scn, lan1, args[0], fw);
                  setPacketPath(hopsToNodes(res.hops, scn));
                  // Show NAT overlay if SNAT is active
                  if (fw.nat?.snat && res.hops.includes(fw.ifaces.wan)) {
                    setNatOverlay({ from: lan1.ip, to: fw.ifaces.wan, visible: true });
                    setTimeout(() => setNatOverlay(prev => ({ ...prev, visible: false })), 3000);
                  }
                  return res.success? "PING OK\n"+res.hops.join(" -> "): "PING FAIL: "+(res.reason||"blocked")+"\n"+res.hops.join(" -> ");
                }
                if (cmd==="traceroute") {
                  const r = tracerouteFromHost(scn, lan1, args[0], fw);
                  setPacketPath(hopsToNodes(r.hops, scn));
                  return r.hops.join("\n");
                }
                if (cmd==="nslookup") {
                  const r = nslookupHost(scn, lan1, args[0]);
                  return r.answer? `${args[0]} -> ${r.answer}` : "NXDOMAIN";
                }
                return "unknown command; type 'help'";
              }}/>
            </div>
          )}
          {activeTab === "Firewall & NAT" && (
            <div className="mt-3 text-sm">
              <NatFirewallPanel fw={fw} onChange={setFw}/>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DeviceConfig({ title, host, onChange }:{ title:string; host:any; onChange:(h:any)=>void }) {
  return (
    <div className="p-3 border rounded">
      <div className="font-medium mb-2">{title}</div>
      <Labeled v="IP" value={host.ip} onChange={v=>onChange({...host, ip:v})}/>
      <Labeled v="Mask" value={host.mask} onChange={v=>onChange({...host, mask:v})}/>
      <Labeled v="Gateway" value={host.gw} onChange={v=>onChange({...host, gw:v})}/>
    </div>
  );
}
function LanRouterConfig({ lanR, onChange }:{ lanR:any; onChange:(r:any)=>void }) {
  return (
    <div className="p-3 border rounded">
      <div className="font-medium mb-2">LAN Router</div>
      <Labeled v="LAN IP" value={lanR.lanIp} onChange={v=>onChange({...lanR, lanIp:v})}/>
      <Labeled v="Gateway" value={lanR.gw} onChange={v=>onChange({...lanR, gw:v})}/>
    </div>
  );
}
function FirewallConfig({ fw, onChange }:{ fw:any; onChange:(f:any)=>void }) {
  return (
    <div className="p-3 border rounded col-span-2">
      <div className="font-medium mb-2">Firewall Interfaces</div>
      <div className="grid grid-cols-3 gap-2">
        <Labeled v="DMZ" value={fw.ifaces.dmz} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, dmz:v}})} />
        <Labeled v="LAN" value={fw.ifaces.lan} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, lan:v}})} />
        <Labeled v="WAN" value={fw.ifaces.wan} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, wan:v}})} />
      </div>
    </div>
  );
}
function Labeled({ v, value, onChange }:{ v:string; value:string; onChange:(s:string)=>void }) {
  return (
    <label className="block text-xs mb-2">
      <span className="text-slate-600">{v}</span>
      <input className="mt-1 w-full border rounded px-2 py-1 text-sm" value={value} onChange={e=>onChange(e.target.value)} />
    </label>
  );
}