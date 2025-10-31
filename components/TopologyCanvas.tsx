"use client";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
type NodeKey = "WAN_ROUTER"|"FW"|"LAN1"|"LAN2"|"LAN_ROUTER"|"DMZ1"|"DMZ2"|"INTERNET";
type Node = { id: NodeKey; x: number; y: number; label: string; ip?: string; zone?: "lan"|"dmz"|"wan"|"internet" };
type Link = { from: NodeKey; to: NodeKey; ok: boolean; active?: boolean };
export type TopologyProps = {
  nodes: Node[];
  links: Link[];
  packetPath?: NodeKey[];
  onNodeClick?: (id: NodeKey) => void;
};
const zoneBg: Record<string,string> = {
  lan: "fill-blue-50",
  dmz: "fill-yellow-50",
  wan: "fill-rose-50",
  internet: "fill-emerald-50"
};
export default function TopologyCanvas({ nodes, links, packetPath, onNodeClick }: TopologyProps) {
  const map = Object.fromEntries(nodes.map(n=>[n.id, n]));
  const width = 860, height = 420;
  const segments: Array<{x1:number,y1:number,x2:number,y2:number}> = [];
  if (packetPath && packetPath.length>1) {
    for (let i=0;i<packetPath.length-1;i++){
      const a = map[packetPath[i]];
      const b = map[packetPath[i+1]];
      if (a && b) segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y});
    }
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[420px] rounded-xl border bg-white">
      <rect x="12" y="52" width="260" height="356" className={zoneBg["dmz"]+" opacity-70 stroke-slate-200"} rx="14"/>
      <rect x="300" y="52" width="260" height="356" className={zoneBg["wan"]+" opacity-70 stroke-slate-200"} rx="14"/>
      <rect x="588" y="52" width="260" height="356" className={zoneBg["lan"]+" opacity-70 stroke-slate-200"} rx="14"/>
      <text x="22" y="74" className="fill-slate-600 text-[12px]">DMZ</text>
      <text x="310" y="74" className="fill-slate-600 text-[12px]">FIREWALL / WAN</text>
      <text x="598" y="74" className="fill-slate-600 text-[12px]">LAN</text>
      {links.map((l,idx)=>{
        const a = map[l.from], b = map[l.to];
        if(!a || !b) return null;
        // Local = blue, Internet = green, blocked = red
        const internet = (l.from==="FW" && (l.to==="WAN_ROUTER" || l.to==="INTERNET")) || l.to==="INTERNET";
        const color = l.ok ? (internet ? "#16a34a" : "#0ea5e9") : "#ef4444";
        const dash = l.ok ? "0" : "6,6";
        return <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="3" strokeDasharray={dash} opacity={l.active?1:0.7} />;
      })}
      {nodes.map(n=>{
        const fill = n.zone ? zoneBg[n.zone].replace("fill-","") : "white";
        return (
          <g key={n.id} transform={`translate(${n.x-32}, ${n.y-18})`} onClick={()=>onNodeClick?.(n.id)} className="cursor-pointer">
            <rect width="64" height="36" rx="8" className="fill-white stroke-slate-300" />
            <circle cx="6" cy="6" r="3" className="fill-emerald-500" />
            <text x="10" y="14" className="fill-slate-700 text-[10px]">{n.label}</text>
            {n.ip && <text x="10" y="26" className="fill-slate-500 text-[10px]">{n.ip}</text>}
          </g>
        );
      })}
      <AnimatePresence>
        {segments.length>0 && segments.map((seg, i)=>(
          <motion.circle key={i}
            r="4" fill="#10b981"
            initial={{ cx: seg.x1, cy: seg.y1, opacity: 0 }}
            animate={{ cx: seg.x2, cy: seg.y2, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut", delay: i*0.25 }}
          />
        ))}
      </AnimatePresence>
      {/* Internet cloud */}
      <g transform="translate(378, 8)">
        <path d="M40 34c9 0 16-6 16-14 0-7-6-13-13-13-3 0-6 1-8 3C33 4 29 2 24 2 15 2 8 8 8 16c0 1 0 2 1 3-5 1-9 6-9 11 0 7 6 12 14 12h26z"
          fill="#bbf7d0" stroke="#34d399" strokeWidth="2" />
        <text x="18" y="31" className="fill-emerald-700 text-[10px]">Internet</text>
      </g>
    </svg>
  );
}