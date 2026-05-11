import { useMemo } from 'react'
import type { CaseDefinition, ScheduledTaskDef } from '../../types/case.types'
import { baselineTasksFor } from '../../data/baselineSystem'
import { useScoringRuntime } from '../../contexts/ScoringRuntimeContext'

const fmtTime = (t: string) => (t ? t.replace('T', ' ').replace('Z', ' UTC') : '—')

export function TaskScheduler({ caseDef }: { caseDef: CaseDefinition }) {
  const { addScoringEvent } = useScoringRuntime()
  const tasks = useMemo<ScheduledTaskDef[]>(() => {
    const base = baselineTasksFor(caseDef.primaryUser)
    const seen = new Set(base.map((t) => t.name))
    const extras = (caseDef.scheduledTasks ?? []).filter((t) => !seen.has(t.name))
    return [...base, ...extras]
  }, [caseDef])

  const malicious = tasks.filter((t) => t.malicious).length

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[10px]">
        <span className="text-[#8a9ab5]">Scheduled Tasks</span>
        <span>{tasks.length}</span>
        <span className="text-[#8a9ab5]">Flagged</span>
        <span className={malicious > 0 ? 'text-red-300' : 'text-[#a8b6ca]'}>{malicious}</span>
        <span className="ml-auto text-[#4a566b]">Task Scheduler Library</span>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <table className="w-full border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#0f1824] text-[10px] uppercase text-[#8a9ab5]">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Trigger</th>
              <th className="p-2 text-left">Last run</th>
              <th className="p-2 text-left">Next run</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr
                key={t.name}
                role="presentation"
                className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${
                  t.malicious ? 'bg-red-500/10 text-red-100' : ''
                }`}
                onClick={() => {
                  if (t.malicious) addScoringEvent('PERSIST_FOUND')
                }}
              >
                <td className="max-w-[220px] p-2 align-top">
                  <div className="break-all font-semibold">{t.name}</div>
                  {t.malicious ? (
                    <span className="mt-1 inline-block rounded bg-red-500/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-red-200">
                      Suspicious
                    </span>
                  ) : null}
                </td>
                <td className="p-2 align-top text-[#a8b6ca]">{t.status}</td>
                <td className="p-2 align-top">{t.triggers}</td>
                <td className="p-2 align-top text-[#a8b6ca]">{fmtTime(t.lastRun)}</td>
                <td className="p-2 align-top text-[#a8b6ca]">{fmtTime(t.nextRun)}</td>
                <td className="max-w-md break-all p-2 align-top text-[10px] leading-snug text-[#c8d6e8]">
                  {t.command}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
