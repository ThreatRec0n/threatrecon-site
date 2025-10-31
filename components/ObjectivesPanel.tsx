"use client";
import React from "react";

type Obj = { id: string; text: string; done: boolean };

export default function ObjectivesPanel({ title, items }: { title: string; items: Obj[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2">{title}</div>
      <ul className="space-y-1 text-sm">
        {items.map(i=> (
          <li key={i.id} className="flex items-start gap-2">
            <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${i.done?"bg-emerald-500 text-white":"bg-amber-500 text-white"}`}>{i.done?"✓":"•"}</span>
            <span className={i.done?"text-slate-600":"text-slate-800"}>{i.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


