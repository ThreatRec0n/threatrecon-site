"use client";
import React from "react";

interface NetworkInfoProps {
  subnet: "dmz" | "lan" | "wan";
  requiredRange: string;
  description: string;
}

export default function NetworkInfo({ subnet, requiredRange, description }: NetworkInfoProps) {
  const bgColors = {
    dmz: "bg-yellow-50 border-yellow-200",
    lan: "bg-blue-50 border-blue-200",
    wan: "bg-rose-50 border-rose-200"
  };

  const textColors = {
    dmz: "text-yellow-800",
    lan: "text-blue-800",
    wan: "text-rose-800"
  };

  return (
    <div className={`p-2 rounded border ${bgColors[subnet]}`}>
      <div className={`font-semibold text-xs ${textColors[subnet]} mb-1`}>
        {subnet.toUpperCase()} Zone
      </div>
      <div className="text-xs text-slate-600 mb-1">{description}</div>
      <div className="text-[10px] font-mono text-slate-700">
        Required Range: <span className="font-bold">{requiredRange}</span>
      </div>
    </div>
  );
}

