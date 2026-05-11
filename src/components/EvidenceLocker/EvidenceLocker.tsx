import { useEvidence, badgeColor } from '../../contexts/EvidenceContext'

export function EvidenceLocker() {
  const { items, tagIoc, updateNotes } = useEvidence()
  const iocCount = items.filter((i) => i.taggedIoc).length

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-white/10 bg-[#0f1824]/95">
      <header className="border-b border-white/10 px-4 py-3 font-display text-sm tracking-wide text-[#e8edf5]">
        EVIDENCE LOCKER — {items.length} Items
      </header>
      <div className="flex-1 overflow-y-auto px-3 py-3 text-xs">
        {items.length === 0 ? (
          <p className="text-[#4a566b]">No evidence tagged.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((ev) => (
              <li key={ev.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${badgeColor(ev.type)}`}>
                      {ev.type}
                    </span>
                    <div className="mt-2 font-mono text-[11px] text-[#e8edf5]">{ev.title}</div>
                  </div>
                  <label className="flex items-center gap-1 text-[10px] text-[#8a9ab5]">
                    <input
                      type="checkbox"
                      checked={ev.taggedIoc}
                      onChange={(e) => tagIoc(ev.id, e.target.checked)}
                    />
                    IOC
                  </label>
                </div>
                {ev.path ? (
                  <div className="mt-2 font-mono text-[10px] text-[#5e9bff]/90">Path: {ev.path}</div>
                ) : null}
                {ev.hash ? (
                  <div className="mt-1 font-mono text-[10px] text-[#8a9ab5]">Hash: {ev.hash}</div>
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
      <footer className="border-t border-white/10 px-4 py-3 text-[11px] text-[#8a9ab5]">
        IOC count: {iocCount}
      </footer>
    </aside>
  )
}
