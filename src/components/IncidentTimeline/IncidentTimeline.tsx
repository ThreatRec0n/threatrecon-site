import { useTimeline } from '../../contexts/TimelineContext'

const dotClass: Record<string, string> = {
  red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]',
  yellow: 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.7)]',
  green: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
}

export function IncidentTimeline() {
  const { entries } = useTimeline()

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="border-b border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8a9ab5]">
        Incident timeline
      </div>
      <div className="flex-1 overflow-auto p-4">
        {entries.length === 0 ? (
          <p className="font-mono text-[11px] text-[#4a566b]">
            Open tools and capture evidence — events appear here in chronological order.
          </p>
        ) : (
          <ul className="relative ml-2 border-l border-white/15 pl-6">
            {entries.map((e) => (
              <li key={e.id} className="relative pb-6 last:pb-0">
                <span
                  className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${dotClass[e.severity] ?? dotClass.green}`}
                  aria-hidden
                />
                <div className="font-mono text-[10px] text-[#8a9ab5]">
                  {e.at.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')}
                </div>
                <div className="mt-0.5 font-display text-[11px] uppercase tracking-wide text-[#5e9bff]">
                  {e.eventType}
                </div>
                <p className="mt-1 font-mono text-[11px] leading-snug text-[#e8edf5]">{e.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
