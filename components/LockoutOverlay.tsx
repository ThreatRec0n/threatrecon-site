"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function LockoutOverlay({ active, onComplete }: { active: boolean; onComplete: ()=>void }) {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (!active) return;
    setSeconds(5);
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-red-900/80 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-xl p-8 text-center max-w-md"
      >
        <div className="text-6xl mb-4">⏸️</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Lockout Period</h2>
        <p className="text-slate-700 mb-4">Too many errors. Take a moment to think...</p>
        <div className="text-4xl font-bold text-red-600">{seconds}</div>
        <p className="text-xs text-slate-500 mt-2">seconds remaining</p>
      </motion.div>
    </motion.div>
  );
}

