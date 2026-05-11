import { useEffect, useMemo, useState } from 'react'
import type { CaseDefinition, EventLogEntry } from '../../types/case.types'
import { generateEventLogs } from '../../utils/eventLogGenerator'

export function EventViewer({ caseDef }: { caseDef: CaseDefinition }) {
  const [filterId, setFilterId] = useState('')
  const [events, setEvents] = useState<EventLogEntry[] | null>(
    caseDef.eventLogEntries && caseDef.eventLogEntries.length ? caseDef.eventLogEntries : null,
  )
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (events !== null) return
    setLoading(true)
    /* defer to next tick so the window can render first */
    const timer = setTimeout(() => {
      const generated = generateEventLogs(caseDef)
      caseDef.eventLogEntries = generated
      setEvents(generated)
      setLoading(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [events, caseDef])

  const filtered = useMemo(() => {
    if (!events) return []
    return events.filter((e) => (filterId ? String(e.eventId).includes(filterId) : true))
  }, [events, filterId])

  const selected = useMemo(() => filtered.find((e) => e.id === selectedId) ?? filtered[0], [filtered, selectedId])

  if (loading || events === null) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0e1a] font-mono text-[11px] text-[#8a9ab5]">
        Loading {caseDef.hostname} event logs…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <label className="text-[11px] text-[#8a9ab5]">Event ID</label>
        <input
          className="rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          placeholder="4688"
        />
        <span className="ml-auto text-[10px] text-[#4a566b]">{filtered.length} events</span>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-2/3 overflow-auto">
          <table className="w-full border-collapse font-mono">
            <thead className="sticky top-0 bg-[#0f1824] text-[11px] uppercase text-[#8a9ab5]">
              <tr>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Source</th>
                <th className="p-2 text-left">ID</th>
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
                  <td className="p-2">{e.level}</td>
                  <td className="p-2">{e.time}</td>
                  <td className="p-2">{e.source}</td>
                  <td className="p-2">{e.eventId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="w-1/3 overflow-auto border-l border-white/10 bg-black/40 p-2 text-[10px] text-[#a8b6ca]">
          {selected?.xml ?? 'Select an event'}
        </pre>
      </div>
    </div>
  )
}
