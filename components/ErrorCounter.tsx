"use client";
import React from "react";

export default function ErrorCounter({ count, onPenalty }: { count: number; onPenalty?: ()=>void }) {
  return (
    <div className="p-2 rounded-lg border bg-red-50 border-red-200">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-red-700">Errors:</span>
        <span className={`text-lg font-bold ${count >= 5 ? "animate-pulse text-red-800" : "text-red-600"}`}>{count}</span>
        {count >= 3 && <span className="text-xs text-red-600">⚠️ Penalties active</span>}
      </div>
    </div>
  );
}

