import type { CaseDefinition } from '../../types/case.types'

export function TaskScheduler({ caseDef }: { caseDef: CaseDefinition }) {
  return (
    <div className="h-full overflow-auto bg-[#0a0e1a] p-3 text-xs font-mono">
      {caseDef.scheduledTasks.map((t) => (
        <div key={t.name} className={`mb-3 rounded border border-white/10 p-3 ${t.malicious ? 'border-red-500/40 bg-red-500/5' : ''}`}>
          <div className="text-[11px] text-[#8a9ab5]">{t.name}</div>
          <div className="mt-1 text-[#e8edf5]">{t.command}</div>
          <pre className="mt-2 max-h-32 overflow-auto text-[10px] text-[#a8b6ca]">{t.xml}</pre>
        </div>
      ))}
    </div>
  )
}
