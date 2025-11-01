"use client";
import React from "react";

export default function StreakCounter({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-100 border border-yellow-300 text-xs font-semibold">
      <span>🔥</span>
      <span>{streak} streak</span>
    </div>
  );
}

