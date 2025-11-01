"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type DeviceType = "firewall" | "lan-router" | "wan-router" | "lan-host" | "dmz-host";

type DeviceData = {
  type: DeviceType;
  dmz?: string;
  lan?: string;
  wan?: string;
  ip1?: string;
  ip2?: string;
  mask?: string;
  gw?: string;
};

export default function DeviceEditModal({ 
  open, 
  device, 
  data, 
  onChange, 
  onClose,
  onCommit 
}: { 
  open: boolean; 
  device: DeviceType | null;
  data: DeviceData;
  onChange: (data: DeviceData) => void;
  onClose: () => void;
  onCommit: () => void;
}) {
  if (!open || !device) return null;

  const isValidIp = (ip?: string) => {
    if (!ip) return false;
    const parts = ip.split(".");
    return parts.length === 4 && parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === String(n);
    });
  };

  const getTitle = () => {
    if (device === "firewall") return "Firewall Interfaces";
    if (device === "lan-router") return "LAN Router";
    if (device === "wan-router") return "WAN Router";
    if (device === "lan-host") return "LAN Host";
    return "DMZ Host";
  };

  const getHints = () => {
    if (device === "firewall") return { dmz: "10.x.x.x", lan: "192.168.1.x", wan: "203.0.113.x" };
    if (device === "lan-router") return { ip1: "192.168.1.x (LAN)", ip2: "192.168.1.x (GW to FW)" };
    if (device === "wan-router") return { ip1: "203.0.113.x", ip2: "Gateway" };
    return {};
  };

  const hints = getHints();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border p-4 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{getTitle()}</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>
            
            <div className="space-y-3">
              {device === "firewall" && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">DMZ Interface</label>
                    <input
                      value={data.dmz || ""}
                      onChange={(e) => onChange({ ...data, dmz: e.target.value })}
                      placeholder={hints.dmz}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">LAN Interface</label>
                    <input
                      value={data.lan || ""}
                      onChange={(e) => onChange({ ...data, lan: e.target.value })}
                      placeholder={hints.lan}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">WAN Interface</label>
                    <input
                      value={data.wan || ""}
                      onChange={(e) => onChange({ ...data, wan: e.target.value })}
                      placeholder={hints.wan}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                </>
              )}
              
              {(device === "lan-router" || device === "wan-router") && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">IP Address 1</label>
                    <input
                      value={data.ip1 || ""}
                      onChange={(e) => onChange({ ...data, ip1: e.target.value })}
                      placeholder={hints.ip1 || "IP address"}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">IP Address 2 / Gateway</label>
                    <input
                      name={device === "wan-router" ? "wan-gateway" : "ip2"}
                      value={typeof data.ip2 === 'string' ? data.ip2 : ''}
                      onChange={(e) => onChange({ ...(data ?? {}), ip2: e.target.value })}
                      placeholder={hints.ip2 || "Gateway"}
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      readOnly={false}
                      disabled={false}
                      autoComplete="off"
                      inputMode="numeric"
                    />
                  </div>
                </>
              )}

              {(device === "lan-host" || device === "dmz-host") && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">IP Address</label>
                    <input
                      value={data.ip1 || ""}
                      onChange={(e) => onChange({ ...data, ip1: e.target.value })}
                      placeholder="192.168.1.x"
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Subnet Mask</label>
                    <input
                      value={data.mask || ""}
                      onChange={(e) => onChange({ ...data, mask: e.target.value })}
                      placeholder="255.255.255.0"
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Gateway</label>
                    <input
                      value={data.gw || ""}
                      onChange={(e) => onChange({ ...data, gw: e.target.value })}
                      placeholder="Gateway IP"
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={onCommit}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Commit
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

