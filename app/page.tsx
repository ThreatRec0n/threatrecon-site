"use client";
import { useMemo, useState } from "react";
import scenarioData from "@/app/data/enterprise";
import type { Scenario, Host, Firewall } from "@/lib/sim/types";
import { pingFromHost, tracerouteFromHost, nslookupHost, hopsToNodes } from "@/lib/sim/engine";
import TopologyCanvas from "@/components/TopologyCanvas";
import MissionTimer from "@/components/MissionTimer";
import HintPanel from "@/components/HintPanel";
import NetTerminal from "@/components/NetTerminal";
import NatFirewallPanel from "@/components/NatFirewallPanel";

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

  const addLog = (s: string) => setLogs(l => [s, ...l].slice(0, 200));

  function inSame24(a:string,b:string){const A=a.split(".").map(n=>+n),B=b.split(".").map(n=>+n);return A[0]===B[0]&&A[1]===B[1]&&A[2]===B[2];}

  // Build topology nodes/links for the diagram
  const topo = useMemo(()=>{
    // Determine which links are currently valid (only show when configured)
    const linkHostToLanRouter = inSame24(lan1.ip, lanR.lanIp) && lan1.gw === lanR.lanIp;
    const linkLanRouterToFw = lanR.gw === fw.ifaces.lan;
    const linkFwToWan = !!fw.nat?.snat && fw.nat?.snat?.outIface === "wan";
    return {
      nodes: [
        { id:"DMZ1", x:110, y:180, label:"dmz1", ip:dmz1.ip, zone:"dmz" },
        { id:"DMZ2", x:110, y:260, label:"dmz2", ip:dmz2.ip, zone:"dmz" },
        { id:"FW", x:430, y:220, label:"firewall", ip:fw.ifaces.wan, zone:"wan" },
        { id:"WAN_ROUTER", x:430, y:100, label:"wan gw", ip:scn.subnets.wan.gw, zone:"wan" },
        { id:"LAN_ROUTER", x:700, y:120, label:"lan rtr", ip:lanR.lanIp, zone:"lan" },
        { id:"LAN1", x:700, y:200, label:"lan1", ip:lan1.ip, zone:"lan" },
        { id:"LAN2", x:700, y:280, label:"lan2", ip:lan2.ip, zone:"lan" },
        { id:"INTERNET", x:430, y:36, label:"internet", ip:scn.internet.pingTarget, zone:"internet" }
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
      "Ensure each host and its gateway are in the same /24 subnet.",
      "LAN egress: allow ICMP on LAN ingress and WAN egress on the firewall.",
      "For Internet, SNAT must translate 192.168.1.0/24 to the FW WAN IP.",
      "Traceroute reveals where traffic stops; adjust rules or gateways accordingly."
    ];
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="font-semibold">Network Connectivity Simulator</div>
        <div className="flex items-center gap-3">
          <MissionTimer minutes={15} onExpire={()=>{}} />
          <div className="text-sm text-slate-500">{scn.name}</div>
        </div>
      </header>
      <div className="p-6 grid grid-cols-12 gap-4">
        {/* Animated Topology */}
        <section className="col-span-7 bg-white rounded-xl shadow p-4">
          <h2 className="font-medium mb-2">Network Topology</h2>
          <TopologyCanvas nodes={topo.nodes as any} links={topo.links as any} packetPath={packetPath as any}/>
          <div className="mt-2 text-xs text-slate-500">Goal: configure static IPv4, routes, and NAT so {lan1.id} reaches {scn.internet.pingTarget} or resolves {scn.internet.httpHost}.</div>
        </section>
        <section className="col-span-5 bg-white rounded-xl shadow p-4 flex flex-col">
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
                if (cmd==="ping") { const res = pingFromHost(scn, lan1, args[0], fw); setPacketPath(hopsToNodes(res.hops, scn)); return res.success? "PING OK\n"+res.hops.join(" -> "): "PING FAIL: "+(res.reason||"blocked")+"\n"+res.hops.join(" -> "); }
                if (cmd==="traceroute") { const r = tracerouteFromHost(scn, lan1, args[0], fw); setPacketPath(hopsToNodes(r.hops, scn)); return r.hops.join("\n"); }
                if (cmd==="nslookup") { const r = nslookupHost(scn, lan1, args[0]); return r.answer? `${args[0]} -> ${r.answer}` : "NXDOMAIN"; }
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