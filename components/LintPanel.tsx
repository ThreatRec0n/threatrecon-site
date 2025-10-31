"use client";
import React from "react";

export type LintItem = { id: string; msg: string };

export default function LintPanel({ items }: { items: LintItem[] }) {
  if (!items.length) {
    return (
      <div className="p-3 rounded-lg border bg-white/90 text-sm text-emerald-700">No issues detected.</div>
    );
  }
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2">Lint</div>
      <ul className="list-disc ml-5 text-sm text-red-700">
        {items.map(i => (<li key={i.id}>{i.msg}</li>))}
      </ul>
    </div>
  );
}


