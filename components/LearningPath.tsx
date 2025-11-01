"use client";
import React from "react";

type Step = { id: string; title: string; done: boolean; next?: boolean };

export default function LearningPath({ steps }: { steps: Step[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2 text-sm">Learning Path</div>
      <div className="space-y-2 text-xs">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-start gap-2">
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              s.done ? "bg-emerald-500 text-white" :
              s.next ? "bg-blue-500 text-white border-2 border-blue-700" :
              "bg-slate-200 text-slate-500"
            }`}>
              {s.done ? "✓" : i + 1}
            </div>
            <span className={s.done ? "text-slate-600 line-through" : s.next ? "font-semibold text-blue-700" : "text-slate-500"}>
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

