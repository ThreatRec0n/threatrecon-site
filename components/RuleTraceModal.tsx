"use client";
import React from "react";

type Trace = { command: string; args: string[]; hops: string[]; success: boolean; reason?: string };

export default function RuleTraceModal({ trace, onClose }: { trace: Trace|null; onClose: ()=>void }) {
  if (!trace) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[560px] max-w-[90%] rounded-xl border bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Rule Trace</div>
          <button className="text-slate-500 hover:text-slate-800" onClick={onClose}>✕</button>
        </div>
        <div className="text-sm font-mono bg-slate-50 rounded border p-2 mb-2">
          $ {trace.command} {trace.args.join(" ")}
        </div>
        <div className="text-sm mb-2">
          <div className={trace.success?"text-emerald-600":"text-red-600"}>
            {trace.success?"ALLOWED":"BLOCKED"}{trace.reason?`: ${trace.reason}`:""}
          </div>
        </div>
        <div className="text-xs text-slate-700">
          <div className="font-semibold mb-1">Hops</div>
          <ol className="list-decimal ml-5">
            {trace.hops.map((h,i)=>(<li key={i} className="mb-0.5">{h}</li>))}
          </ol>
        </div>
      </div>
    </div>
  );
}


