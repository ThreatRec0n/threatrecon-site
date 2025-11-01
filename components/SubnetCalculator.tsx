"use client";
import React, { useState } from "react";

export default function SubnetCalculator() {
  const [ip, setIp] = useState("");
  const [mask, setMask] = useState("24");

  const calculate = () => {
    if (!ip || !mask) return null;
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return null;
    const prefix = parseInt(mask, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

    const maskNum = (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const network = parts.map((p, i) => {
      const shift = 24 - (i * 8);
      return (maskNum >>> shift) & 0xFF & p;
    });
    const broadcast = network.map((n, i) => {
      const shift = 24 - (i * 8);
      const hostBits = (0xFFFFFFFF >>> prefix) >>> (24 - (i * 8));
      return n | (hostBits & 0xFF);
    });
    const firstUsable = [...network]; firstUsable[3]++;
    const lastUsable = [...broadcast]; lastUsable[3]--;
    const usable = Math.max(0, Math.pow(2, 32 - prefix) - 2);

    return { network: network.join("."), broadcast: broadcast.join("."), firstUsable: firstUsable.join("."), lastUsable: lastUsable.join("."), usable };
  };

  const result = calculate();
  return (
    <div className="p-3 rounded-lg border bg-white/90">
      <div className="font-medium mb-2 text-sm">Subnet Calculator</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.0" className="border rounded px-2 py-1 text-xs" />
        <input type="number" value={mask} onChange={e=>setMask(e.target.value)} min="0" max="32" className="border rounded px-2 py-1 text-xs" />
      </div>
      {result && (
        <div className="text-xs space-y-1 font-mono">
          <div>Network: <span className="font-semibold">{result.network}</span></div>
          <div>Broadcast: <span className="font-semibold">{result.broadcast}</span></div>
          <div>Usable: <span className="font-semibold">{result.firstUsable} - {result.lastUsable}</span></div>
          <div>Hosts: <span className="font-semibold">{result.usable}</span></div>
        </div>
      )}
    </div>
  );
}

