"use client";
import React from "react";
import { motion } from "framer-motion";

type Concept = { id: string; name: string; mastered: boolean; progress: number };

const conceptIcons: Record<string, string> = {
  subnetting: "📐",
  routing: "🛣️",
  nat: "🔄",
  firewall: "🔥",
};

export default function ConceptMastery({ concepts }: { concepts: Concept[] }) {
  const totalProgress = concepts.reduce((sum, c) => sum + c.progress, 0) / concepts.length;
  const masteredCount = concepts.filter(c => c.mastered).length;

  return (
    <div className="p-3 rounded-lg border bg-white/90 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm flex items-center gap-2">
          <span>📚</span>
          <span>Concept Mastery</span>
        </div>
        <div className="text-[10px] text-slate-500">
          {masteredCount}/{concepts.length} mastered
        </div>
      </div>
      <div className="space-y-2.5 text-xs">
        {concepts.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex-shrink-0 text-lg">{conceptIcons[c.id] || "📖"}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-semibold ${c.mastered ? "text-emerald-700" : c.progress > 0 ? "text-blue-700" : "text-slate-600"}`}>
                  {c.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${c.mastered ? "text-emerald-600" : "text-slate-500"}`}>
                    {c.progress}%
                  </span>
                  {c.mastered && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-emerald-600 text-sm"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
              </div>
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.progress}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`h-full rounded-full ${
                    c.mastered 
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
                      : c.progress > 50
                      ? "bg-gradient-to-r from-blue-400 to-blue-500"
                      : "bg-gradient-to-r from-yellow-400 to-orange-400"
                  }`}
                />
                {c.progress > 0 && c.progress < 100 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {masteredCount === concepts.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t text-center"
        >
          <div className="text-xs font-bold text-emerald-600">🎉 All Concepts Mastered!</div>
        </motion.div>
      )}
    </div>
  );
}


