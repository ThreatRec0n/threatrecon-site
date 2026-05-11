import { useMemo, useState } from 'react'
import type { CaseDefinition, ScheduledTaskDef } from '../../types/case.types'
import { baselineTasksFor } from '../../data/baselineSystem'

const fmtTime = (t: string) => (t ? t.replace('T', ' ').replace('Z', ' UTC') : '—')

export function TaskScheduler({ caseDef }: { caseDef: CaseDefinition }) {
  const tasks = useMemo<ScheduledTaskDef[]>(() => {
    const base = baselineTasksFor(caseDef.primaryUser)
    const seen = new Set(base.map((t) => t.name))
    const extras = (caseDef.scheduledTasks ?? []).filter((t) => !seen.has(t.name))
    return [...base, ...extras]
  }, [caseDef])

  const [selectedName, setSelectedName] = useState<string | null>(tasks[0]?.name ?? null)
  const selected = tasks.find((t) => t.name === selectedName) ?? tasks[0]
  const malicious = tasks.filter((t) => t.malicious).length

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[10px]">
        <span className="text-[#8a9ab5]">Scheduled Tasks</span>
        <span>{tasks.length}</span>
        <span className="text-[#8a9ab5]">Suspicious</span>
        <span className={malicious > 0 ? 'text-red-300' : 'text-[#a8b6ca]'}>{malicious}</span>
        <span className="ml-auto text-[#4a566b]">schtasks /query /fo LIST /v</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-2/5 overflow-auto border-r border-white/10">
          <ul className="font-mono text-[11px]">
            {tasks.map((t) => (
              <li
                key={t.name}
                onClick={() => setSelectedName(t.name)}
                className={`cursor-pointer border-t border-white/5 px-3 py-2 hover:bg-white/5 ${
                  t.malicious ? 'border-l-2 border-l-red-500 bg-red-500/5 text-red-200' : ''
                } ${selected?.name === t.name ? 'bg-[#5e9bff]/10' : ''}`}
              >
                <div className="truncate">{t.name}</div>
                <div className="mt-0.5 flex items-center gap-3 text-[10px] text-[#8a9ab5]">
                  <span>{t.status}</span>
                  <span>· {t.triggers}</span>
                  {t.malicious ? <span className="text-red-300">⚠ flagged</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {selected ? (
            <article className="font-mono">
              <h3 className="font-display text-sm tracking-wide text-[#e8edf5]">{selected.name}</h3>
              <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-1 text-[11px]">
                <dt className="text-[#8a9ab5]">Status</dt>
                <dd>{selected.status}</dd>
                <dt className="text-[#8a9ab5]">Triggers</dt>
                <dd>{selected.triggers}</dd>
                <dt className="text-[#8a9ab5]">Next run</dt>
                <dd>{fmtTime(selected.nextRun)}</dd>
                <dt className="text-[#8a9ab5]">Last run</dt>
                <dd>{fmtTime(selected.lastRun)}</dd>
                <dt className="text-[#8a9ab5]">Author</dt>
                <dd>{selected.author}</dd>
                <dt className="text-[#8a9ab5]">Run as</dt>
                <dd>{selected.runAs}</dd>
              </dl>
              <div className="mt-4">
                <div className="text-[10px] uppercase text-[#8a9ab5]">Action</div>
                <pre className="mt-1 overflow-x-auto rounded border border-white/10 bg-black/40 p-2 text-[11px] text-[#e8edf5]">
                  {selected.command}
                </pre>
              </div>
              <div className="mt-3">
                <div className="text-[10px] uppercase text-[#8a9ab5]">XML</div>
                <pre className="mt-1 max-h-48 overflow-auto rounded border border-white/10 bg-black/40 p-2 text-[10px] text-[#a8b6ca]">
                  {selected.xml}
                </pre>
              </div>
              {selected.malicious ? (
                <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-[11px] text-red-200">
                  ⚠ This task was created outside the patch window and runs at every logon. Verify
                  signature, executable hash, and origin.
                </div>
              ) : null}
            </article>
          ) : (
            <div className="text-[#4a566b]">No task selected.</div>
          )}
        </div>
      </div>
    </div>
  )
}
