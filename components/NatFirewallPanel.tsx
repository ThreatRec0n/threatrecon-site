"use client";
import React, { useMemo, useState } from "react";
import type { Firewall, FirewallRule } from "@/lib/sim/types";

export type NatRule = {
  id: string;
  direction: "outbound" | "inbound";
  iface: "dmz" | "lan" | "wan";
  type: "SNAT" | "DNAT" | "PASS";
  protocol: "any" | "tcp" | "udp" | "icmp";
  src: string;
  dst: string;
  srcPort?: string;
  dstPort?: string;
  translateTo?: string; // for SNAT/DNAT
  enabled: boolean;
};

export type FirewallState = {
  ifaces: { dmz: string; lan: string; wan: string };
  rules: NatRule[];
  allowIcmp: boolean;
};

export default function NatFirewallPanel({
  fw,
  onChange,
}: {
  fw: any;
  onChange: (f: Firewall) => void;
}) {
  const [form, setForm] = useState<NatRule>({
    id: "",
    direction: "outbound",
    iface: "wan",
    type: "SNAT",
    protocol: "any",
    src: "",
    dst: "",
    srcPort: "",
    dstPort: "",
    translateTo: "",
    enabled: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () =>
    setForm({
      id: "",
      direction: "outbound",
      iface: "wan",
      type: "SNAT",
      protocol: "any",
      src: "",
      dst: "",
      srcPort: "",
      dstPort: "",
      translateTo: "",
      enabled: true,
    });

  const upsertRule = () => {
    // Convert NatRule to FirewallRule format and update firewall
    const ruleData: FirewallRule = {
      action: form.enabled ? "ALLOW" : "DENY",
      proto: form.protocol === "any" ? "ANY" : (form.protocol.toUpperCase() as "ICMP" | "DNS" | "HTTP"),
      src: form.src || "ANY",
      dst: form.dst || "ANY",
      inIface: form.iface,
    };

    if (editingId) {
      const updated = (fw.rules || []).map((r: any, idx: number) => {
        // Simple index-based matching for now
        if (idx === parseInt(editingId)) {
          return ruleData;
        }
        return r;
      });
      onChange({ ...fw, rules: updated });
      setEditingId(null);
      resetForm();
    } else {
      onChange({ ...fw, rules: [...(fw.rules || []), ruleData] });
      
      // Also set SNAT if type is SNAT
      if (form.type === "SNAT" && form.translateTo) {
        onChange({
          ...fw,
          rules: [...(fw.rules || []), ruleData],
          nat: {
            ...(fw.nat || {}),
            snat: {
              srcCidr: form.src || "192.168.1.0/24",
              toIp: form.translateTo,
              outIface: form.iface,
            },
          },
        });
      } else {
        onChange({ ...fw, rules: [...(fw.rules || []), ruleData] });
      }
      resetForm();
    }
  };

  const removeRule = (idx: number) => {
    const updated = (fw.rules || []).filter((_: any, i: number) => i !== idx);
    onChange({ ...fw, rules: updated });
    if (editingId === String(idx)) {
      setEditingId(null);
      resetForm();
    }
  };

  const editRule = (idx: number, r: FirewallRule) => {
    setEditingId(String(idx));
    // Convert FirewallRule back to form format
    setForm({
      id: String(idx),
      direction: r.inIface === "wan" ? "outbound" : "inbound",
      iface: r.inIface || "wan",
      type: fw.nat?.snat && r.src.includes("192.168.1") ? "SNAT" : "PASS",
      protocol: r.proto === "ANY" ? "any" : (r.proto.toLowerCase() as "tcp" | "udp" | "icmp"),
      src: r.src,
      dst: r.dst,
      srcPort: "",
      dstPort: "",
      translateTo: fw.nat?.snat?.toIp || "",
      enabled: r.action === "ALLOW",
    });
  };

  const toggleEnable = (idx: number) => {
    const updated = (fw.rules || []).map((r: FirewallRule, i: number) =>
      i === idx ? { ...r, action: r.action === "ALLOW" ? "DENY" : "ALLOW" } : r
    );
    onChange({ ...fw, rules: updated });
  };

  const summarize = (r: FirewallRule) => {
    const base = `${r.inIface || "any"}/${r.proto}`;
    const endpoints = `${r.src} → ${r.dst}`;
    const action = r.action;
    return `${action} • ${base} • ${endpoints}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Rule Builder */}
        <div className="p-3 border rounded-lg bg-white/85 backdrop-blur">
          <div className="font-medium mb-2">{editingId !== null ? "Edit Rule" : "Create NAT/Policy Rule"}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Direction</div>
              <select
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as NatRule["direction"] })}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </label>
            <label className="col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Interface</div>
              <select
                value={form.iface}
                onChange={(e) => setForm({ ...form, iface: e.target.value as NatRule["iface"] })}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="dmz">DMZ</option>
                <option value="lan">LAN</option>
                <option value="wan">WAN</option>
              </select>
            </label>
            <label className="col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Type</div>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as NatRule["type"] })}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="SNAT">SNAT</option>
                <option value="DNAT">DNAT</option>
                <option value="PASS">Pass</option>
              </select>
            </label>
            <label className="col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Protocol</div>
              <select
                value={form.protocol}
                onChange={(e) => setForm({ ...form, protocol: e.target.value as NatRule["protocol"] })}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="any">Any</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </label>
            <label className="col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Source</div>
              <input
                value={form.src}
                onChange={(e) => setForm({ ...form, src: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="192.168.1.0/24 or any"
              />
            </label>
            <label className="col-span-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Destination</div>
              <input
                value={form.dst}
                onChange={(e) => setForm({ ...form, dst: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="any or 8.8.8.8"
              />
            </label>
            <label>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Src Port</div>
              <input
                value={form.srcPort || ""}
                onChange={(e) => setForm({ ...form, srcPort: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="any"
              />
            </label>
            <label>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Dst Port</div>
              <input
                value={form.dstPort || ""}
                onChange={(e) => setForm({ ...form, dstPort: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="80,443,any"
              />
            </label>
            <label className="col-span-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Translate To (SNAT/DNAT)</div>
              <input
                value={form.translateTo || ""}
                onChange={(e) => setForm({ ...form, translateTo: e.target.value })}
                className="border rounded px-2 py-1 w-full"
                placeholder="e.g., 203.0.113.2"
              />
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={upsertRule} className="px-3 py-1 border rounded bg-slate-900 text-white">
              {editingId !== null ? "Save changes" : "Add rule"}
            </button>
            {editingId !== null && (
              <button
                onClick={() => {
                  setEditingId(null);
                  resetForm();
                }}
                className="px-3 py-1 border rounded bg-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Rules Table */}
        <div className="p-3 border rounded-lg bg-white/85 backdrop-blur">
          <div className="font-medium mb-2">Current Rules</div>
          <div className="overflow-auto max-h-[400px]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-3">On/Off</th>
                  <th className="py-2 pr-3">Interface</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Protocol</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Destination</th>
                  <th className="py-2 pr-3">Summary</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(fw.rules || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-slate-400 text-center">
                      No rules yet. Add a rule to get started.
                    </td>
                  </tr>
                )}
                {(fw.rules || []).map((r: FirewallRule, idx: number) => (
                  <tr key={idx} className={`border-t ${r.action === "DENY" ? "opacity-60" : ""}`}>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={r.action === "ALLOW"}
                        onChange={() => toggleEnable(idx)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-2 pr-3 uppercase text-xs">{r.inIface || "any"}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        r.action === "ALLOW" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{r.proto}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.src}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.dst}</td>
                    <td className="py-2 pr-3 text-slate-600 text-xs">{summarize(r)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:underline text-xs"
                          onClick={() => editRule(idx, r)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline text-xs"
                          onClick={() => removeRule(idx)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SNAT Configuration */}
      {fw.nat?.snat && (
        <div className="p-3 border rounded-lg bg-emerald-50/50 backdrop-blur">
          <div className="font-medium mb-2 text-sm">Active SNAT</div>
          <div className="text-xs text-slate-600">
            <span className="font-mono">{fw.nat.snat.srcCidr}</span> → <span className="font-mono">{fw.nat.snat.toIp}</span> (out: {fw.nat.snat.outIface})
          </div>
        </div>
      )}
    </div>
  );
}
