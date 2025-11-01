"use client";
import React from "react";

type Concept = { id: string; name: string; mastered: boolean; progress: number };

export default function ConceptMastery({ concepts }: { concepts: Concept[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2 text-sm">Concept Mastery</div>
      <div className="space-y-2 text-xs">
        {concepts.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className={c.mastered ? "font-semibold text-emerald-700" : "text-slate-700"}>{c.name}</span>
                <span className="text-slate-500">{c.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${c.mastered ? "bg-emerald-500" : "bg-blue-500"} transition-all`}
                  style={{ width: `${c.progress}%` }}
                />
              </div>
            </div>
            {c.mastered && <span className="text-emerald-600">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

