"use client";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
type NodeKey = "WAN_ROUTER"|"FW"|"LAN1"|"LAN2"|"LAN_ROUTER"|"DMZ1"|"DMZ2"|"INTERNET";
type Node = { id: NodeKey; x: number; y: number; label: string; ip?: string; zone?: "lan"|"dmz"|"wan"|"internet"; status?: "ok"|"warning"|"error" };
type Link = { from: NodeKey; to: NodeKey; ok: boolean; active?: boolean };
export type TopologyProps = {
  nodes: Node[];
  links: Link[];
  packetPath?: NodeKey[];
  onNodeClick?: (id: NodeKey) => void;
  natOverlay?: { from: string; to: string; visible: boolean };
};
const zoneBg: Record<string,string> = {
  lan: "fill-blue-50",
  dmz: "fill-yellow-50",
  wan: "fill-rose-50",
  internet: "fill-emerald-50"
};
export default function TopologyCanvas({ nodes, links, packetPath, onNodeClick, natOverlay }: TopologyProps) {
  const map = Object.fromEntries(nodes.map(n=>[n.id, n]));
  const width = 860, height = 420;
  const segments: Array<{x1:number,y1:number,x2:number,y2:number; color:string}> = [];
  if (packetPath && packetPath.length>1) {
    for (let i=0;i<packetPath.length-1;i++){
      const a = map[packetPath[i]];
      const b = map[packetPath[i+1]];
      if (a && b) {
        const link = links.find(l => (l.from === packetPath[i] && l.to === packetPath[i+1]) || (l.to === packetPath[i] && l.from === packetPath[i+1]));
        const color = link?.ok ? "#10b981" : "#ef4444";
        segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y, color});
      }
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
        const baseColor = l.ok ? (internet ? "#16a34a" : "#0ea5e9") : "#ef4444";
        const dash = l.ok ? "0" : "6,6";
        const opacity = l.active ? 1 : 0.5;
        
        return (
          <g key={idx}>
            {/* Glow effect for active links */}
            {l.active && (
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={baseColor}
                strokeWidth="8"
                strokeDasharray={dash}
                opacity={0.3}
                className="animate-pulse"
              />
            )}
            {/* Main line */}
            <line
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={baseColor}
              strokeWidth="3"
              strokeDasharray={dash}
              opacity={opacity}
            />
          </g>
        );
      })}
      {nodes.map(n=>{
        const fill = n.zone ? zoneBg[n.zone].replace("fill-","") : "white";
        const statusColor = n.status === "ok" ? "#10b981" : n.status === "warning" ? "#f59e0b" : n.status === "error" ? "#ef4444" : "#10b981";
        return (
          <g key={n.id} transform={`translate(${n.x-32}, ${n.y-18})`} onClick={()=>onNodeClick?.(n.id)} className="cursor-pointer">
            <rect width="64" height="36" rx="8" className="fill-white stroke-slate-300" />
            {/* Status indicator */}
            <circle cx="6" cy="6" r="4" fill={statusColor} opacity={n.status ? 1 : 0.6}>
              {n.status === "ok" && <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />}
            </circle>
            {/* Status icon overlay */}
            {n.status === "warning" && <text x="2" y="9" className="fill-white text-[8px] font-bold">!</text>}
            {n.status === "error" && <text x="3" y="9" className="fill-white text-[8px] font-bold">✕</text>}
            {n.status === "ok" && <text x="4" y="9" className="fill-white text-[8px] font-bold">✓</text>}
            <text x="10" y="14" className="fill-slate-700 text-[10px]">{n.label}</text>
            {n.ip && <text x="10" y="26" className="fill-slate-500 text-[10px]">{n.ip}</text>}
          </g>
        );
      })}
      <AnimatePresence>
        {segments.length>0 && segments.map((seg, i)=>(
          <motion.g key={i}>
            {/* Glow trail */}
            <motion.circle
              r="6"
              fill={seg.color}
              initial={{ cx: seg.x1, cy: seg.y1, opacity: 0 }}
              animate={{ cx: seg.x2, cy: seg.y2, opacity: [0, 0.4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: i*0.25 }}
            />
            {/* Main packet */}
            <motion.rect
              width="6"
              height="6"
              rx="1"
              fill={seg.color}
              initial={{ x: seg.x1 - 3, y: seg.y1 - 3, opacity: 0 }}
              animate={{ x: seg.x2 - 3, y: seg.y2 - 3, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut", delay: i*0.25 }}
            />
          </motion.g>
        ))}
      </AnimatePresence>
      {/* Internet cloud with animation */}
      <g transform="translate(378, 8)">
        <motion.path
          d="M40 34c9 0 16-6 16-14 0-7-6-13-13-13-3 0-6 1-8 3C33 4 29 2 24 2 15 2 8 8 8 16c0 1 0 2 1 3-5 1-9 6-9 11 0 7 6 12 14 12h26z"
          fill="#bbf7d0"
          stroke="#34d399"
          strokeWidth="2"
          animate={{
            opacity: [0.7, 0.9, 0.7],
            filter: ["drop-shadow(0 0 4px rgba(52, 211, 153, 0.3))", "drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))", "drop-shadow(0 0 4px rgba(52, 211, 153, 0.3))"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <text x="18" y="31" className="fill-emerald-700 text-[10px]">Internet</text>
      </g>
      {/* NAT Overlay */}
      <AnimatePresence>
        {natOverlay?.visible && (
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none"
          >
            <rect
              x={map["FW"]?.x ? map["FW"].x - 80 : 350}
              y={map["FW"]?.y ? map["FW"].y - 30 : 190}
              width="160"
              height="24"
              rx="4"
              fill="rgba(15, 23, 42, 0.9)"
              stroke="#34d399"
              strokeWidth="1"
            />
            <text
              x={map["FW"]?.x ? map["FW"].x - 75 : 355}
              y={map["FW"]?.y ? map["FW"].y - 15 : 205}
              className="fill-emerald-400 text-[10px] font-mono"
            >
              NAT: {natOverlay.from} → {natOverlay.to}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}