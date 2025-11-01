"use client";
import React from "react";
import { motion } from "framer-motion";

type Challenge = {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  icon: string;
};

const challenges: Challenge[] = [
  {
    id: "basic",
    title: "Basic Connectivity",
    description: "Establish basic Internet connectivity",
    requirements: ["LAN host can ping 8.8.8.8", "SNAT configured", "Firewall allows ICMP"],
    difficulty: "Easy",
    icon: "🌐",
  },
  {
    id: "strict",
    title: "Strict Policy",
    description: "Only allow ICMP, block everything else",
    requirements: ["Default deny on WAN", "ICMP explicitly allowed", "No other protocols"],
    difficulty: "Medium",
    icon: "🔒",
  },
  {
    id: "multi-subnet",
    title: "Multi-Subnet",
    description: "Configure multiple subnets with routing",
    requirements: ["LAN and DMZ configured", "Inter-subnet routing", "Separate gateways"],
    difficulty: "Hard",
    icon: "🔀",
  },
];

export default function ChallengeScenario({ selected, onSelect }: { selected?: string; onSelect: (id: string)=>void }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90 shadow-sm">
      <div className="font-medium mb-3 text-sm flex items-center gap-2">
        <span>🎮</span>
        <span>Challenge Scenarios</span>
      </div>
      <div className="space-y-2.5">
        {challenges.map((c, i) => {
          const isSelected = selected === c.id;
          const difficultyColors = {
            Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
            Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
            Hard: "text-red-600 bg-red-50 border-red-200",
          };

          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isSelected 
                  ? "bg-blue-50 border-blue-400 shadow-md" 
                  : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{c.description}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${difficultyColors[c.difficulty]}`}>
                  {c.difficulty}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="text-[10px] text-slate-500 mb-1">Requirements:</div>
                <ul className="space-y-0.5">
                  {c.requirements.map((req, idx) => (
                    <li key={idx} className="text-[10px] text-slate-700 flex items-start gap-1.5">
                      <span className="text-slate-400 mt-0.5">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

