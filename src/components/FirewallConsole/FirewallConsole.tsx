import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../../contexts/GameContext'
import { IconShield } from '../shared/Icons'

type Direction = 'In' | 'Out'
type Action = 'Allow' | 'Block'
type Category = 'Web' | 'RDP' | 'SMB' | 'DNS' | 'Custom' | 'C2'

interface FwRule {
  id: string
  name: string
  enabled: boolean
  direction: Direction
  action: Action
  protocol: 'TCP' | 'UDP' | 'Any'
  remoteIP: string
  port: string
  category: Category
  pinned?: boolean
}

const DEFAULT_RULES: FwRule[] = [
  { id: 'r-rdp', name: 'Remote Desktop (RDP)', enabled: true, direction: 'In', action: 'Allow', protocol: 'TCP', remoteIP: '10.0.0.0/16', port: '3389', category: 'RDP' },
  { id: 'r-smb-in', name: 'File and Printer Sharing (SMB)', enabled: true, direction: 'In', action: 'Allow', protocol: 'TCP', remoteIP: '10.0.0.0/16', port: '445', category: 'SMB' },
  { id: 'r-https-out', name: 'HTTPS outbound', enabled: true, direction: 'Out', action: 'Allow', protocol: 'TCP', remoteIP: 'Any', port: '443', category: 'Web' },
  { id: 'r-http-out', name: 'HTTP outbound', enabled: true, direction: 'Out', action: 'Allow', protocol: 'TCP', remoteIP: 'Any', port: '80', category: 'Web' },
  { id: 'r-dns-out', name: 'DNS outbound', enabled: true, direction: 'Out', action: 'Allow', protocol: 'UDP', remoteIP: '10.0.1.10', port: '53', category: 'DNS' },
  { id: 'r-dns-ext', name: 'DNS to external resolvers', enabled: true, direction: 'Out', action: 'Allow', protocol: 'UDP', remoteIP: 'Any', port: '53', category: 'DNS' },
  { id: 'r-icmp-in', name: 'Echo Request - ICMPv4-In', enabled: true, direction: 'In', action: 'Allow', protocol: 'Any', remoteIP: '10.0.0.0/16', port: 'ICMP', category: 'Custom' },
  { id: 'r-ldap', name: 'LDAP to DC', enabled: true, direction: 'Out', action: 'Allow', protocol: 'TCP', remoteIP: '10.0.1.1', port: '389,636', category: 'Custom' },
  { id: 'r-kerb', name: 'Kerberos to DC', enabled: true, direction: 'Out', action: 'Allow', protocol: 'TCP', remoteIP: '10.0.1.1', port: '88', category: 'Custom' },
  { id: 'r-block-tor', name: 'Block known TOR exit nodes', enabled: true, direction: 'Out', action: 'Block', protocol: 'Any', remoteIP: '185.220.0.0/16', port: 'Any', category: 'Custom' },
  { id: 'r-block-smb-out', name: 'Block outbound SMB to internet', enabled: true, direction: 'Out', action: 'Block', protocol: 'TCP', remoteIP: 'Any', port: '445', category: 'SMB' },
]

const CATEGORIES: Category[] = ['Web', 'RDP', 'SMB', 'DNS', 'Custom', 'C2']

