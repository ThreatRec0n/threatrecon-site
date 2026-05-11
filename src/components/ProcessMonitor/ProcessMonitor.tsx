import type { CaseDefinition } from '../../types/case.types'

export function ProcessMonitor({ caseDef }: { caseDef: CaseDefinition }) {
  return (
    <div className="h-full overflow-auto bg-[#0a0e1a] p-3 text-xs font-mono text-[#e8edf5]">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0f1824] text-[11px] uppercase text-[#8a9ab5]">
          <tr>
            <th className="p-2 text-left">PID</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">User</th>
            <th className="p-2 text-left">Memory</th>
            <th className="p-2 text-left">Flags</th>
          </tr>
        </thead>
        <tbody>
          {caseDef.processes.map((p) => (
            <tr
              key={p.pid}
              className={`border-t border-white/5 ${p.malicious ? 'bg-red-500/10 text-red-200' : ''}`}
            >
              <td className="p-2">{p.pid}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.user}</td>
              <td className="p-2">{p.memKb} K</td>
              <td className="p-2 text-[10px] text-yellow-200">{p.anomalies?.join(' · ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
