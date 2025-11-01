"use client";
import React from "react";

type Achievement = { id: string; name: string; description: string; earned: boolean; icon: string };

const allAchievements: Achievement[] = [
  { id: "firstCommit", name: "First Commit", description: "Committed your first device configuration", earned: false, icon: "🎯" },
  { id: "firstPing", name: "First Ping", description: "Successfully pinged the Internet", earned: false, icon: "📡" },
  { id: "zeroErrors", name: "Zero Errors", description: "Completed without making any errors", earned: false, icon: "✨" },
  { id: "speedRun", name: "Speed Run", description: "Completed with high oxygen remaining", earned: false, icon: "⚡" },
  { id: "streakMaster", name: "Streak Master", description: "Achieved a 10+ commit streak", earned: false, icon: "🔥" },
  { id: "perfectionist", name: "Perfectionist", description: "Mastered all network concepts", earned: false, icon: "🏆" },
];

export default function AchievementGallery({ earned }: { earned: Record<string, boolean> }) {
  return (
    <div className="p-4 rounded-lg border bg-white/90">
      <h3 className="font-bold mb-3 text-sm">Achievement Gallery</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {allAchievements.map(a => (
          <div
            key={a.id}
            className={`p-2 rounded border ${
              earned[a.id] ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 opacity-50"
            }`}
          >
            <div className="text-lg mb-1">{a.icon}</div>
            <div className={`font-semibold ${earned[a.id] ? "text-emerald-700" : "text-slate-500"}`}>{a.name}</div>
            <div className="text-[10px] text-slate-600 mt-1">{a.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

