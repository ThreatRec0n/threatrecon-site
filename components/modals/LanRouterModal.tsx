import React, { useEffect, useState } from "react";
import DeviceTerminal, { ExecFn } from "@/components/terminal/DeviceTerminal";
import { isValidIp, isValidMask, isPrivate, gwInSubnet, emptyToUndef } from "@/lib/net";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: {
    ip1?: string;
    ip2?: string;
    gw?: string;
  };
  onCommit: (v: { ip1: string; ip2: string; gw: string }) => void;
  onExec?: ExecFn;
};

export default function LanRouterModal({ isOpen, onClose, onCommit, initial, onExec }: Props) {
  const [ip1, setIp1] = useState<string>("");
  const [ip2, setIp2] = useState<string>("");
  const [gw, setGw] = useState<string>("");
  const [mask, setMask] = useState<string>("255.255.255.0");

  // hydrate once when opened
  useEffect(() => {
    if (!isOpen) return;
    setIp1(initial?.ip1 ?? "");
    setIp2(initial?.ip2 ?? "");
    setGw(initial?.gw ?? "");
  }, [isOpen]); // eslint-disable-line

  if (!isOpen) return null;

  // Validation: ip1 must be RFC1918, valid mask, gateway optional but if present must be in subnet, ip2 optional
  const ip1Valid = isValidIp(ip1) && isPrivate(ip1);
  const maskValid = isValidMask(mask);
  const gwValid = gw === "" || (isValidIp(gw) && gwInSubnet(ip1, mask, gw));
  const ip2Valid = ip2 === "" || isValidIp(ip2);
  const valid = ip1Valid && maskValid && gwValid && ip2Valid;

  const commit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    // Always preserve ip2 value, even if empty - never drop it
    onCommit({ 
      ip1: ip1.trim(),
      ip2: ip2.trim(), // Keep as string, don't use emptyToUndef here
      gw: emptyToUndef(gw) ?? ""
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <form className="modal w-[560px] rounded-xl bg-white shadow-2xl p-6 space-y-3" onSubmit={commit} onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold">LAN Router</div>
        <label className="block text-xs font-medium">IP Address 1</label>
        <input
          data-testid="lan-ip1"
          className={`w-full rounded-md border px-3 py-2 outline-none focus:ring ${ip1 && !ip1Valid ? 'border-red-300 bg-red-50/50' : ip1 && ip1Valid ? 'border-green-300 bg-green-50/50' : ''}`}
          value={ip1}
          onChange={(e)=>setIp1(e.target.value)}
          placeholder="192.168.1.x"
        />
        {ip1 && !ip1Valid && <div className="text-xs text-red-600 mt-0.5">Invalid IP address or must be private (RFC1918)</div>}
        <label className="block text-xs font-medium">IP Address 2</label>
        <input
          data-testid="lan-ip2"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={ip2 ?? ''}
          onChange={(e)=>setIp2(e.target.value)}
          placeholder="Optional"
        />
        <label className="block text-xs font-medium">Subnet Mask</label>
        <input
          data-testid="lan-mask"
          className={`w-full rounded-md border px-3 py-2 outline-none focus:ring ${mask && !maskValid ? 'border-red-300 bg-red-50/50' : mask && maskValid ? 'border-green-300 bg-green-50/50' : ''}`}
          value={mask}
          onChange={(e)=>setMask(e.target.value)}
          placeholder="255.255.255.0"
        />
        {mask && !maskValid && <div className="text-xs text-red-600 mt-0.5">Invalid subnet mask</div>}
        <label className="block text-xs font-medium">Gateway</label>
        <input
          data-testid="lan-gw"
          className={`w-full rounded-md border px-3 py-2 outline-none focus:ring ${gw && !gwValid ? 'border-red-300 bg-red-50/50' : gw && gwValid ? 'border-green-300 bg-green-50/50' : ''}`}
          value={gw}
          onChange={(e)=>setGw(e.target.value)}
          placeholder="e.g. 192.168.1.1"
        />
        {gw && !gwValid && <div className="text-xs text-red-600 mt-0.5">Invalid gateway or gateway must be in same subnet as IP1 (gateway can be blank)</div>}
        {onExec && (
          <details className="mt-3 rounded-md bg-slate-900/60 border border-slate-800" open>
            <summary className="cursor-pointer text-xs px-3 py-2 text-slate-300">Terminal</summary>
            <div className="p-2">
              <DeviceTerminal source={{kind:"lan", id:"lan_rtr"}} onExec={onExec} />
            </div>
          </details>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="px-3 py-2 rounded-md border" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-md bg-slate-900 text-white disabled:opacity-50" disabled={!valid}>
            Commit
          </button>
        </div>
      </form>
    </div>
  );
}

