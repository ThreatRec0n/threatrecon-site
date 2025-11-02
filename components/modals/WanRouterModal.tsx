import React, { useEffect, useState } from "react";
import DeviceTerminal, { ExecFn } from "@/components/terminal/DeviceTerminal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initial?: {
    ip1?: string;
    ip2?: string;
    gw?: string;
    dhcp?: "none"|"ip1"|"ip2";
  };
  onCommit: (v: { ip1: string; ip2: string; gw: string; dhcp: "none"|"ip1"|"ip2" }) => void;
  onExec?: ExecFn;
};

const ipHint = "e.g. 203.0.113.1";

export default function WanRouterModal({ isOpen, onClose, onCommit, initial, onExec }: Props) {
  const [ip1, setIp1] = useState<string>("");
  const [ip2, setIp2] = useState<string>("");
  const [gw, setGw]   = useState<string>("");
  const [dhcp, setDhcp] = useState<"none"|"ip1"|"ip2">("none");

  // hydrate once when opened
  useEffect(() => {
    if (!isOpen) return;
    setIp1(initial?.ip1 ?? "");
    setIp2(initial?.ip2 ?? "");
    setGw(initial?.gw ?? "");
    setDhcp(initial?.dhcp ?? "none");
  }, [isOpen]); // eslint-disable-line

  if (!isOpen) return null;

  const isIp = (s: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s);
  const valid = (ip1 === "" || isIp(ip1)) && (ip2 === "" || isIp(ip2)) && (gw === "" || isIp(gw));

  const commit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCommit({ ip1, ip2, gw, dhcp });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <form className="modal w-[560px] rounded-xl bg-white shadow-2xl p-6 space-y-3" onSubmit={commit} onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold">WAN Router</div>
        <label className="block text-xs font-medium">IP Address 1</label>
        <input
          data-testid="wan-ip1"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={dhcp === "ip1" ? "203.0.113.2" : ip1}
          onChange={(e)=>setIp1(e.target.value)}
          placeholder="203.0.113.x"
          disabled={dhcp === "ip1"}
        />
        <label className="block text-xs font-medium">IP Address 2</label>
        <input
          data-testid="wan-ip2"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={dhcp === "ip2" ? "203.0.113.3" : ip2}
          onChange={(e)=>setIp2(e.target.value)}
          placeholder="Optional"
          disabled={dhcp === "ip2"}
        />
        <div className="pt-1">
          <div className="text-xs font-medium mb-1">DHCP (auto-assign TEST-NET-3)</div>
          <div className="flex gap-6 text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="wan-dhcp" checked={dhcp==="none"} onChange={()=>setDhcp("none")} />
              None
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="wan-dhcp" checked={dhcp==="ip1"} onChange={()=>setDhcp("ip1")} />
              IP1 via DHCP
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="radio" name="wan-dhcp" checked={dhcp==="ip2"} onChange={()=>setDhcp("ip2")} />
              IP2 via DHCP
            </label>
          </div>
        </div>
        <label className="block text-xs font-medium">Gateway</label>
        <input
          data-testid="wan-gw"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={gw}
          onChange={(e)=>setGw(e.target.value)}
          placeholder={ipHint}
        />
        {onExec && (
          <details className="mt-3 rounded-md bg-slate-900/60 border border-slate-800" open>
            <summary className="cursor-pointer text-xs px-3 py-2 text-slate-300">Terminal</summary>
            <div className="p-2">
              <DeviceTerminal source={{kind:"wan", id:"wan_rtr"}} onExec={onExec} />
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

