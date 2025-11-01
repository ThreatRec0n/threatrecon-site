"use client";
import React from "react";

type Challenge = {
  id: string;
  title: string;
  description: string;
  requirements: string[];
};

const challenges: Challenge[] = [
  {
    id: "basic",
    title: "Basic Connectivity",
    description: "Establish basic Internet connectivity",
    requirements: ["LAN host can ping 8.8.8.8", "SNAT configured", "Firewall allows ICMP"],
  },
  {
    id: "strict",
    title: "Strict Policy",
    description: "Only allow ICMP, block everything else",
    requirements: ["Default deny on WAN", "ICMP explicitly allowed", "No other protocols"],
  },
];

export default function ChallengeScenario({ selected, onSelect }: { selected?: string; onSelect: (id: string)=>void }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2 text-sm">Challenge Scenarios</div>
      <div className="space-y-2">
        {challenges.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left p-2 rounded border text-xs ${
              selected === c.id ? "bg-blue-50 border-blue-300" : "border-slate-200"
            }`}
          >
            <div className="font-semibold">{c.title}</div>
            <div className="text-slate-600">{c.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

