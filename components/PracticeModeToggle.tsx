"use client";
import React from "react";

export default function PracticeModeToggle({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean)=>void }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer">
      <input type="checkbox" checked={enabled} onChange={e=>onToggle(e.target.checked)} />
      <span>Practice Mode (no penalties, unlimited time)</span>
    </label>
  );
}

