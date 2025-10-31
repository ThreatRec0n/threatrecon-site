"use client";
import React from "react";

export default function NatTable({ entries }: { entries: { src: string; to: string; iface: string }[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2">NAT Translations</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-1 pr-3">Source</th>
            <th className="py-1 pr-3">Translated</th>
            <th className="py-1 pr-3">Out Iface</th>
          </tr>
        </thead>
        <tbody>
          {entries.length===0 && (<tr><td colSpan={3} className="py-2 text-slate-400">No active translations.</td></tr>)}
          {entries.map((e,idx)=> (
            <tr key={idx} className="border-t">
              <td className="py-1 pr-3 font-mono">{e.src}</td>
              <td className="py-1 pr-3 font-mono">{e.to}</td>
              <td className="py-1 pr-3 uppercase">{e.iface}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


