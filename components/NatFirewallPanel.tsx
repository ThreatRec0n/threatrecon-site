"use client";
import React, { useState } from "react";
import type { Firewall, FirewallRule } from "@/lib/sim/types";

export default function NatFirewallPanel({ fw, onChange }:{ fw:any; onChange:(f:Firewall)=>void }) {
  const [rule, setRule] = useState<FirewallRule>({ action:"ALLOW", proto:"ANY", src:"ANY", dst:"ANY" });

  const addRule = () => onChange({ ...fw, rules:[...(fw.rules||[]), rule] });
  const setSnat = (srcCidr:string, toIp:string, outIface:"wan"|"lan"|"dmz") =>
    onChange({ ...fw, nat:{ ...(fw.nat||{}), snat:{ srcCidr, toIp, outIface } } });

  return (
    <div className="space-y-3 text-sm">
      <div className="font-medium">Firewall Rules</div>
      <div className="grid grid-cols-6 gap-2">
        <select className="border rounded px-2 py-1" value={rule.action} onChange={e=>setRule({...rule, action:e.target.value as any})}>
          <option>ALLOW</option><option>DENY</option>
        </select>
        <select className="border rounded px-2 py-1" value={rule.proto} onChange={e=>setRule({...rule, proto:e.target.value as any})}>
          <option>ANY</option><option>ICMP</option><option>DNS</option><option>HTTP</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="Source (CIDR/ANY)" value={rule.src} onChange={e=>setRule({...rule, src:e.target.value})}/>
        <input className="border rounded px-2 py-1" placeholder="Destination (CIDR/ANY)" value={rule.dst} onChange={e=>setRule({...rule, dst:e.target.value})}/>
        <select className="border rounded px-2 py-1" value={rule.inIface||""} onChange={e=>setRule({...rule, inIface:(e.target.value||undefined) as any})}>
          <option value="">Any In</option><option value="lan">LAN</option><option value="dmz">DMZ</option><option value="wan">WAN</option>
        </select>
        <button className="border rounded px-2 py-1 bg-slate-900 text-white" onClick={addRule}>Add Rule</button>
      </div>

      <div className="font-medium mt-3">NAT (SNAT)</div>
      <div className="grid grid-cols-5 gap-2">
        <input id="sn-src" className="border rounded px-2 py-1" placeholder="Source CIDR e.g. 192.168.1.0/24"/>
        <input id="sn-ip" className="border rounded px-2 py-1" placeholder="Translate To (FW WAN IP)"/>
        <select id="sn-if" className="border rounded px-2 py-1"><option value="wan">WAN</option><option value="lan">LAN</option><option value="dmz">DMZ</option></select>
        <button className="border rounded px-2 py-1 bg-emerald-600 text-white"
          onClick={()=>{
            const src=(document.getElementById("sn-src") as HTMLInputElement).value;
            const ip=(document.getElementById("sn-ip") as HTMLInputElement).value;
            const out=(document.getElementById("sn-if") as HTMLSelectElement).value as any;
            setSnat(src, ip, out);
          }}>Set SNAT</button>
        <div className="text-xs text-slate-500 self-center">Typical: 192.168.1.0/24 → {fw.ifaces?.wan} out WAN</div>
      </div>

      <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs">{JSON.stringify(fw, null, 2)}</pre>
    </div>
  );
}

