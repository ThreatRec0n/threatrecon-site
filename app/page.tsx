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
import IPRangeGuide from "@/components/IPRangeGuide";
import NetworkInfo from "@/components/NetworkInfo";

type Tab = "Configure" | "Diagnostics" | "Firewall & NAT";

export default function Page() {
  const scn = scenarioData as Scenario;
  const [activeTab, setActiveTab] = useState<Tab>("Configure");
  
  // Initialize with empty IPs - users must configure everything
  const [fw, setFw] = useState<Firewall>({
    id: "fw1",
    ifaces: { dmz: "", lan: "", wan: "" },
    nat: {},
    rules: []
  });
  const [lan1, setLan1] = useState<Host>({
    id: "lan1",
    nic: "ens0",
    ip: "",
    mask: "",
    gw: "",
    role: "browser"
  });
  const [lan2, setLan2] = useState<Host>({
    id: "lan2",
    nic: "ens1",
    ip: "",
    mask: "",
    gw: ""
  });
  const [dmz1, setDmz1] = useState<Host>({
    id: "dmz1",
    nic: "ens0",
    ip: "",
    mask: "",
    gw: ""
  });
  const [dmz2, setDmz2] = useState<Host>({
    id: "dmz2",
    nic: "ens1",
    ip: "",
    mask: "",
    gw: ""
  });
  const [lanR, setLanR] = useState({
    id: "lan-r1",
    lanIp: "",
    gw: ""
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const [packetPath, setPacketPath] = useState<Array<any>>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [natOverlay, setNatOverlay] = useState<{from: string; to: string; visible: boolean}>({from: "", to: "", visible: false});
  const [oxygenLevel, setOxygenLevel] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [hasEscaped, setHasEscaped] = useState(false);

  const addLog = (s: string) => setLogs(l => [s, ...l].slice(0, 200));

  // Sync oxygen level with timer (controlled by MissionTimer)
  const handleTimeUpdate = (remainingPercent: number) => {
    if (!hasEscaped && !isConnected) {
      setOxygenLevel(remainingPercent);
    }
  };

  // Check for successful connection
  useEffect(() => {
    const checkConnection = () => {
      if (!lan1.ip || !fw.ifaces.lan || !fw.ifaces.wan || !lanR.lanIp) return; // Wait for basic config
      const res = pingFromHost(scn, lan1, scn.internet.pingTarget, fw, lanR);
      if (res.success) {
        setIsConnected(true);
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [scn, lan1, fw, lanR]);

  function inSame24(a:string,b:string){const A=a.split(".").map(n=>+n),B=b.split(".").map(n=>+n);return A[0]===B[0]&&A[1]===B[1]&&A[2]===B[2];}

  // Calculate device status - check if configured and valid
  const getNodeStatus = (nodeId: string, ip?: string, gw?: string): "ok"|"warning"|"error"|undefined => {
    if (nodeId === "LAN1") {
      if (!lan1.ip || !lanR.lanIp) return "error"; // Not configured
      if (inSame24(lan1.ip, lanR.lanIp) && lan1.gw === lanR.lanIp) return "ok";
      return "warning"; // Configured but incorrect
    }
    if (nodeId === "LAN2") {
      if (!lan2.ip || !lanR.lanIp) return undefined; // Optional device
      if (inSame24(lan2.ip, lanR.lanIp) && lan2.gw === lanR.lanIp) return "ok";
      return "warning";
    }
    if (nodeId === "LAN_ROUTER") {
      if (!lanR.lanIp || !fw.ifaces.lan) return "error";
      if (lanR.gw === fw.ifaces.lan) return "ok";
      return "warning";
    }
    if (nodeId === "FW") {
      if (!fw.ifaces.lan || !fw.ifaces.wan) return "error";
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
    const linkHostToLanRouter = lan1.ip && lanR.lanIp && inSame24(lan1.ip, lanR.lanIp) && lan1.gw === lanR.lanIp;
    const linkLanRouterToFw = lanR.gw && fw.ifaces.lan && lanR.gw === fw.ifaces.lan;
    const linkFwToWan = !!fw.nat?.snat && fw.nat?.snat?.outIface === "wan" && fw.ifaces.wan;
    return {
      nodes: [
        { id:"DMZ1", x:110, y:180, label:"dmz1", ip:dmz1.ip || "Not configured", zone:"dmz", status: getNodeStatus("DMZ1") },
        { id:"DMZ2", x:110, y:260, label:"dmz2", ip:dmz2.ip || "Not configured", zone:"dmz", status: getNodeStatus("DMZ2") },
        { id:"FW", x:430, y:220, label:"firewall", ip:fw.ifaces.wan || "Not configured", zone:"wan", status: getNodeStatus("FW") },
        { id:"WAN_ROUTER", x:430, y:100, label:"wan gw", ip:scn.subnets.wan.gw, zone:"wan" },
        { id:"LAN_ROUTER", x:700, y:120, label:"lan rtr", ip:lanR.lanIp || "Not configured", zone:"lan", status: getNodeStatus("LAN_ROUTER") },
        { id:"LAN1", x:700, y:200, label:"lan1", ip:lan1.ip || "Not configured", zone:"lan", status: getNodeStatus("LAN1") },
        { id:"LAN2", x:700, y:280, label:"lan2", ip:lan2.ip || "Not configured", zone:"lan", status: getNodeStatus("LAN2") },
        { id:"INTERNET", x:430, y:36, label:"internet", ip:scn.internet.pingTarget, zone:"internet", status: "ok" as const }
      ],
      links: [
        { from:"DMZ1", to:"FW", ok:!!dmz1.ip && !!fw.ifaces.dmz, active:false },
        { from:"DMZ2", to:"FW", ok:!!dmz2.ip && !!fw.ifaces.dmz, active:false },
        { from:"LAN1", to:"LAN_ROUTER", ok:linkHostToLanRouter, active:linkHostToLanRouter },
        { from:"LAN2", to:"LAN_ROUTER", ok:lan2.ip && lanR.lanIp && inSame24(lan2.ip, lanR.lanIp) && lan2.gw===lanR.lanIp, active:false },
        { from:"LAN_ROUTER", to:"FW", ok:linkLanRouterToFw, active:linkLanRouterToFw },
        { from:"FW", to:"WAN_ROUTER", ok:linkFwToWan, active:linkFwToWan },
        { from:"WAN_ROUTER", to:"INTERNET", ok:linkFwToWan, active:false }
      ]
    };
  }, [dmz1, dmz2, fw, lan1, lan2, lanR, failed, scn]);

  const getHints = () => {
    return [
      "📋 Private IP Ranges: 10.0.0.0/8 (Class A), 172.16.0.0/12 (Class B), 192.168.0.0/16 (Class C)",
      "✓ LAN devices: Use 192.168.1.x range. Gateway points to LAN router.",
      "✓ LAN Router: Use 192.168.1.x (e.g., .254). Gateway points to Firewall LAN IP.",
      "✓ Firewall LAN: Use 192.168.1.x (typically .1). WAN: Use 203.0.113.x (provided).",
      "✓ Firewall needs TWO separate rules: ALLOW ICMP on LAN ingress AND WAN egress.",
      "✓ SNAT: Translate 192.168.1.0/24 to the Firewall WAN IP (must match exactly).",
      "✓ Subnet mask: Use 255.255.255.0 (/24) for all private networks.",
      "✓ Test: Use 'ping 8.8.8.8' in terminal after configuring everything.",
      oxygenLevel < 50 ? "⚠️ Time is running out! Check each IP address carefully." : ""
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
          <MissionTimer minutes={15} onExpire={handleOxygenDepleted} onTimeUpdate={handleTimeUpdate} />
          <div className="text-sm text-slate-300">Connect to Internet to Unlock Door</div>
        </div>
      </header>
      <div className="relative z-10 p-6 grid grid-cols-12 gap-4">
        {/* Animated Topology */}
        <section className="col-span-7 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-4">
          <h2 className="font-medium mb-2">Network Topology</h2>
          <TopologyCanvas nodes={topo.nodes as any} links={topo.links as any} packetPath={packetPath as any} natOverlay={natOverlay}/>
          <div className="mt-2 text-xs text-slate-500 space-y-1">
            <div>
              <span className="font-semibold text-red-400">⚠️ OBJECTIVE:</span> Configure all network devices with correct static IPs, gateways, firewall rules, and NAT to establish Internet connectivity.
            </div>
            <div className="text-slate-400">
              The door unlocks when {lan1.id} successfully reaches {scn.internet.pingTarget}. 
              <span className="font-mono text-slate-600"> Use private IP ranges (10.x, 172.x, 192.x) - see IP Range Guide above.</span>
            </div>
            {oxygenLevel < 30 && <span className="block mt-1 text-red-400 animate-pulse">⚡ CRITICAL: Oxygen running low! Configure faster!</span>}
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
            <div className="mt-3 space-y-4">
              <IPRangeGuide />
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <NetworkInfo subnet="lan" requiredRange="192.168.x.x /24" description="Internal LAN network - use Class C private range" />
                <NetworkInfo subnet="dmz" requiredRange="10.x.x.x /24" description="DMZ network - use Class A private range" />
                <NetworkInfo subnet="wan" requiredRange="203.0.113.x /24" description="WAN/Internet - use provided public range" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DeviceConfig title="LAN Host (browser)" host={lan1} onChange={setLan1} hint="Use 192.168.1.x range" />
                <DeviceConfig title="LAN Host 2" host={lan2} onChange={setLan2} hint="Optional - same range as LAN Host 1" />
                <DeviceConfig title="DMZ Host 1" host={dmz1} onChange={setDmz1} hint="Use 10.x.x.x range" />
                <DeviceConfig title="DMZ Host 2" host={dmz2} onChange={setDmz2} hint="Optional - same range as DMZ Host 1" />
                <LanRouterConfig lanR={lanR} onChange={setLanR} />
                <FirewallConfig fw={fw} onChange={setFw} />
              </div>
            </div>
          )}
          {activeTab === "Diagnostics" && (
            <div className="mt-3 text-sm">
              <NetTerminal exec={(cmd,args)=>{
                if (cmd==="ping") {
                  const res = pingFromHost(scn, lan1, args[0] || scn.internet.pingTarget, fw, lanR);
                  setPacketPath(hopsToNodes(res.hops, scn, lanR, lan1.ip, fw));
                  // Show NAT overlay if SNAT is active
                  if (fw.nat?.snat && res.hops.includes(fw.ifaces.wan)) {
                    setNatOverlay({ from: lan1.ip, to: fw.ifaces.wan, visible: true });
                    setTimeout(() => setNatOverlay(prev => ({ ...prev, visible: false })), 3000);
                  }
                  return res.success? "PING OK\n"+res.hops.join(" -> "): "PING FAIL: "+(res.reason||"blocked")+"\n"+res.hops.join(" -> ");
                }
                if (cmd==="traceroute") {
                  const r = tracerouteFromHost(scn, lan1, args[0] || scn.internet.pingTarget, fw, lanR);
                  setPacketPath(hopsToNodes(r.hops, scn, lanR, lan1.ip, fw));
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

function DeviceConfig({ title, host, onChange, hint }: { title: string; host: any; onChange: (h: any) => void; hint?: string }) {
  const isValid = (ip: string) => {
    if (!ip) return false;
    const parts = ip.split(".");
    return parts.length === 4 && parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === String(n);
    });
  };

  const getIpClass = (ip: string): string => {
    if (!ip) return "";
    const first = parseInt(ip.split(".")[0] || "0", 10);
    if (first >= 1 && first <= 126) return "Class A (10.x.x.x)";
    if (first >= 128 && first <= 191) return "Class B (172.x.x.x)";
    if (first >= 192 && first <= 223) return "Class C (192.x.x.x)";
    return "Public/Other";
  };

  return (
    <div className="p-3 border rounded bg-white/90">
      <div className="font-medium mb-2 text-sm">{title}</div>
      {hint && <div className="text-[10px] text-slate-500 mb-2 italic">{hint}</div>}
      <Labeled v="IP Address" value={host.ip} onChange={v=>onChange({...host, ip:v})} showValidation={isValid} ipClass={getIpClass(host.ip)} />
      <Labeled v="Subnet Mask" value={host.mask} onChange={v=>onChange({...host, mask:v})} placeholder="255.255.255.0" />
      <Labeled v="Gateway" value={host.gw} onChange={v=>onChange({...host, gw:v})} showValidation={isValid} />
    </div>
  );
}
function LanRouterConfig({ lanR, onChange }:{ lanR:any; onChange:(r:any)=>void }) {
  return (
    <div className="p-3 border rounded bg-white/90">
      <div className="font-medium mb-2 text-sm">LAN Router</div>
      <div className="text-[10px] text-slate-500 mb-2 italic">Use 192.168.1.x range (e.g., 192.168.1.254)</div>
      <Labeled v="LAN IP" value={lanR.lanIp} onChange={v=>onChange({...lanR, lanIp:v})}/>
      <Labeled v="Gateway (to Firewall)" value={lanR.gw} onChange={v=>onChange({...lanR, gw:v})} placeholder="Must match Firewall LAN IP" />
    </div>
  );
}
function FirewallConfig({ fw, onChange }:{ fw:any; onChange:(f:any)=>void }) {
  return (
    <div className="p-3 border rounded col-span-2 bg-white/90">
      <div className="font-medium mb-2 text-sm">Firewall Interfaces</div>
      <div className="text-[10px] text-slate-500 mb-2 italic">DMZ: 10.x.x.x | LAN: 192.168.1.x | WAN: 203.0.113.x</div>
      <div className="grid grid-cols-3 gap-2">
        <Labeled v="DMZ Interface" value={fw.ifaces.dmz} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, dmz:v}})} placeholder="10.x.x.1" />
        <Labeled v="LAN Interface" value={fw.ifaces.lan} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, lan:v}})} placeholder="192.168.1.1" />
        <Labeled v="WAN Interface" value={fw.ifaces.wan} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, wan:v}})} placeholder="203.0.113.2" />
      </div>
    </div>
  );
}
function Labeled({ 
  v, 
  value, 
  onChange, 
  placeholder, 
  showValidation, 
  ipClass 
}: {
  v: string; 
  value: string; 
  onChange: (s: string) => void;
  placeholder?: string;
  showValidation?: (s: string) => boolean;
  ipClass?: (s: string) => string;
}) {
  const isValid = showValidation ? showValidation(value) : true;
  const classInfo = ipClass && value ? ipClass(value) : "";
  
  return (
    <label className="block text-xs mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-600 font-medium">{v}</span>
        {showValidation && value && (
          <span className={`text-[10px] ${isValid ? "text-green-600" : "text-red-600"}`}>
            {isValid ? "✓" : "✗ Invalid"}
          </span>
        )}
      </div>
      <input
        className={`mt-1 w-full border rounded px-2 py-1 text-sm ${
          showValidation && value 
            ? isValid 
              ? "border-green-300 bg-green-50/50" 
              : "border-red-300 bg-red-50/50"
            : "border-slate-300"
        }`}
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder || `Enter ${v.toLowerCase()}`}
      />
      {classInfo && value && (
        <div className="text-[9px] text-slate-500 mt-0.5 italic">{classInfo}</div>
      )}
    </label>
  );
}