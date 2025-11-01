"use client";
import React from "react";

export default function EnhancedPacketInspector({ 
  src, 
  dst, 
  translatedSrc, 
  proto = "ICMP",
  hops 
}: { 
  src?: string; 
  dst?: string; 
  translatedSrc?: string; 
  proto?: string;
  hops?: string[];
}) {
  return (
    <div className="p-3 rounded-lg border bg-white/90 text-sm">
      <div className="font-medium mb-2">Enhanced Packet Inspector</div>
      <div className="space-y-2 text-xs font-mono">
        <div className="grid grid-cols-2 gap-2">
          <div>Protocol: <span className="font-semibold">{proto}</span></div>
          <div>TTL: <span className="font-semibold">64</span></div>
          <div>Source: <span className="font-semibold">{src || "—"}</span></div>
          <div>Destination: <span className="font-semibold">{dst || "—"}</span></div>
          {translatedSrc && (
            <div className="col-span-2 text-emerald-600">NAT: {src} → {translatedSrc}</div>
          )}
        </div>
        {hops && hops.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="font-semibold mb-1">Path:</div>
            <div className="space-y-1">
              {hops.map((h, i) => (
                <div key={i} className="text-slate-600">
                  {i + 1}. {h}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

