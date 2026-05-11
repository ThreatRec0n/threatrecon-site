import { useMemo, useState } from 'react'
import type { CaseDefinition } from '../../types/case.types'
import { mergeProcessesForCase } from '../../hooks/useMergedProcesses'

type TMNav = 'processes' | 'performance' | 'startup' | 'users' | 'details' | 'services' | 'history'

const STARTUP_ROWS = [
  { name: 'Microsoft OneDrive', publisher: 'Microsoft', impact: 'Medium', enabled: true },
  { name: 'Teams Machine-Wide Installer', publisher: 'Microsoft', impact: 'Low', enabled: true },
  { name: 'SecurityHealthSystray', publisher: 'Microsoft', impact: 'Low', enabled: true },
  {
    name: 'msupdate.exe',
    publisher: 'Unknown',
    impact: 'High',
    enabled: true,
    suspicious: true,
  },
  { name: 'Adobe Acrobat Update', publisher: 'Adobe', impact: 'Low', enabled: false },
]

function fakeDisk(pid: number) {
  return ((pid * 13) % 28) / 10
}
function fakeNet(pid: number) {
  return ((pid * 3) % 15) / 10
}
function fakeGpu(pid: number) {
  return ((pid * 5) % 12) / 10
}

export function TaskManager({ caseDef }: { caseDef: CaseDefinition }) {
  const [nav, setNav] = useState<TMNav>('processes')
  const [sortCol, setSortCol] = useState<'cpu' | 'mem' | 'disk' | 'net' | 'gpu'>('cpu')
  const [procs, setProcs] = useState(() => mergeProcessesForCase(caseDef))

  const sorted = useMemo(() => {
    const copy = [...procs]
    copy.sort((a, b) => {
      switch (sortCol) {
        case 'mem':
          return b.memKb - a.memKb
        case 'disk':
          return fakeDisk(b.pid) - fakeDisk(a.pid)
        case 'net':
          return fakeNet(b.pid) - fakeNet(a.pid)
        case 'gpu':
          return fakeGpu(b.pid) - fakeGpu(a.pid)
        default:
          return (b.cpuPercent ?? 0) - (a.cpuPercent ?? 0)
      }
    })
    return copy
  }, [procs, sortCol])

  const navBtn = (id: TMNav, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setNav(id)}
      className={`block w-full px-3 py-2 text-left text-[12px] ${nav === id ? 'border-l-2 border-[#0078d4] bg-white/8 text-white' : 'border-l-2 border-transparent text-[#ccc] hover:bg-white/6'}`}
    >
      {label}
    </button>
  )

  return (
    <div
      className="flex h-full bg-[#202020] text-[12px] text-[#f3f3f3]"
      style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
    >
      <aside className="w-52 shrink-0 border-r border-black bg-[#2d2d2d] py-2">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#888]">
          Task Manager
        </div>
        {navBtn('processes', 'Processes')}
        {navBtn('performance', 'Performance')}
        {navBtn('history', 'App history')}
        {navBtn('startup', 'Startup')}
        {navBtn('users', 'Users')}
        {navBtn('details', 'Details')}
        {navBtn('services', 'Services')}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-black px-4 py-2">
          <span className="text-[14px] font-semibold">
            {nav === 'processes' ? 'Processes' : nav === 'performance' ? 'Performance' : nav === 'startup' ? 'Startup apps' : nav}
          </span>
          <button type="button" className="ml-auto rounded border border-white/15 px-3 py-1 hover:bg-white/8">
            Run new task
          </button>
          <button type="button" className="rounded border border-white/15 px-3 py-1 hover:bg-white/8">
            End Task
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          {nav === 'processes' ? (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#2d2d2d] text-[11px] uppercase text-[#aaa]">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="cursor-pointer p-2 text-right" onClick={() => setSortCol('cpu')}>
                    CPU %
                  </th>
                  <th className="cursor-pointer p-2 text-right" onClick={() => setSortCol('mem')}>
                    Memory
                  </th>
                  <th className="cursor-pointer p-2 text-right" onClick={() => setSortCol('disk')}>
                    Disk
                  </th>
                  <th className="cursor-pointer p-2 text-right" onClick={() => setSortCol('net')}>
                    Network
                  </th>
                  <th className="cursor-pointer p-2 text-right" onClick={() => setSortCol('gpu')}>
                    GPU
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={`${p.pid}-${p.name}`} className={`border-t border-white/6 hover:bg-white/[0.04] ${p.malicious ? 'bg-red-500/10 text-red-100' : ''}`}>
                    <td className="max-w-[240px] truncate p-2">{p.name}</td>
                    <td className="p-2 text-right tabular-nums">{p.cpuPercent?.toFixed(1) ?? '0.0'}</td>
                    <td className="p-2 text-right tabular-nums">
                      {p.memKb >= 1024 ? `${(p.memKb / 1024).toFixed(1)} MB` : `${p.memKb} K`}
                    </td>
                    <td className="p-2 text-right tabular-nums">{fakeDisk(p.pid).toFixed(1)}</td>
                    <td className="p-2 text-right tabular-nums">{fakeNet(p.pid).toFixed(2)}</td>
                    <td className="p-2 text-right tabular-nums">{fakeGpu(p.pid).toFixed(1)}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-[11px] hover:bg-white/10"
                        onClick={() => setProcs((prev) => prev.filter((x) => x.pid !== p.pid))}
                      >
                        End task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {nav === 'performance' ? (
            <div className="grid grid-cols-2 gap-3 p-4">
              <PerfCard title="CPU" sub="~15% @ 2.9 GHz" pct={15} color="#5ebbff" wave />
              <PerfCard title="Memory" sub="8.2 / 16 GB (51%)" pct={51} color="#b48eff" />
              <PerfCard title="Disk 0 (C:)" sub="SSD NVMe" pct={6} color="#7ecb7e" />
              <PerfCard title="Ethernet" sub="SOC-SECURE-NET bursts" pct={22} color="#ffb74d" spike />
            </div>
          ) : null}

          {nav === 'startup' ? (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#2d2d2d] text-[11px] uppercase text-[#aaa]">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Publisher</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Impact</th>
                </tr>
              </thead>
              <tbody>
                {STARTUP_ROWS.map((r) => (
                  <tr key={r.name} className={`border-t border-white/6 ${r.suspicious ? 'bg-red-500/15 text-red-100' : ''}`}>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-[#bbb]">{r.publisher}</td>
                    <td className="p-2">{r.enabled ? 'Enabled' : 'Disabled'}</td>
                    <td className={`p-2 ${r.impact === 'High' ? 'font-semibold text-red-300' : ''}`}>{r.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {nav !== 'processes' && nav !== 'performance' && nav !== 'startup' ? (
            <div className="p-8 text-center text-[#888]">This simulated tab is read-only training chrome.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function PerfCard({
  title,
  sub,
  pct,
  color,
  wave,
  spike,
}: {
  title: string
  sub: string
  pct: number
  color: string
  wave?: boolean
  spike?: boolean
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#2d2d2d] p-3 shadow-inner">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold">{title}</div>
          <div className="text-[11px] text-[#aaa]">{sub}</div>
        </div>
        <span className="text-xl font-light tabular-nums">{pct}%</span>
      </div>
      <div className="relative mt-3 h-16 overflow-hidden rounded bg-black/40">
        <svg className="absolute inset-0 h-full w-full opacity-90" preserveAspectRatio="none" viewBox="0 0 120 40">
          <defs>
            <linearGradient id={`g-${title}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <path
            fill={`url(#g-${title})`}
            d={
              wave
                ? 'M0,35 Q15,10 30,22 T60,18 T90,25 T120,16 L120,40 L0,40 Z'
                : spike
                  ? 'M0,38 L10,38 L14,12 L18,38 L32,38 L40,8 L48,38 L120,38 Z'
                  : 'M0,40 L0,26 Q40,32 80,14 T120,20 L120,40 Z'
            }
          />
        </svg>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 opacity-40"
          style={{
            height: `${pct}%`,
            background: `linear-gradient(180deg, transparent, ${color})`,
          }}
        />
      </div>
    </div>
  )
}
