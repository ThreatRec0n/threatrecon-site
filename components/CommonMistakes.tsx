"use client";
import React, { useState } from "react";

const mistakes = [
  { id: "subnet", title: "Gateway outside subnet", fix: "Gateway IP first 3 octets must match host IP. Use subnet calculator.", example: "Host: 192.168.1.10, Gateway: 192.168.2.1 ❌ → 192.168.1.1 ✓" },
  { id: "snat", title: "SNAT wrong CIDR", fix: "SNAT source must match your LAN subnet exactly. Use /24 notation.", example: "192.168.1.0/24 → Firewall WAN IP" },
  { id: "rules", title: "Missing firewall rules", fix: "Need TWO rules: ALLOW ICMP on LAN (ingress) AND WAN (egress).", example: "Rule 1: LAN ingress, Rule 2: WAN egress" },
  { id: "range", title: "Wrong IP range", fix: "LAN uses 192.168.x.x, DMZ uses 10.x.x.x, WAN uses 203.0.113.x", example: "Check IP Range Guide" },
];

export default function CommonMistakes({ errorType }: { errorType?: string }) {
  const [open, setOpen] = useState(false);
  const relevant = errorType ? mistakes.filter(m => m.id === errorType) : mistakes;
  
  if (!open && !errorType) return (
    <button onClick={()=>setOpen(true)} className="text-xs text-blue-600 underline">Common Mistakes</button>
  );
  
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">Common Mistakes</div>
        <button onClick={()=>setOpen(false)} className="text-xs">✕</button>
      </div>
      <div className="space-y-2 text-xs">
        {relevant.map(m => (
          <div key={m.id} className="border-l-2 border-red-400 pl-2">
            <div className="font-semibold text-red-700">{m.title}</div>
            <div className="text-slate-600">{m.fix}</div>
            <div className="text-slate-500 italic mt-1">{m.example}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

