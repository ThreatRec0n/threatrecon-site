"use client";
import { useMemo, useState } from "react";
import scenarioData from "@/app/data/enterprise";
import type { Scenario, Host, Firewall } from "@/lib/sim/types";
import { pingFromHost, tracerouteFromHost, nslookupHost, hopsToNodes } from "@/lib/sim/engine";
import TopologyCanvas from "@/components/TopologyCanvas";
import MissionTimer from "@/components/MissionTimer";
import HintPanel from "@/components/HintPanel";

type Tab = "Configure" | "Diagnostics" | "Firewall/NAT" | "Logs";

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

  const addLog = (s: string) => setLogs(l => [s, ...l].slice(0, 200));

  const addSnat = () => {
    const srcCidr = scn.subnets.lan.cidr;
    const toIp = fw.ifaces.wan;
    setFw(prev => ({...prev, nat: { ...(prev.nat||{}), snat: { srcCidr, toIp }}}));
    addLog(`SNAT added: ${srcCidr} -> ${toIp}`);
  };
  const allowRule = (proto:"ICMP"|"DNS"|"HTTP"|"ANY", src:string, dst:string, inIface?: "dmz"|"lan"|"wan") => {
    setFw(prev => ({...prev, rules: [...(prev.rules||[]), { action:"ALLOW" as const, proto, src, dst, inIface }]}));
    addLog(`ALLOW ${proto} ${src} -> ${dst}${inIface? " in:"+inIface:""}`);
  };

  const doPing = (target: string) => {
    const res = pingFromHost(scn, lan1, target, fw);
    setOutput(renderPing(res.success, res.hops, res.reason));
    addLog(`[ping] ${target} => ${res.success ? "success" : "fail"} ${res.reason ? "(" + res.reason + ")" : ""}`);
    setPacketPath(hopsToNodes(res.hops, scn));
    setFailed(res.success ? null : res.reason || "blocked");
  };
  const doTrace = (target: string) => {
    const res = tracerouteFromHost(scn, lan1, target, fw);
    setOutput(renderTrace(res.hops, res.reached));
    addLog(`[traceroute] ${target} hops=${res.hops.length} reached=${res.reached}`);
    setPacketPath(hopsToNodes(res.hops, scn));
    setFailed(res.reached ? null : "route incomplete");
  };
  const doNs = (name: string) => {
    const res = nslookupHost(scn, lan1, name);
    setOutput(res.answer ? `Name: ${name}\nAddress: ${res.answer}` : `** server can't find ${name}: NXDOMAIN`);
    addLog(`[nslookup] ${name} => ${res.answer || "NXDOMAIN"}`);
  };

  // Build topology nodes/links for the diagram
  const topo = useMemo(()=>{
    return {
      nodes: [
        { id:"DMZ1", x:110, y:140, label:"dmz1", ip:dmz1.ip, zone:"dmz" },
        { id:"DMZ2", x:110, y:240, label:"dmz2", ip:dmz2.ip, zone:"dmz" },
        { id:"FW", x:430, y:210, label:"firewall", ip:fw.ifaces.wan, zone:"wan" },
        { id:"WAN_ROUTER", x:430, y:80, label:"wan gw", ip:scn.subnets.wan.gw, zone:"wan" },
        { id:"LAN1", x:700, y:160, label:"lan1", ip:lan1.ip, zone:"lan" },
        { id:"LAN2", x:700, y:260, label:"lan2", ip:lan2.ip, zone:"lan" },
        { id:"INTERNET", x:430, y:350, label:"internet", ip:scn.internet.pingTarget, zone:"internet" }
      ],
      links: [
        { from:"DMZ1", to:"FW", ok:true, active: !failed },
        { from:"DMZ2", to:"FW", ok:true, active: !failed },
        { from:"LAN1", to:"FW", ok:true, active: !failed },
        { from:"LAN2", to:"FW", ok:true, active: !failed },
        { from:"FW", to:"WAN_ROUTER", ok: true, active: !failed },
        { from:"FW", to:"INTERNET", ok: !failed }
      ]
    };
  }, [dmz1, dmz2, fw, lan1, lan2, failed, scn]);

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
          <MissionTimer minutes={15} onExpire={()=>addLog("⛔ Mission timer expired")} />
          <div className="text-sm text-slate-500">{scn.name}</div>
        </div>
      </header>
      <div className="p-6 grid grid-cols-12 gap-4">
        {/* Animated Topology */}
        <section className="col-span-7 bg-white rounded-xl shadow p-4">
          <h2 className="font-medium mb-2">Topology</h2>
          <TopologyCanvas nodes={topo.nodes as any} links={topo.links as any} packetPath={packetPath as any}/>
          <div className="mt-2 text-xs text-slate-500">Goal: make {lan1.id} reach {scn.internet.pingTarget} or open {scn.internet.httpHost}</div>
        </section>
        <section className="col-span-5 bg-white rounded-xl shadow p-4 flex flex-col">
          <div className="flex gap-2 text-sm">
            {(["Configure","Diagnostics","Firewall/NAT","Logs"] as Tab[]).map(t => (
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
              <FirewallConfig fw={fw} onChange={setFw} />
            </div>
          )}
          {activeTab === "Firewall/NAT" && (
            <div className="mt-3 text-sm">
              <div className="font-medium mb-2">Quick actions</div>
              <div className="flex gap-2 mb-3">
                <button className="px-2 py-1 border rounded" onClick={()=>allowRule("ICMP", "192.168.1.0/24", "ANY", "lan")}>ALLOW ICMP LANâ†’ANY (ingress)</button>
                <button className="px-2 py-1 border rounded" onClick={()=>allowRule("ICMP", "ANY", scn.subnets.wan.gw, "wan")}>ALLOW ICMP ANYâ†’WAN_GW</button>
                <button className="px-2 py-1 border rounded" onClick={addSnat}>Add SNAT (LAN /24 â†’ FW WAN)</button>
              </div>
              <pre className="mt-3 p-2 bg-slate-100 rounded overflow-auto">{JSON.stringify(fw, null, 2)}</pre>
            </div>
          )}
          {activeTab === "Diagnostics" && (
            <div className="mt-3 text-sm">
              <div className="flex gap-2 mb-2">
                <button className="px-2 py-1 border rounded" onClick={()=>doPing(scn.internet.pingTarget)}>ping {scn.internet.pingTarget}</button>
                <button className="px-2 py-1 border rounded" onClick={()=>doTrace(scn.internet.pingTarget)}>traceroute {scn.internet.pingTarget}</button>
                <button className="px-2 py-1 border rounded" onClick={()=>doNs(scn.internet.httpHost)}>nslookup {scn.internet.httpHost}</button>
              </div>
              <pre className="p-2 bg-black text-green-400 rounded h-48 overflow-auto text-xs whitespace-pre-wrap">{output}</pre>
            </div>
          )}
          {activeTab === "Logs" && (
            <div className="mt-3 text-xs">
              <ul className="space-y-1">{logs.map((l,i)=><li key={i} className="font-mono">{l}</li>)}</ul>
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
function renderPing(ok:boolean, hops:string[], reason?:string): string {
  if (!ok) return `PING failed\nHops: ${hops.join(" -> ")}\nReason: ${reason ?? "blocked"}`;
  const lines = hops.map((h,i)=>` ${i+1}\t${h}\tms`);
  return `PING success\n${lines.join("\n")}`;
}
function renderTrace(hops:string[], reached:boolean): string {
  const lines = hops.map((h,i)=>` ${i+1}\t${h}`);
  return `traceroute to target\n${lines.join("\n")}\n${reached?"Reached":"Unreached"}`;
}