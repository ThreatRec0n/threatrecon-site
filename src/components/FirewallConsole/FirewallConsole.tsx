import { useGame } from '../../contexts/GameContext'

export function FirewallConsole() {
  const { caseDef, hardeningDone, toggleHardening } = useGame()
  if (!caseDef) return null

  return (
    <div className="h-full overflow-auto bg-[#0a0e1a] p-4 text-xs text-[#e8edf5]">
      <p className="mb-3 font-mono text-[11px] text-[#8a9ab5]">
        Block outbound C2: <span className="text-[#5e9bff]">{caseDef.c2Ip ?? 'N/A'}</span>
      </p>
      <ul className="space-y-2">
        {caseDef.correctHardeningSteps.map((h) => (
          <li key={h.id}>
            <label className="flex cursor-pointer items-start gap-2">
              <input type="checkbox" checked={!!hardeningDone[h.id]} onChange={() => toggleHardening(h.id)} />
              <span>{h.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
