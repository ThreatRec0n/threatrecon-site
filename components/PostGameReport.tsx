"use client";
import React from "react";

type Report = {
  timeSpent: number;
  errors: number;
  commits: number;
  pings: number;
  success: boolean;
  achievements: string[];
};

export default function PostGameReport({ report, onClose }: { report: Report; onClose: ()=>void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[640px] max-w-[90%] rounded-xl border bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Post-Game Report</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded border">
            <div className="text-xs text-slate-500">Time Spent</div>
            <div className="text-lg font-semibold">{Math.floor(report.timeSpent / 60)}:{(report.timeSpent % 60).toString().padStart(2, "0")}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-xs text-slate-500">Errors</div>
            <div className={`text-lg font-semibold ${report.errors === 0 ? "text-emerald-600" : "text-red-600"}`}>{report.errors}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-xs text-slate-500">Commits</div>
            <div className="text-lg font-semibold">{report.commits}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-xs text-slate-500">Diagnostics</div>
            <div className="text-lg font-semibold">{report.pings}</div>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2">Achievements Earned</div>
          <div className="flex flex-wrap gap-2">
            {report.achievements.map(a => (
              <span key={a} className="px-2 py-1 rounded bg-yellow-100 text-xs">🏆 {a}</span>
            ))}
          </div>
        </div>
        <div className={`p-3 rounded ${report.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="font-semibold">{report.success ? "✅ Mission Complete!" : "❌ Mission Failed"}</div>
        </div>
        <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-slate-900 text-white rounded">Close</button>
      </div>
    </div>
  );
}

