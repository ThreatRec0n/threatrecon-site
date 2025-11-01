"use client";
import React from "react";
import { motion } from "framer-motion";

type Step = { id: string; title: string; done: boolean; next?: boolean };

export default function LearningPath({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter(s => s.done).length;
  const progress = (doneCount / steps.length) * 100;
  const nextStep = steps.find(s => s.next && !s.done);

  return (
    <div className="p-3 rounded-lg border bg-white/90 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm flex items-center gap-2">
          <span>🎯</span>
          <span>Learning Path</span>
        </div>
        <div className="text-[10px] text-slate-500">
          {doneCount}/{steps.length} complete
        </div>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1 text-[10px] text-slate-600">
          <span>Progress</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
          />
        </div>
      </div>
      <div className="space-y-2.5 text-xs">
        {steps.map((s, i) => {
          const isActive = s.next && !s.done;
          const isDone = s.done;
          const isPending = !s.done && !s.next;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                isActive ? "bg-blue-50 border border-blue-200" :
                isDone ? "bg-emerald-50/50 border border-emerald-200/50" :
                "border border-transparent"
              }`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                isDone ? "bg-emerald-500 text-white shadow-sm" :
                isActive ? "bg-blue-500 text-white border-2 border-blue-700 shadow-lg animate-pulse" :
                "bg-slate-200 text-slate-500"
              }`}>
                {isDone ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`transition-all ${
                  isDone ? "text-slate-600 line-through" : 
                  isActive ? "font-semibold text-blue-700" : 
                  "text-slate-500"
                }`}>
                  {s.title}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-blue-600 mt-1"
                  >
                    ← You are here
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      {nextStep && (
        <div className="mt-3 pt-2 border-t text-[10px] text-slate-600">
          <span className="font-semibold">Next:</span> {nextStep.title}
        </div>
      )}
    </div>
  );
}

