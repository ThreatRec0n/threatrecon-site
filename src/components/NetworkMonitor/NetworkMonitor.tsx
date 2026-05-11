import type { CaseDefinition } from '../../types/case.types'

export function NetworkMonitor({
  caseDef,
  exfilWarned,
  exfilBlocked,
}: {
  caseDef: CaseDefinition
  exfilWarned?: boolean
  exfilBlocked?: boolean
}) {
  return (
    <div className="h-full overflow-auto bg-[#0a0e1a] p-3 text-xs font-mono">
      {exfilWarned && !exfilBlocked ? (
        <div className="mb-3 animate-pulse rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          ⚠ EXFILTRATION DETECTED — {caseDef.c2Ip}:443 — DATA LEAVING NETWORK
        </div>
      ) : null}
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0f1824] text-[11px] uppercase text-[#8a9ab5]">
          <tr>
            <th className="p-2 text-left">Proto</th>
            <th className="p-2 text-left">Local</th>
            <th className="p-2 text-left">Foreign</th>
            <th className="p-2 text-left">State</th>
            <th className="p-2 text-left">PID</th>
            <th className="p-2 text-left">Process</th>
          </tr>
        </thead>
        <tbody>
          {caseDef.networkConnections.map((c, i) => {
            const isC2 = c.foreign?.startsWith(caseDef.c2Ip ?? '___')
            const danger = c.malicious || isC2
            const pulse = danger && exfilWarned && !exfilBlocked
            return (
              <tr
                key={i}
                className={`border-t border-white/5 ${danger ? 'bg-red-500/10 text-red-200' : ''} ${
                  pulse ? 'animate-pulse' : ''
                }`}
              >
                <td className="p-2">{c.proto}</td>
                <td className="p-2">{c.local}</td>
                <td className="p-2">{c.foreign}</td>
                <td className="p-2">{c.state}</td>
                <td className="p-2">{c.pid}</td>
                <td className="p-2">{c.processName}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
