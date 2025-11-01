"use client";
import React from "react";

export default function HelpOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: ()=>void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="w-[720px] max-w-[95%] rounded-xl border bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Help & Shortcuts</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-1">Goals</div>
            <ul className="list-disc ml-5 space-y-1 text-slate-700">
              <li>Configure valid private subnets and gateways</li>
              <li>Set firewall policy to allow ICMP egress</li>
              <li>Configure SNAT 192.168.1.0/24 → Firewall WAN</li>
              <li>Verify connectivity with ping and traceroute</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Shortcuts</div>
            <ul className="list-disc ml-5 space-y-1 text-slate-700">
              <li><span className="font-mono">Ctrl/⌘ + Enter</span>: Commit All</li>
              <li><span className="font-mono">Tab</span>: Move focus between inputs</li>
              <li><span className="font-mono">Enter</span>: Run CLI command</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Tips</div>
            <ul className="list-disc ml-5 space-y-1 text-slate-700">
              <li>First 3 octets must match for devices in same /24</li>
              <li>LAN router gateway must equal firewall LAN IP</li>
              <li>Use 203.0.113.x for WAN (test network)</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">About</div>
            <p className="text-slate-700">Client-only simulator for routing, firewall, and NAT reasoning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


