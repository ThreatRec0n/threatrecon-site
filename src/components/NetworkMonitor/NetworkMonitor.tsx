import { useMemo } from 'react'
import type { CaseDefinition, NetworkConnection } from '../../types/case.types'
import { BASELINE_NETWORK } from '../../data/baselineSystem'

export function NetworkMonitor({
  caseDef,
  exfilWarned,
  exfilBlocked,
}: {
  caseDef: CaseDefinition
  exfilWarned?: boolean
  exfilBlocked?: boolean
}) {
  const merged = useMemo<NetworkConnection[]>(() => {
    const base = BASELINE_NETWORK(caseDef.hostname.includes('.') ? '10.0.1.5' : '10.0.1.5')
    const seen = new Set(base.map((c) => `${c.proto}:${c.local}:${c.foreign}`))
    const extra = (caseDef.networkConnections ?? []).filter(
      (c) => !seen.has(`${c.proto}:${c.local}:${c.foreign}`),
    )
    return [...base, ...extra]
  }, [caseDef])

  const established = merged.filter((c) => c.state === 'ESTABLISHED').length
  const listening = merged.filter((c) => c.state === 'LISTENING').length
  const danger = merged.filter((c) => c.malicious || (c.foreign?.startsWith(caseDef.c2Ip ?? '___'))).length

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-xs text-[#e8edf5]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[10px]">
        <span className="text-[#8a9ab5]">Established</span>
        <span className="text-emerald-300">{established}</span>
        <span className="text-[#8a9ab5]">Listening</span>
        <span className="text-[#5e9bff]">{listening}</span>
        <span className="text-[#8a9ab5]">Suspicious</span>
        <span className={danger > 0 ? 'text-red-300' : 'text-[#a8b6ca]'}>{danger}</span>
        <span className="ml-auto text-[#4a566b]">netstat -ano (live)</span>
      </div>

      {exfilWarned && !exfilBlocked ? (
        <div className="m-3 animate-pulse rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
          ⚠ EXFILTRATION DETECTED — {caseDef.c2Ip}:443 — DATA LEAVING NETWORK
        </div>
      ) : null}

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono">
          <thead className="sticky top-0 z-10 bg-[#0f1824] text-[10px] uppercase text-[#8a9ab5]">
            <tr>
              <th className="p-2 text-left">Proto</th>
              <th className="p-2 text-left">Local</th>
              <th className="p-2 text-left">Foreign</th>
              <th className="p-2 text-left">State</th>
              <th className="p-2 text-left">PID</th>
              <th className="p-2 text-left">Process</th>
              <th className="p-2 text-left">Tag</th>
            </tr>
          </thead>
          <tbody>
            {merged.map((c, i) => {
              const isC2 = c.foreign?.startsWith(caseDef.c2Ip ?? '___')
              const bad = c.malicious || isC2
              const pulse = bad && exfilWarned && !exfilBlocked
              return (
                <tr
                  key={i}
                  className={`border-t border-white/5 ${
                    bad ? 'bg-red-500/10 text-red-200' : ''
                  } ${pulse ? 'animate-pulse' : ''}`}
                >
                  <td className="p-2">{c.proto}</td>
                  <td className="p-2">{c.local}</td>
                  <td className="p-2">{c.foreign}</td>
                  <td className="p-2 text-[#a8b6ca]">{c.state}</td>
                  <td className="p-2 tabular-nums">{c.pid}</td>
                  <td className="p-2">{c.processName}</td>
                  <td className="p-2 text-[10px]">
                    {bad ? (
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-200">C2</span>
                    ) : c.state === 'LISTENING' ? (
                      <span className="rounded bg-[#5e9bff]/20 px-2 py-0.5 text-[#5e9bff]">SVC</span>
                    ) : (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">OK</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
