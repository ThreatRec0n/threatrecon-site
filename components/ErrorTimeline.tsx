"use client";
import React from "react";

type Error = { time: number; msg: string; type: string };

export default function ErrorTimeline({ errors }: { errors: Error[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2 text-sm">Error Timeline</div>
      <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
        {errors.map((e, i) => (
          <div key={i} className="flex items-start gap-2 border-l-2 border-red-400 pl-2">
            <span className="text-slate-500 font-mono">{new Date(e.time).toLocaleTimeString()}</span>
            <span className="text-slate-700">{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

