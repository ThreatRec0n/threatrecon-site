import { useMemo, useState } from 'react'
import type { CaseDefinition, ProcessEntry } from '../../types/case.types'
import { baselineProcessesFor } from '../../data/baselineSystem'
import { useGame } from '../../contexts/GameContext'
import { useScoringRuntime } from '../../contexts/ScoringRuntimeContext'

const fmtMem = (kb: number) =>
  kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toLocaleString()} K`

export function ProcessMonitor({ caseDef }: { caseDef: CaseDefinition }) {
  const { recordOperativeMilestone } = useGame()
  const { addScoringEvent } = useScoringRuntime()
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<'pid' | 'name' | 'mem' | 'cpu'>('mem')

  const merged = useMemo<ProcessEntry[]>(() => {
    const baseline = baselineProcessesFor(caseDef.primaryUser)
    const caseProcs = caseDef.processes ?? []
    const seen = new Set(baseline.map((p) => `${p.pid}:${p.name}`))
    const extras = caseProcs.filter((p) => !seen.has(`${p.pid}:${p.name}`))
    return [...baseline, ...extras]
  }, [caseDef])

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase()
    let list = f
      ? merged.filter(
          (p) =>
            p.name.toLowerCase().includes(f) ||
            String(p.pid).includes(f) ||
            (p.user ?? '').toLowerCase().includes(f),
        )
      : merged.slice()
    list = list.sort((a, b) => {
      switch (sort) {
        case 'pid':
          return a.pid - b.pid
        case 'name':
          return a.name.localeCompare(b.name)
        case 'cpu':
          return (b.cpuPercent ?? 0) - (a.cpuPercent ?? 0)
        default:
          return b.memKb - a.memKb
      }
    })
    return list
  }, [merged, filter, sort])

  const total = merged.length
  const malicious = merged.filter((p) => p.malicious).length
  const totalMem = merged.reduce((s, p) => s + p.memKb, 0)

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#0f1824] px-3 py-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name / PID / user"
          className="w-56 rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
        >
          <option value="mem">Sort: Memory</option>
          <option value="cpu">Sort: CPU%</option>
          <option value="pid">Sort: PID</option>
          <option value="name">Sort: Name</option>
        </select>
        <div className="ml-auto flex items-center gap-4 font-mono text-[10px] text-[#8a9ab5]">
          <span>{total} processes</span>
          <span>{(totalMem / 1024).toFixed(0)} MB committed</span>
          <span className={malicious > 0 ? 'text-red-300' : 'text-emerald-300'}>
            {malicious > 0 ? `${malicious} flagged` : 'No anomalies'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono">
          <thead className="sticky top-0 z-10 bg-[#0f1824] text-[10px] uppercase tracking-wider text-[#8a9ab5]">
            <tr>
              <th className="p-2 text-left">PID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-right">CPU%</th>
              <th className="p-2 text-right">Memory</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const danger = !!p.malicious
              return (
                <tr
                  key={`${p.pid}-${p.name}`}
                  className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${
                    danger ? 'bg-red-500/10 text-red-200' : ''
                  }`}
                  onClick={() => {
                    if (p.malicious || /\b(msupdate|7z)\b/i.test(p.name)) {
                      recordOperativeMilestone('detectionMaliciousProcess')
                      addScoringEvent('PROCESS_IDENTIFIED')
                    }
                  }}
                >
                  <td className="p-2 tabular-nums">{p.pid}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {danger ? (
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/50" />
                      )}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="p-2 text-[#a8b6ca]">{p.user}</td>
                  <td className="p-2 text-right tabular-nums">{(p.cpuPercent ?? 0).toFixed(1)}</td>
                  <td className="p-2 text-right tabular-nums">{fmtMem(p.memKb)}</td>
                  <td className="p-2 text-[#a8b6ca]">{p.status ?? 'Running'}</td>
                  <td className="p-2 text-[10px] text-yellow-200">
                    {p.anomalies?.join(' · ') ?? p.services?.join(', ') ?? ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
