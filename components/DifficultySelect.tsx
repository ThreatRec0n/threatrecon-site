"use client";
import React from "react";
import { motion } from "framer-motion";

type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export default function DifficultySelect({ 
  onSelect 
}: { 
  onSelect: (d: Difficulty) => void 
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-8 max-w-md w-[90%] text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">🚪 Escape Room</h1>
        <p className="text-slate-300 mb-6">Select Difficulty Level</p>
        <div className="space-y-3">
          <button
            onClick={() => onSelect("Beginner")}
            className="w-full px-6 py-4 rounded-lg border-2 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-white font-semibold transition-colors"
          >
            <div className="text-xl mb-1">Beginner</div>
            <div className="text-sm text-slate-300">Detailed hints, basic validation</div>
          </button>
          <button
            onClick={() => onSelect("Intermediate")}
            className="w-full px-6 py-4 rounded-lg border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-white font-semibold transition-colors"
          >
            <div className="text-xl mb-1">Intermediate</div>
            <div className="text-sm text-slate-300">Moderate hints, stricter validation</div>
          </button>
          <button
            onClick={() => onSelect("Advanced")}
            className="w-full px-6 py-4 rounded-lg border-2 border-red-500 bg-red-500/10 hover:bg-red-500/20 text-white font-semibold transition-colors"
          >
            <div className="text-xl mb-1">Advanced</div>
            <div className="text-sm text-slate-300">Minimal hints, maximum validation</div>
          </button>
        </div>
        <div className="mt-6 text-sm text-slate-400">
          ⏱️ Time Limit: 30 minutes
        </div>
      </motion.div>
    </div>
  );
}

