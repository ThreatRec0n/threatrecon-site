"use client";
import React from "react";
import { motion } from "framer-motion";

export default function ProgressRing({ progress, label }: { progress: number; label: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    if (progress >= 90) return "text-emerald-500";
    if (progress >= 70) return "text-blue-500";
    if (progress >= 50) return "text-yellow-500";
    return "text-orange-500";
  };

  const getGradient = () => {
    if (progress >= 90) return "from-emerald-400 to-emerald-600";
    if (progress >= 70) return "from-blue-400 to-blue-600";
    if (progress >= 50) return "from-yellow-400 to-orange-500";
    return "from-orange-400 to-red-500";
  };

  return (
    <div className="relative w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24 drop-shadow-sm">
        <circle 
          cx="48" 
          cy="48" 
          r={radius} 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none" 
          className="text-slate-200" 
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={progress >= 90 ? "#10b981" : progress >= 70 ? "#3b82f6" : progress >= 50 ? "#f59e0b" : "#f97316"} />
            <stop offset="100%" stopColor={progress >= 90 ? "#059669" : progress >= 70 ? "#2563eb" : progress >= 50 ? "#d97706" : "#ea580c"} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className={`text-base font-bold ${getColor()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(progress)}%
          </motion.div>
          <div className="text-[9px] text-slate-600 font-medium mt-0.5">{label}</div>
        </motion.div>
      </div>
      {progress === 100 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs"
        >
          ✓
        </motion.div>
      )}
    </div>
  );
}

