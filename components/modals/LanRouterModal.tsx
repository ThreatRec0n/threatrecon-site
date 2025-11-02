import React, { useEffect, useState } from "react";
import DeviceTerminal, { ExecFn } from "@/components/terminal/DeviceTerminal";
import { isValidIp, isPrivate, sameSubnet } from "@/lib/net";

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

  // Validation: ip1 must be RFC1918, gateway in same subnet, ip2 optional
  const valid = isValidIp(ip1) && isPrivate(ip1) && 
    isValidIp(gw) && sameSubnet(ip1, mask, gw) &&
    (ip2 === "" || isValidIp(ip2));

  const commit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCommit({ ip1, ip2, gw });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <form className="modal w-[560px] rounded-xl bg-white shadow-2xl p-6 space-y-3" onSubmit={commit} onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold">LAN Router</div>
        <label className="block text-xs font-medium">IP Address 1</label>
        <input
          data-testid="lan-ip1"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={ip1}
          onChange={(e)=>setIp1(e.target.value)}
          placeholder="192.168.1.x"
        />
        <label className="block text-xs font-medium">IP Address 2</label>
        <input
          data-testid="lan-ip2"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={ip2}
          onChange={(e)=>setIp2(e.target.value)}
          placeholder="Optional"
        />
        <label className="block text-xs font-medium">Subnet Mask</label>
        <input
          data-testid="lan-mask"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={mask}
          onChange={(e)=>setMask(e.target.value)}
          placeholder="255.255.255.0"
        />
        <label className="block text-xs font-medium">Gateway</label>
        <input
          data-testid="lan-gw"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={gw}
          onChange={(e)=>setGw(e.target.value)}
          placeholder="e.g. 192.168.1.1"
        />
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

