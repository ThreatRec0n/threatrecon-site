"use client";
import React from "react";

type Row = { dest: string; gateway: string; iface: string; metric?: number };

export default function RoutingTable({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-1 pr-3">Destination</th>
            <th className="py-1 pr-3">Gateway</th>
            <th className="py-1 pr-3">Iface</th>
            <th className="py-1 pr-3">Metric</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,idx)=> (
            <tr key={idx} className="border-t">
              <td className="py-1 pr-3 font-mono">{r.dest}</td>
              <td className="py-1 pr-3 font-mono">{r.gateway}</td>
              <td className="py-1 pr-3">{r.iface}</td>
              <td className="py-1 pr-3">{r.metric ?? 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


