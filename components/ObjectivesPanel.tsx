"use client";
import React from "react";

type Obj = { id: string; text: string; done: boolean };

export default function ObjectivesPanel({ title, items }: { title: string; items: Obj[] }) {
  return (
    <div className="p-2 rounded-lg border bg-white/90 text-xs">
      {title && <div className="font-medium mb-1.5 text-xs">{title}</div>}
      <ul className="space-y-1">
        {items.map(i=> (
          <li key={i.id} className="flex items-start gap-2">
            <span className={`mt-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full text-[8px] ${i.done?"bg-emerald-500 text-white":"bg-amber-500 text-white"}`}>{i.done?"✓":"•"}</span>
            <span className={`text-[10px] ${i.done?"text-slate-600 line-through":"text-slate-800"}`}>{i.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


