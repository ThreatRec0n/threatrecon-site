"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";

type Error = { time: number; msg: string; type: string };

export default function ErrorTimeline({ errors }: { errors: Error[] }) {
  const errorStats = useMemo(() => {
    const byType = errors.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return byType;
  }, [errors]);

  if (errors.length === 0) {
    return (
      <div className="p-3 rounded-lg border bg-white/90">
        <div className="font-medium mb-2 text-sm flex items-center gap-2">
          <span>📊</span>
          <span>Error Timeline</span>
        </div>
        <div className="text-xs text-emerald-600 italic text-center py-2">
          ✨ No errors yet - keep it up!
        </div>
      </div>
    );
  }

  const firstError = errors[0]?.time || Date.now();
  const getRelativeTime = (time: number) => {
    const diff = Math.floor((time - firstError) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ${diff % 60}s ago`;
  };

  return (
    <div className="p-3 rounded-lg border bg-white/90 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm flex items-center gap-2">
          <span>📊</span>
          <span>Error Timeline</span>
          <span className="text-[10px] text-slate-500 font-normal">({errors.length} total)</span>
        </div>
        {Object.keys(errorStats).length > 0 && (
          <div className="flex gap-1 text-[10px]">
            {Object.entries(errorStats).slice(0, 3).map(([type, count]) => (
              <span key={type} className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                {type}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
        {errors.slice(0, 10).map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2 border-l-3 border-red-400 pl-2.5 py-1.5 bg-red-50/50 rounded-r"
          >
            <div className="flex-shrink-0 w-16 text-slate-500 font-mono text-[10px]">
              {getRelativeTime(e.time)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-700 text-[11px] break-words">{e.msg}</div>
              {e.type && (
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Type: <span className="font-mono">{e.type}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {errors.length > 10 && (
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t">
            +{errors.length - 10} more errors
          </div>
        )}
      </div>
    </div>
  );
}

