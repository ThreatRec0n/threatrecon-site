import { useEffect, useMemo, useState } from 'react'
import { useEvidence, badgeColor } from '../../contexts/EvidenceContext'
import { useGame } from '../../contexts/GameContext'
import { IconAlert } from '../shared/Icons'

const sevColor: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-200 border-red-500/40',
  HIGH: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
  MEDIUM: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
  LOW: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
}

export function EvidenceLocker() {
  const { items, tagIoc, updateNotes } = useEvidence()
  const { caseDef } = useGame()
  const iocCount = items.filter((i) => i.taggedIoc).length

  useEffect(() => {
    const focusNotes = () => {
      const el = document.getElementById('tr-investigation-notes')
      el?.focus()
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    window.addEventListener('tr-focus-notes', focusNotes)
    return () => window.removeEventListener('tr-focus-notes', focusNotes)
  }, [])

  const initialAlertMitre = useMemo(() => {
    if (!caseDef) return []
    const ev = caseDef.entryVector
    const ex = caseDef.exfiltration
    return [ev, ex].filter(Boolean).map((t) => t.id)
  }, [caseDef])

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-white/10 bg-[#0f1824]/95">
      {/* SIEM Alert header */}
      {caseDef ? (
        <div
          className={`border-b border-white/10 p-3 ${
            caseDef.severity === 'CRITICAL' || caseDef.severity === 'HIGH'
              ? 'bg-red-500/5'
              : 'bg-yellow-500/5'
          }`}
        >
          <div className="flex items-start gap-2">
            <IconAlert size={16} className="mt-0.5 text-yellow-300" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-display text-[11px] uppercase tracking-wider text-[#e8edf5]">
                  SIEM ALERT
                </div>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${
                    sevColor[caseDef.severity] ?? sevColor.HIGH
                  }`}
                >
                  {caseDef.severity}
                </span>
              </div>
              <div className="mt-2 font-mono text-[12px] text-yellow-200">
                {caseDef.initialAlert.title}
              </div>
              <div className="mt-1 font-mono text-[10px] text-[#a8b6ca]">
                {caseDef.initialAlert.detail}
              </div>
              <dl className="mt-2 grid grid-cols-[64px_1fr] gap-x-2 gap-y-0.5 font-mono text-[10px]">
                <dt className="text-[#8a9ab5]">TIME</dt>
                <dd>{caseDef.initialAlert.time.replace('T', ' ').replace('Z', ' UTC')}</dd>
                <dt className="text-[#8a9ab5]">HOST</dt>
                <dd className="text-[#5e9bff]">{caseDef.initialAlert.host}</dd>
                <dt className="text-[#8a9ab5]">USER</dt>
                <dd>{caseDef.initialAlert.user}</dd>
                <dt className="text-[#8a9ab5]">ACTOR</dt>
                <dd>{caseDef.threatActor.displayName}</dd>
              </dl>
              {initialAlertMitre.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {initialAlertMitre.map((id) => (
                    <span
                      key={id}
                      className="rounded bg-[#5e9bff]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-[#5e9bff]"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <header className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-display text-[11px] uppercase tracking-wider text-[#e8edf5]">
        <span>Evidence Locker</span>
        <span className="font-mono text-[10px] text-[#8a9ab5]">{items.length} items · {iocCount} IOC</span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 text-xs">
        {items.length === 0 ? (
          <p className="text-[#4a566b]">
            No evidence tagged. Use Terminal commands or right-click items in tools to capture
            evidence.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((ev) => (
              <li key={ev.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[9px] uppercase tracking-wider ${badgeColor(
                        ev.type,
                      )}`}
                    >
                      {ev.type}
                    </span>
                    <div className="mt-2 font-mono text-[11px] text-[#e8edf5]">{ev.title}</div>
                  </div>
                  <label className="flex items-center gap-1 font-mono text-[10px] text-[#8a9ab5]">
                    <input
                      type="checkbox"
                      checked={ev.taggedIoc}
                      onChange={(e) => tagIoc(ev.id, e.target.checked)}
                      className="accent-[#5e9bff]"
                    />
                    IOC
                  </label>
                </div>
                {ev.path ? (
                  <div className="mt-2 break-all font-mono text-[10px] text-[#5e9bff]/90">{ev.path}</div>
                ) : null}
                {ev.hash ? (
                  <div className="mt-1 break-all font-mono text-[10px] text-[#8a9ab5]">SHA256: {ev.hash}</div>
                ) : null}
                {ev.mitre && ev.mitre.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ev.mitre.map((m) => (
                      <span
                        key={m}
                        className="rounded bg-[#5e9bff]/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-[#5e9bff]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                ) : null}
                <textarea
                  className="mt-2 w-full resize-none rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] text-[#e8edf5]"
                  rows={2}
                  placeholder="Notes"
                  value={ev.notes}
                  onChange={(e) => updateNotes(ev.id, e.target.value)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {caseDef ? (
        <InvestigationScratchpad caseId={caseDef.caseId} />
      ) : null}
      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-2 font-mono text-[10px] text-[#8a9ab5]">
        <span>Chain of custody preserved</span>
        <span className="text-[#5e9bff]">{iocCount} IOCs</span>
      </footer>
    </aside>
  )
}

function InvestigationScratchpad({ caseId }: { caseId: string }) {
  const key = `tr_scratch_${caseId}`
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(key) ?? ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    try {
      const v = localStorage.getItem(key) ?? ''
      setText(v)
    } catch {
      setText('')
    }
  }, [key])

  useEffect(() => {
    try {
      localStorage.setItem(key, text)
    } catch {
      /* ignore */
    }
  }, [key, text])

  return (
    <div className="border-t border-white/10 px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-[#8a9ab5]">
        Investigation notes
      </div>
      <textarea
        id="tr-investigation-notes"
        className="mt-2 max-h-36 min-h-[72px] w-full resize-y rounded border border-white/10 bg-black/30 px-2 py-2 font-mono text-[11px] text-[#e8edf5]"
        placeholder="Scratchpad — hypotheses, analyst annotations, handoff notes…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-1 font-mono text-[9px] text-[#4a566b]">Saved locally for this case.</div>
    </div>
  )
}
