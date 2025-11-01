"use client";
import React from "react";
import { motion } from "framer-motion";

type Hop = { ip: string; label: string; headers?: { src?: string; dst?: string; ttl?: number } };

export default function PacketFlowAnim({ hops }: { hops: Hop[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2 text-sm">Packet Flow</div>
      <div className="space-y-2 text-xs">
        {hops.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-2 border-l-2 border-blue-400 pl-2"
          >
            <span className="font-mono text-blue-700">{h.ip}</span>
            <span className="text-slate-600">({h.label})</span>
            {h.headers && (
              <span className="text-slate-500 text-[10px]">
                src:{h.headers.src} dst:{h.headers.dst} ttl:{h.headers.ttl}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

