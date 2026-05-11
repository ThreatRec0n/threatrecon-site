import clsx from 'clsx'
import type { GamePhase } from '../../contexts/GameContext'

const phases: { id: GamePhase; label: string }[] = [
  { id: 'detect', label: 'DETECT' },
  { id: 'hunt', label: 'HUNT' },
  { id: 'eradicate', label: 'ERADICATE' },
  { id: 'harden', label: 'HARDEN' },
  { id: 'report', label: 'REPORT' },
]

export function PhaseTracker({
  phase,
  completed,
  onPhaseSelect,
}: {
  phase: GamePhase
  completed: Record<GamePhase, boolean>
  onPhaseSelect?: (id: GamePhase) => void
}) {
  const idx = phases.findIndex((p) => p.id === phase)
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-[#0a0e1a]/90 px-6 py-3 font-mono text-xs tracking-[0.2em] text-[#8a9ab5]">
      {phases.map((p, i) => {
        const active = i === idx
        const done = completed[p.id]
        return (
          <div key={p.id} className="flex items-center gap-3">
            <button
              type="button"
              disabled={!onPhaseSelect}
              title={onPhaseSelect ? `Set investigation phase to ${p.label}` : undefined}
              onClick={() => onPhaseSelect?.(p.id)}
              className={clsx(
                'flex items-center gap-2 rounded-full px-3 py-1 transition-colors',
                onPhaseSelect && 'cursor-pointer hover:bg-white/10 focus-visible:outline focus-visible:outline-[#5e9bff]',
                done && 'text-emerald-400',
                active && !done && 'bg-[#5e9bff]/15 text-[#e8edf5] shadow-[0_0_24px_rgba(94,155,255,0.35)]',
                !active && !done && 'opacity-60',
              )}
            >
              <span>{done ? '✓' : active ? '●' : '○'}</span>
              <span>{p.label}</span>
            </button>
            {i < phases.length - 1 ? <span className="text-white/20">→</span> : null}
          </div>
        )
      })}
    </div>
  )
}
