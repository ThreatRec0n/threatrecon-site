"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SubnetCalculator() {
  const [ip, setIp] = useState("");
  const [mask, setMask] = useState("24");
  const [expanded, setExpanded] = useState(false);

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
    
    // Calculate subnet mask in dotted decimal
    const subnetMask = [
      (maskNum >>> 24) & 0xFF,
      (maskNum >>> 16) & 0xFF,
      (maskNum >>> 8) & 0xFF,
      maskNum & 0xFF
    ].join(".");
    
    // Calculate wildcard mask
    const wildcard = [
      (~(maskNum >>> 24)) & 0xFF,
      (~(maskNum >>> 16)) & 0xFF,
      (~(maskNum >>> 8)) & 0xFF,
      (~maskNum) & 0xFF
    ].join(".");
    
    // Determine class
    const firstOctet = parts[0];
    const ipClass = firstOctet <= 126 ? "Class A" : firstOctet <= 191 ? "Class B" : firstOctet <= 223 ? "Class C" : "Other";
    const isPrivate = (ip.startsWith("10.")) || 
                      (ip.startsWith("172.") && parts[1] >= 16 && parts[1] <= 31) ||
                      (ip.startsWith("192.168."));

    return { 
      network: network.join("."), 
      broadcast: broadcast.join("."), 
      firstUsable: firstUsable.join("."), 
      lastUsable: lastUsable.join("."), 
      usable,
      subnetMask,
      wildcard,
      ipClass,
      isPrivate,
      prefix
    };
  };

  const result = calculate();
  return (
    <div className="p-3 rounded-lg border bg-white/90 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">📐 Subnet Calculator</div>
        {result && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline"
          >
            {expanded ? "Less" : "More"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input 
          value={ip} 
          onChange={e=>setIp(e.target.value)} 
          placeholder="192.168.1.0" 
          className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400" 
        />
        <div className="flex gap-1">
          <input 
            type="number" 
            value={mask} 
            onChange={e=>setMask(e.target.value)} 
            min="0" 
            max="32" 
            className="border rounded px-2 py-1 text-xs flex-1 focus:ring-2 focus:ring-blue-400" 
          />
          <span className="text-xs self-center text-slate-500">/</span>
        </div>
      </div>
      {result && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-xs space-y-1.5 font-mono overflow-hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="p-1.5 bg-blue-50 rounded">
              <div className="text-[10px] text-slate-600">Network</div>
              <div className="font-semibold text-blue-700">{result.network}</div>
            </div>
            <div className="p-1.5 bg-red-50 rounded">
              <div className="text-[10px] text-slate-600">Broadcast</div>
              <div className="font-semibold text-red-700">{result.broadcast}</div>
            </div>
          </div>
          <div className="p-1.5 bg-emerald-50 rounded">
            <div className="text-[10px] text-slate-600">Usable Range</div>
            <div className="font-semibold text-emerald-700">{result.firstUsable} - {result.lastUsable}</div>
          </div>
          <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
            <span className="text-slate-600">Hosts:</span>
            <span className="font-semibold">{result.usable.toLocaleString()}</span>
          </div>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2 mt-2 border-t space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Subnet Mask:</span>
                <span className="font-semibold">{result.subnetMask}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Wildcard:</span>
                <span className="font-semibold">{result.wildcard}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">IP Class:</span>
                <span className="font-semibold">{result.ipClass}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Type:</span>
                <span className={`font-semibold ${result.isPrivate ? "text-emerald-600" : "text-orange-600"}`}>
                  {result.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">CIDR:</span>
                <span className="font-semibold">{ip}/{result.prefix}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

