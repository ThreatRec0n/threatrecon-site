import { useEffect, useMemo, useState } from 'react'
import type { CaseDefinition, EventLogEntry } from '../../types/case.types'
import { generateEventLogs } from '../../utils/eventLogGenerator'
import { generateBaselineEvents } from '../../data/baselineSystem'

const LOG_TABS = ['Security', 'System', 'Application', 'PowerShell'] as const
type LogTab = typeof LOG_TABS[number]

const levelClass = (l: EventLogEntry['level']) => {
  switch (l) {
    case 'Failure Audit':
      return 'text-red-300'
    case 'Error':
      return 'text-red-300'
    case 'Warning':
      return 'text-yellow-300'
    case 'Success Audit':
      return 'text-emerald-300'
    default:
      return 'text-[#a8b6ca]'
  }
}

export function EventViewer({ caseDef }: { caseDef: CaseDefinition }) {
  const [filterId, setFilterId] = useState('')
  const [tab, setTab] = useState<LogTab>('Security')
  const [events, setEvents] = useState<EventLogEntry[] | null>(
    caseDef.eventLogEntries && caseDef.eventLogEntries.length ? caseDef.eventLogEntries : null,
  )
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (events !== null) return
    setLoading(true)
    const timer = setTimeout(() => {
      const generated = generateEventLogs(caseDef)
      caseDef.eventLogEntries = generated
      setEvents(generated)
      setLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [events, caseDef])

  const merged = useMemo<EventLogEntry[]>(() => {
    const base = generateBaselineEvents(caseDef.hostname, caseDef.primaryUser)
    const fromCase = events ?? []
    const seen = new Set(fromCase.map((e) => e.id))
    return [...base.filter((e) => !seen.has(e.id)), ...fromCase].sort((a, b) =>
      a.time.localeCompare(b.time),
    )
  }, [events, caseDef])

  const filtered = useMemo(() => {
    return merged.filter(
      (e) => e.log === tab && (filterId ? String(e.eventId).includes(filterId) : true),
    )
  }, [merged, filterId, tab])

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? filtered[0],
    [filtered, selectedId],
  )

  if (loading || events === null) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0e1a] font-mono text-[11px] text-[#8a9ab5]">
        Loading {caseDef.hostname} event logs…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-1 border-b border-white/10 bg-[#0f1824] px-2 pt-2">
        {LOG_TABS.map((t) => {
          const count = merged.filter((e) => e.log === t).length
          const active = t === tab
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t px-3 py-1.5 font-mono text-[11px] ${
                active
                  ? 'bg-[#0a0e1a] text-[#e8edf5]'
                  : 'text-[#8a9ab5] hover:bg-white/5'
              }`}
            >
              {t} <span className="ml-1 text-[10px] text-[#5e9bff]">{count}</span>
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2 pb-1.5">
          <label className="text-[10px] text-[#8a9ab5]">Event ID</label>
          <input
            className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            placeholder="4688"
          />
          <span className="ml-2 text-[10px] text-[#4a566b]">{filtered.length} events</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-2/3 overflow-auto">
          <table className="w-full border-collapse font-mono">
            <thead className="sticky top-0 z-10 bg-[#0f1824] text-[10px] uppercase text-[#8a9ab5]">
              <tr>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Source</th>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Task</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((e) => (
                <tr
                  key={e.id}
                  className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${
                    e.malicious ? 'bg-purple-500/10' : ''
                  } ${selected?.id === e.id ? 'ring-1 ring-[#5e9bff]/40' : ''}`}
                  onClick={() => setSelectedId(e.id)}
                >
                  <td className={`p-2 ${levelClass(e.level)}`}>{e.level}</td>
                  <td className="p-2 text-[#a8b6ca]">{e.time.replace('T', ' ').replace('Z', '')}</td>
                  <td className="p-2 text-[#c8d6e8]">{e.source.replace('Microsoft-Windows-', '')}</td>
                  <td className="p-2 tabular-nums">{e.eventId}</td>
                  <td className="p-2 text-[10px] text-[#8a9ab5]">{e.task}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="w-1/3 overflow-auto border-l border-white/10 bg-black/40 p-3 text-[10px] text-[#a8b6ca]">
          {selected?.xml ?? 'Select an event'}
        </pre>
      </div>
    </div>
  )
}
