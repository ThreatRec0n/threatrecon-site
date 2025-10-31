"use client";
import React from "react";

export default function PacketInspector({ src, dst, translatedSrc, proto = "ICMP" }: { src?: string; dst?: string; translatedSrc?: string; proto?: string }) {
  return (
    <div className="p-3 rounded-lg border bg-white/90 text-sm">
      <div className="font-medium mb-2">Packet Inspector</div>
      <div className="grid grid-cols-2 gap-2 font-mono">
        <div>Proto: {proto}</div>
        <div>TTL: 64</div>
        <div>Src: {src || "—"}</div>
        <div>Dst: {dst || "—"}</div>
        <div>Translated Src: {translatedSrc || "—"}</div>
      </div>
    </div>
  );
}


