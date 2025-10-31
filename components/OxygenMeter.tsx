"use client";
import React from "react";
import { motion } from "framer-motion";

interface OxygenMeterProps {
  level: number; // 0-100
  onDepleted?: () => void;
}

export default function OxygenMeter({ level, onDepleted }: OxygenMeterProps) {
  const isCritical = level < 30;
  const isLow = level < 50;

  React.useEffect(() => {
    if (level <= 0 && onDepleted) {
      onDepleted();
    }
  }, [level, onDepleted]);

  return (
    <div className="fixed top-4 right-4 z-30 bg-slate-900/90 backdrop-blur border border-red-500/50 rounded-lg p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={isCritical ? "animate-pulse" : ""}>💨</span>
          <span className="text-xs font-bold text-white">OXYGEN</span>
        </div>
        <span className={`text-lg font-mono font-bold ${isCritical ? "text-red-400 animate-pulse" : isLow ? "text-yellow-400" : "text-emerald-400"}`}>
          {Math.max(0, Math.round(level))}%
        </span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <motion.div
          className={`h-full ${isCritical ? "bg-red-500" : isLow ? "bg-yellow-500" : "bg-emerald-500"}`}
          initial={{ width: "100%" }}
          animate={{ width: `${Math.max(0, level)}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
        {isCritical && (
          <motion.div
            className="absolute inset-0 bg-red-500 opacity-50"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      <div className="mt-1 text-[10px] text-slate-400 text-center">
        {isCritical ? "⚠️ CRITICAL LEVEL" : isLow ? "⚠️ LOW" : "✓ Normal"}
      </div>
    </div>
  );
}

