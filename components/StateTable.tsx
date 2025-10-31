"use client";
import React from "react";

export default function StateTable({ entries }: { entries: { src: string; dst: string; proto: string; state: "NEW"|"ESTABLISHED"|"BLOCKED" }[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2">State Table</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-1 pr-3">Proto</th>
            <th className="py-1 pr-3">Source</th>
            <th className="py-1 pr-3">Destination</th>
            <th className="py-1 pr-3">State</th>
          </tr>
        </thead>
        <tbody>
          {entries.length===0 && (
            <tr><td colSpan={4} className="py-2 text-slate-400">No entries.</td></tr>
          )}
          {entries.map((e,idx)=> (
            <tr key={idx} className="border-t">
              <td className="py-1 pr-3">{e.proto}</td>
              <td className="py-1 pr-3 font-mono">{e.src}</td>
              <td className="py-1 pr-3 font-mono">{e.dst}</td>
              <td className={`py-1 pr-3 ${e.state==="ESTABLISHED"?"text-emerald-600":e.state==="BLOCKED"?"text-red-600":"text-slate-600"}`}>{e.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


