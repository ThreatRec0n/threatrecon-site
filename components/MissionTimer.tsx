"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MissionTimer({ 
  minutes=15, 
  onExpire,
  onTimeUpdate
}: {
  minutes?: number;
  onExpire: () => void;
  onTimeUpdate?: (remainingPercent: number) => void;
}) {
  const [end] = useState(() => Date.now() + minutes * 60 * 1000);
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);
  
  const remain = Math.max(0, end - now);
  const total = minutes * 60 * 1000;
  const elapsed = total - remain;
  const progress = Math.min(100, (elapsed / total) * 100);
  const remainingPercent = Math.max(0, (remain / total) * 100);
  
  const mm = String(Math.floor(remain / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
  const isLow = remain < 300000; // Less than 5 minutes
  
  // Notify parent of time update (for oxygen sync)
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(remainingPercent);
    }
  }, [remainingPercent, onTimeUpdate]);
  
  useEffect(() => {
    if (remain === 0) onExpire();
  }, [remain, onExpire]);
  
  return (
    <div className="relative px-3 py-1.5 rounded bg-slate-900 text-white text-xs font-mono select-none min-w-[100px]">
      <div className="flex items-center gap-2">
        <span className={isLow ? "animate-pulse" : ""}>⏱</span>
        <span className={isLow ? "text-red-400" : ""}>{mm}:{ss}</span>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700 rounded overflow-hidden">
        <motion.div
          className={`h-full ${isLow ? "bg-red-500" : "bg-emerald-500"}`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </div>
  );
}
