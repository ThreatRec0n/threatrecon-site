"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function IPRangeGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-slate-50 p-3 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-slate-700"
      >
        <span>📋 Private IP Address Ranges Reference</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="p-2 bg-white rounded border">
            <div className="font-semibold text-blue-700 mb-1">Class A: 10.0.0.0/8</div>
            <div className="text-slate-600">Range: 10.0.0.0 - 10.255.255.255</div>
            <div className="text-slate-500 italic">Common: 10.0.0.0/24 or 10.10.10.0/24</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-semibold text-purple-700 mb-1">Class B: 172.16.0.0/12</div>
            <div className="text-slate-600">Range: 172.16.0.0 - 172.31.255.255</div>
            <div className="text-slate-500 italic">Common: 172.16.0.0/24 or 172.20.0.0/24</div>
          </div>
          <div className="p-2 bg-white rounded border">
            <div className="font-semibold text-emerald-700 mb-1">Class C: 192.168.0.0/16</div>
            <div className="text-slate-600">Range: 192.168.0.0 - 192.168.255.255</div>
            <div className="text-slate-500 italic">Common: 192.168.1.0/24 or 192.168.0.0/24</div>
          </div>
          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="font-semibold text-yellow-800 text-[10px] mb-1">💡 TIP:</div>
            <div className="text-yellow-700 text-[10px]">
              Use <span className="font-mono">255.255.255.0</span> (subnet mask /24) for most configurations.
              All devices in the same subnet must share the first 3 octets of their IP address.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

