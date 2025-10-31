"use client";
import React from "react";

type Item = { id: string; label: string; ok: boolean; hint?: string };

export default function ChecklistPanel({ items }: { items: Item[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2">Autograder</div>
      <ul className="space-y-1 text-sm">
        {items.map(it => (
          <li key={it.id} className="flex items-start gap-2">
            <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${it.ok?"bg-emerald-500 text-white":"bg-red-500 text-white"}`}>
              {it.ok?"✓":"✕"}
            </span>
            <div>
              <div className={it.ok?"text-slate-700":"text-slate-800"}>{it.label}</div>
              {!it.ok && it.hint && <div className="text-[11px] text-slate-500">{it.hint}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


