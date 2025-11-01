"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const mistakes = [
  { 
    id: "subnet", 
    title: "Gateway outside subnet", 
    severity: "high",
    fix: "Gateway IP first 3 octets must match host IP. Use subnet calculator.", 
    example: "Host: 192.168.1.10, Gateway: 192.168.2.1 ❌ → 192.168.1.1 ✓",
    tip: "All devices in same subnet must share first 3 octets (e.g., 192.168.1.x)"
  },
  { 
    id: "snat", 
    title: "SNAT wrong CIDR", 
    severity: "high",
    fix: "SNAT source must match your LAN subnet exactly. Use /24 notation.", 
    example: "192.168.1.0/24 → Firewall WAN IP",
    tip: "The /24 means first 24 bits are network, last 8 bits are hosts"
  },
  { 
    id: "rules", 
    title: "Missing firewall rules", 
    severity: "critical",
    fix: "Need TWO rules: ALLOW ICMP on LAN (ingress) AND WAN (egress).", 
    example: "Rule 1: LAN ingress, Rule 2: WAN egress",
    tip: "Packets need permission both entering AND leaving the firewall"
  },
  { 
    id: "range", 
    title: "Wrong IP range", 
    severity: "medium",
    fix: "LAN uses 192.168.x.x, DMZ uses 10.x.x.x, WAN uses 203.0.113.x", 
    example: "Check IP Range Guide",
    tip: "Private ranges: 10.x (Class A), 172.16-31.x (Class B), 192.168.x (Class C)"
  },
  {
    id: "mask",
    title: "Invalid subnet mask",
    severity: "high",
    fix: "Use 255.255.255.0 (/24) for all private networks in this scenario.",
    example: "Mask: 255.255.255.0 ✓ | 255.255.0.0 ❌",
    tip: "Subnet mask must match CIDR prefix length"
  },
];

export default function CommonMistakes({ errorType }: { errorType?: string }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const relevant = errorType ? mistakes.filter(m => m.id === errorType) : mistakes;
  
  if (!open && !errorType) return (
    <button 
      onClick={()=>setOpen(true)} 
      className="text-xs text-blue-600 underline hover:text-blue-800 font-medium"
    >
      ⚠️ Common Mistakes
    </button>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg border bg-white/90 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>Common Mistakes</span>
          <span className="text-[10px] text-slate-500 font-normal">({relevant.length})</span>
        </div>
        <button 
          onClick={()=>setOpen(false)} 
          className="text-xs text-slate-500 hover:text-slate-900 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
        <AnimatePresence>
          {relevant.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border-l-3 pl-3 py-2 rounded-r ${
                m.severity === "critical" ? "border-red-500 bg-red-50" :
                m.severity === "high" ? "border-orange-500 bg-orange-50" :
                "border-yellow-500 bg-yellow-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span>{m.severity === "critical" ? "🔴" : m.severity === "high" ? "🟠" : "🟡"}</span>
                    <span>{m.title}</span>
                  </div>
                  <div className="text-slate-700 mb-1.5">{m.fix}</div>
                  <div className="text-slate-600 italic text-[10px] font-mono bg-white/50 px-2 py-1 rounded mb-1.5">
                    {m.example}
                  </div>
                  {expandedId === m.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 pt-2 border-t border-slate-300"
                    >
                      <div className="text-[10px] text-slate-600">
                        <span className="font-semibold">💡 Tip:</span> {m.tip}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                className="text-[10px] text-blue-600 hover:text-blue-800 mt-1"
              >
                {expandedId === m.id ? "▲ Hide tip" : "▼ Show tip"}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

