"use client";
import React from "react";
import { motion } from "framer-motion";

type Hop = { ip: string; label: string; headers?: { src?: string; dst?: string; ttl?: number; proto?: string; size?: number } };

export default function PacketFlowAnim({ hops }: { hops: Hop[] }) {
  if (hops.length === 0) {
    return (
      <div className="p-3 rounded-lg border bg-white/90">
        <div className="font-medium mb-2 text-sm">📦 Packet Flow</div>
        <div className="text-xs text-slate-500 italic">Run a diagnostic to see packet flow</div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border bg-white/90 shadow-sm">
      <div className="font-medium mb-3 text-sm flex items-center gap-2">
        <span>📦</span>
        <span>Packet Flow Path</span>
        <span className="ml-auto text-[10px] font-normal text-slate-500">{hops.length} hops</span>
      </div>
      <div className="space-y-3">
        {hops.map((h, i) => (
          <div key={i} className="relative">
            {i < hops.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-3 bg-gradient-to-b from-blue-400 to-blue-200" />
            )}
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
              className="flex items-start gap-3 border-l-3 border-blue-400 pl-3 relative"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i === 0 ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-400" :
                i === hops.length - 1 ? "bg-orange-100 text-orange-700 border-2 border-orange-400" :
                "bg-blue-100 text-blue-700 border-2 border-blue-400"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-blue-700">{h.ip}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{h.label}</span>
                </div>
                {h.headers && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600 mt-1.5">
                    {h.headers.src && (
                      <div>
                        <span className="text-slate-500">src:</span> <span className="font-mono">{h.headers.src}</span>
                      </div>
                    )}
                    {h.headers.dst && (
                      <div>
                        <span className="text-slate-500">dst:</span> <span className="font-mono">{h.headers.dst}</span>
                      </div>
                    )}
                    {h.headers.ttl !== undefined && (
                      <div>
                        <span className="text-slate-500">TTL:</span> <span className="font-mono">{h.headers.ttl}</span>
                      </div>
                    )}
                    {h.headers.proto && (
                      <div>
                        <span className="text-slate-500">proto:</span> <span className="font-mono">{h.headers.proto}</span>
                      </div>
                    )}
                    {h.headers.size && (
                      <div className="col-span-2">
                        <span className="text-slate-500">size:</span> <span className="font-mono">{h.headers.size} bytes</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      {hops.length > 1 && (
        <div className="mt-3 pt-2 border-t text-[10px] text-slate-500 text-center">
          Total path: {hops.length} hops • Estimated RTT: {(hops.length * 20).toFixed(0)}ms
        </div>
      )}
    </div>
  );
}

