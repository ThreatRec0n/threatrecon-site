"use client";
import React from "react";

export default function AchievementBadge({ id, name, earned }: { id: string; name: string; earned: boolean }) {
  if (!earned) return null;
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-100 border border-yellow-300 text-xs">
      <span>🏆</span>
      <span>{name}</span>
    </div>
  );
}