const threatLevel = (rules: FwRule[], c2Blocked: boolean): { label: string; color: string } => {
  if (!c2Blocked) return { label: 'CRITICAL', color: 'text-red-300 border-red-500/40 bg-red-500/10' }
  const blockingTor = rules.find((r) => r.id === 'r-block-tor' && r.enabled)
  if (!blockingTor) return { label: 'HIGH', color: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10' }
  return { label: 'GUARDED', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' }
}

export function FirewallConsole() {
  const { caseDef, hardeningDone, toggleHardening, exfilBlocked, markExfilBlocked, firewall, recordOperativeMilestone } =
    useGame()
  const c2Ip = caseDef?.c2Ip ?? '185.220.101.47'

  const [rules, setRules] = useState<FwRule[]>(() => DEFAULT_RULES)
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState<FwRule>(() => ({
    id: `r-custom-${Date.now()}`,
    name: '',
    enabled: true,
    direction: 'Out',
    action: 'Block',
    protocol: 'Any',
    remoteIP: '',
    port: 'Any',
    category: 'Custom',
  }))

  const c2Blocked = exfilBlocked || rules.some((r) => r.action === 'Block' && r.remoteIP === c2Ip && r.enabled)

  /* Push existing C2-block hardening rules into the firewall sim if user toggles them */
  useEffect(() => {
    if (!firewall) return
    rules
      .filter((r) => r.action === 'Block' && r.enabled)
      .forEach((r) => {
        try {
          firewall.add({
            name: r.name,
            direction: r.direction,
            action: r.action,
            protocol: r.protocol,
            remoteIp: r.remoteIP,
            remotePort: r.port,
          })
        } catch {
          /* duplicate names are fine */
        }
      })
  }, [rules, firewall])

  const visible = useMemo(() => (filter === 'All' ? rules : rules.filter((r) => r.category === filter)), [rules, filter])

  const counts = useMemo(() => {
    return {
      total: rules.length,
      enabled: rules.filter((r) => r.enabled).length,
      block: rules.filter((r) => r.action === 'Block' && r.enabled).length,
      allow: rules.filter((r) => r.action === 'Allow' && r.enabled).length,
    }
  }, [rules])

  const tl = threatLevel(rules, c2Blocked)

  const blockC2 = () => {
    if (rules.some((r) => r.id === `r-block-c2-${c2Ip}`)) return
    setRules((rs) => [
      {
        id: `r-block-c2-${c2Ip}`,
        name: `Block C2 — ${c2Ip}`,
        enabled: true,
        direction: 'Out',
        action: 'Block',
        protocol: 'Any',
        remoteIP: c2Ip,
        port: 'Any',
        category: 'C2',
        pinned: true,
      },
      ...rs,
    ])
    markExfilBlocked()
    recordOperativeMilestone('firewallBlockedC2')
    /* check off any matching hardening step */
    if (caseDef) {
      const block = caseDef.correctHardeningSteps.find((h) => /firewall|block|c2/i.test(h.label))
      if (block && !hardeningDone[block.id]) toggleHardening(block.id)
    }
  }

  const togglePower = (id: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  const toggleAction = (id: string) =>
    setRules((rs) =>
      rs.map((r) => (r.id === id ? { ...r, action: r.action === 'Allow' ? 'Block' : 'Allow' } : r)),
    )
  const remove = (id: string) =>
    setRules((rs) => rs.filter((r) => r.id !== id || r.pinned))

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      {/* HUD */}
      <div className="grid grid-cols-4 gap-3 border-b border-white/10 bg-[#0f1824] p-3 font-mono">
        <Stat label="Active rules" value={`${counts.enabled} / ${counts.total}`} />
        <Stat label="Allow rules" value={String(counts.allow)} valueClass="text-emerald-300" />
        <Stat label="Block rules" value={String(counts.block)} valueClass="text-yellow-300" />
        <div className={`flex items-center gap-2 rounded border px-3 py-2 ${tl.color}`}>
          <IconShield size={20} />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wider opacity-80">Threat level</div>
            <div className="font-display text-base">{tl.label}</div>
          </div>
        </div>
      </div>

      {/* C2 banner */}
      <div
        className={`flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2 font-mono text-[11px] ${
          c2Blocked
            ? 'bg-emerald-500/10 text-emerald-200'
            : 'bg-red-500/10 text-red-200'
        }`}
      >
        <span>
          {c2Blocked ? '✓ C2 traffic to ' : '⚠ C2 NOT BLOCKED — '}
          <span className="text-[#5e9bff]">{c2Ip}</span>
          {c2Blocked ? ' is dropped at egress.' : ' — outbound channel still open.'}
        </span>
        {!c2Blocked ? (
          <button
            type="button"
            onClick={blockC2}
            className="rounded bg-red-500/30 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-500/50"
          >
            Block {c2Ip}
          </button>
        ) : null}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#0a0e1a] px-3 py-2">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded px-2 py-1 font-mono text-[11px] ${
              filter === c ? 'bg-[#5e9bff]/15 text-[#5e9bff]' : 'text-[#a8b6ca] hover:bg-white/5'
            }`}
          >
            {c}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="ml-auto rounded border border-white/10 px-3 py-1 font-mono text-[11px] hover:bg-white/5"
        >
          {showAdd ? 'Close' : '+ New rule'}
        </button>
      </div>

      {showAdd ? (
        <div className="grid grid-cols-6 items-end gap-2 border-b border-white/10 bg-[#0a0e1a] p-3 font-mono text-[11px]">
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1"
            />
          </Field>
          <Field label="Direction">
            <select
              value={draft.direction}
              onChange={(e) => setDraft({ ...draft, direction: e.target.value as Direction })}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1"
            >
              <option>In</option>
              <option>Out</option>
            </select>
          </Field>
          <Field label="Action">
            <select
              value={draft.action}
              onChange={(e) => setDraft({ ...draft, action: e.target.value as Action })}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1"
            >
              <option>Block</option>
              <option>Allow</option>
            </select>
          </Field>
          <Field label="Protocol">
            <select
              value={draft.protocol}
              onChange={(e) => setDraft({ ...draft, protocol: e.target.value as 'TCP' | 'UDP' | 'Any' })}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1"
            >
              <option>Any</option>
              <option>TCP</option>
              <option>UDP</option>
            </select>
          </Field>
          <Field label="Remote IP">
            <input
              value={draft.remoteIP}
              onChange={(e) => setDraft({ ...draft, remoteIP: e.target.value })}
              placeholder="0.0.0.0/0"
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1"
            />
          </Field>
          <Field label="Port">
            <input
              value={draft.port}
              onChange={(e) => setDraft({ ...draft, port: e.target.value })}
              placeholder="Any"
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1"
            />
          </Field>
          <button
            type="button"
            onClick={() => {
              if (!draft.name.trim() || !draft.remoteIP.trim()) return
              setRules((rs) => [{ ...draft, id: `r-custom-${Date.now()}` }, ...rs])
              setDraft({ ...draft, name: '', remoteIP: '' })
              setShowAdd(false)
            }}
            className="col-span-6 rounded bg-[#5e9bff] px-3 py-1.5 text-[11px] font-semibold text-[#060a12]"
          >
            Add rule
          </button>
        </div>
      ) : null}

      {/* Rules table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono">
          <thead className="sticky top-0 z-10 bg-[#0f1824] text-[10px] uppercase text-[#8a9ab5]">
            <tr>
              <th className="p-2 text-left">On</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Dir</th>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-left">Proto</th>
              <th className="p-2 text-left">Remote</th>
              <th className="p-2 text-left">Port</th>
              <th className="p-2 text-left">Cat</th>
              <th className="p-2 text-right">{' '}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-white/5 hover:bg-white/5 ${
                  r.action === 'Block' ? 'text-red-200' : ''
                }`}
              >
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={() => togglePower(r.id)}
                    className="accent-[#5e9bff]"
                  />
                </td>
                <td className="p-2 text-[#e8edf5]">{r.name}</td>
                <td className="p-2 text-[#a8b6ca]">{r.direction}</td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => toggleAction(r.id)}
                    className={`rounded px-2 py-0.5 text-[10px] ${
                      r.action === 'Allow'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-red-500/15 text-red-300'
                    }`}
                  >
                    {r.action}
                  </button>
                </td>
                <td className="p-2">{r.protocol}</td>
                <td className="p-2 text-[#a8b6ca]">{r.remoteIP}</td>
                <td className="p-2">{r.port}</td>
                <td className="p-2 text-[#5e9bff]">{r.category}</td>
                <td className="p-2 text-right">
                  {!r.pinned ? (
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="text-[10px] text-[#8a9ab5] hover:text-red-300"
                      title="Delete rule"
                    >
                      ✕
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hardening checklist (preserved from original) */}
      {caseDef ? (
        <div className="border-t border-white/10 bg-[#0a0e1a] px-3 py-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#8a9ab5]">
            Hardening checklist
          </div>
          <ul className="mt-2 space-y-1.5">
            {caseDef.correctHardeningSteps.map((h) => (
              <li key={h.id}>
                <label className="flex cursor-pointer items-start gap-2 font-mono text-[11px]">
                  <input
                    type="checkbox"
                    checked={!!hardeningDone[h.id]}
                    onChange={() => toggleHardening(h.id)}
                    className="mt-0.5 accent-[#5e9bff]"
                  />
                  <span>{h.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  valueClass = '',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[#8a9ab5]">{label}</div>
      <div className={`font-display text-lg ${valueClass}`}>{value}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[#8a9ab5]">{label}</span>
      {children}
    </label>
  )
}
