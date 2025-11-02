import React, { useEffect, useState } from "react";
import DeviceTerminal, { ExecFn } from "@/components/terminal/DeviceTerminal";
import { isValidIp, isTestNetOrPublic, emptyToUndef, sameSubnet, gwInSubnet } from "@/lib/net";

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

  // Validation: gateway can be blank, but if present must be valid
  // If dhcp === 'none', need at least one valid WAN IP
  // Gateway rule: gw === "" || (isValidIp(gw) && gwInSubnet(ip, mask, gw))
  const wanIp = dhcp === "ip1" ? "172.31.0.1" : (dhcp === "ip2" ? "203.0.113.3" : (ip1 || ip2));
  const hasValidWanIp = dhcp !== "none" || (isValidIp(ip1) || isValidIp(ip2));
  const mask = "255.255.255.0";
  const gwOk = gw === "" || (isValidIp(gw) && isValidIp(wanIp) && gwInSubnet(wanIp, mask, gw));
  
  // If DHCP, gateway must be blank or valid public/test-net
  // If manual, gateway must be blank or in same /24 as chosen WAN IP
  const valid = hasValidWanIp && (gw === "" || gwOk);

  // Apply DHCP assignment
  const applyDhcp = () => {
    if (dhcp === "ip1") {
      setIp1("172.31.0.1");
    } else if (dhcp === "ip2") {
      setIp2("203.0.113.3");
    }
  };

  useEffect(() => {
    applyDhcp();
  }, [dhcp]); // eslint-disable-line

  const commit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    // Always preserve ip2 value, even if empty - never drop it
    onCommit({ 
      ip1: dhcp === "ip1" ? "172.31.0.1" : ip1.trim(), 
      ip2: dhcp === "ip2" ? "203.0.113.3" : ip2.trim(), // Keep as string, don't use emptyToUndef here
      gw: emptyToUndef(gw) ?? "", 
      dhcp 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center" onClick={onClose}>
      <form className="modal w-[560px] rounded-xl bg-white shadow-2xl p-6 space-y-3" onSubmit={commit} onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold">WAN Router</div>
        <div className="pt-1">
          <div className="text-xs font-medium mb-1">DHCP</div>
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
          {dhcp !== "none" && (
            <div className="text-xs text-slate-500 italic mt-1">WAN IP will be assigned automatically at runtime.</div>
          )}
        </div>
        <label className="block text-xs font-medium">IP Address 1</label>
        <input
          data-testid="wan-ip1"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={ip1}
          onChange={(e)=>setIp1(e.target.value)}
          placeholder="203.0.113.x"
          disabled={dhcp === "ip1"}
          readOnly={dhcp === "ip1"}
        />
        <label className="block text-xs font-medium">IP Address 2</label>
        <input
          data-testid="wan-ip2"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
          value={ip2 ?? ''}
          onChange={(e)=>setIp2(e.target.value)}
          placeholder="Optional"
          disabled={dhcp === "ip2"}
          readOnly={dhcp === "ip2"}
        />
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
              <DeviceTerminal source={{kind:"wan", id:"wan_gw"}} onExec={onExec} />
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

