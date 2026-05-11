import { useEffect, useMemo, useState } from 'react'
import type { CaseDefinition, NetworkConnection } from '../../types/case.types'
import { BASELINE_NETWORK } from '../../data/baselineSystem'
import { useGame } from '../../contexts/GameContext'
import { useScoringRuntime } from '../../contexts/ScoringRuntimeContext'

function splitEndpoint(ep: string): { ip: string; port: string } {
  if (!ep || ep === '*:*') return { ip: '*', port: '*' }
  const lastColon = ep.lastIndexOf(':')
  if (lastColon <= 0) return { ip: ep, port: '' }
  return { ip: ep.slice(0, lastColon), port: ep.slice(lastColon + 1) }
}

const KNOWN_GOOD_IPS = new Set([
  '52.96.165.34',
  '142.250.80.46',
  '52.114.128.74',
  '13.107.6.158',
])

const UNUSUAL_PORTS = new Set(['4444', '1337', '8080', '9999', '6667'])

function rowVisual(
  c: NetworkConnection,
  c2Ip: string | undefined,
): { rowClass: string; tag: string } {
  const { ip: fip, port: fport } = splitEndpoint(c.foreign.replace('*:*', '*'))
  const torOrSuspicious =
    c.malicious || fip.startsWith('185.220.') || (!!c2Ip && fip.startsWith(c2Ip))
  if (torOrSuspicious)
    return { rowClass: 'bg-red-500/15 text-red-100 border-l-2 border-l-red-500', tag: 'THREAT' }

  const unusualPort =
    (fport && UNUSUAL_PORTS.has(fport)) ||
    (c.local.includes(':') && UNUSUAL_PORTS.has(splitEndpoint(c.local).port))
  if (unusualPort && c.state === 'ESTABLISHED')
    return { rowClass: 'bg-yellow-500/10 text-yellow-100 border-l-2 border-l-yellow-500', tag: 'PORT' }

  if (c.state === 'LISTENING' || fip === '0.0.0.0')
    return { rowClass: 'text-[#a8b6ca]', tag: 'LISTEN' }

  if (KNOWN_GOOD_IPS.has(fip) || fip.startsWith('10.') || fip === '93.184.216.34')
    return { rowClass: 'bg-emerald-500/5 text-emerald-50', tag: 'OK' }

  return { rowClass: 'text-[#e8edf5]', tag: 'NET' }
}

function fmtBytes(n: number): string {
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(2)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}

export function NetworkMonitor({
  caseDef,
  exfilWarned,
  exfilBlocked,
}: {
  caseDef: CaseDefinition
  exfilWarned?: boolean
  exfilBlocked?: boolean
}) {
  const { recordOperativeMilestone } = useGame()
  const { addScoringEvent } = useScoringRuntime()
  const merged = useMemo<NetworkConnection[]>(() => {
    const host = '10.0.1.5'
    const base = BASELINE_NETWORK(host)
    const seen = new Set(base.map((c) => `${c.proto}:${c.local}:${c.foreign}`))
    const extra = (caseDef.networkConnections ?? []).filter(
      (c) => !seen.has(`${c.proto}:${c.local}:${c.foreign}`),
    )
    return [...base, ...extra]
  }, [caseDef])

  const [bytePulse, setBytePulse] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setBytePulse((n) => n + 1), 2200)
    return () => window.clearInterval(id)
  }, [])

  const liveBytes = useMemo(() => {
    const jitter = (seed: number, row: number) => ((seed + row * 997 + bytePulse * 13) % 8192) + 128
    return merged.map((c, i) => {
      const bi = c.bytesIn ?? 0
      const bo = c.bytesOut ?? 0
      if (c.state !== 'ESTABLISHED' || c.foreign.includes('0.0.0.0:0'))
        return { in: bi, out: bo }
      return { in: bi + jitter(bytePulse, i), out: bo + jitter(bytePulse + 3, i) }
    })
  }, [merged, bytePulse])

  const established = merged.filter((c) => c.state === 'ESTABLISHED').length
  const listening = merged.filter((c) => c.state === 'LISTENING').length
  const danger = merged.filter(
    (c) => c.malicious || (caseDef.c2Ip && c.foreign?.startsWith(caseDef.c2Ip)),
  ).length

  const c2 = caseDef.c2Ip

  return (
    <div className="flex h-full flex-col bg-[#0a0e1a] text-[11px] text-[#e8edf5]">
      <div className="flex items-center gap-4 border-b border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[10px]">
        <span className="text-[#8a9ab5]">Established</span>
        <span className="text-emerald-300">{established}</span>
        <span className="text-[#8a9ab5]">Listening</span>
        <span className="text-[#5e9bff]">{listening}</span>
        <span className="text-[#8a9ab5]">Suspicious</span>
        <span className={danger > 0 ? 'text-red-300' : 'text-[#a8b6ca]'}>{danger}</span>
        <span className="ml-auto text-[#4a566b]">Live counters refresh ~2s</span>
      </div>

      {exfilWarned && !exfilBlocked ? (
        <div className="m-3 animate-pulse rounded border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-200">
          ⚠ EXFILTRATION DETECTED — {caseDef.c2Ip}:443 — DATA LEAVING NETWORK
        </div>
      ) : null}

      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[920px] border-collapse font-mono">
          <thead className="sticky top-0 z-10 bg-[#0f1824] text-[9px] uppercase tracking-wide text-[#8a9ab5]">
            <tr>
              <th className="p-2 text-left">Proto</th>
              <th className="p-2 text-left">Local IP</th>
              <th className="p-2 text-left">L.Port</th>
              <th className="p-2 text-left">Foreign IP</th>
              <th className="p-2 text-left">F.Port</th>
              <th className="p-2 text-left">State</th>
              <th className="p-2 text-left">PID</th>
              <th className="p-2 text-left">Process</th>
              <th className="p-2 text-right">Bytes sent</th>
              <th className="p-2 text-right">Bytes recv</th>
              <th className="p-2 text-left">Tag</th>
            </tr>
          </thead>
          <tbody>
            {merged.map((c, i) => {
              const loc = splitEndpoint(c.local)
              const fr = splitEndpoint(c.foreign === '*:*' ? '*:*' : c.foreign)
              const isC2 = c2 && c.foreign?.startsWith(c2)
              const bad = c.malicious || isC2
              const pulse = bad && exfilWarned && !exfilBlocked
              const { rowClass, tag } = rowVisual(c, c2)
              const bytes = liveBytes[i] ?? { in: 0, out: 0 }
              return (
                <tr
                  key={`${c.proto}-${c.local}-${c.foreign}-${i}`}
                  role={bad ? 'button' : undefined}
                  tabIndex={bad ? 0 : undefined}
                  className={`border-t border-white/5 ${rowClass} ${pulse ? 'animate-pulse' : ''} ${bad ? 'cursor-pointer hover:bg-white/10' : ''}`}
                  onClick={() => {
                    if (bad) {
                      recordOperativeMilestone('detectionNetworkC2')
                      addScoringEvent('C2_IDENTIFIED')
                    }
                  }}
                >
                  <td className="p-2">{c.proto}</td>
                  <td className="p-2">{loc.ip}</td>
                  <td className="p-2 tabular-nums">{loc.port}</td>
                  <td className="p-2">{fr.ip}</td>
                  <td className="p-2 tabular-nums">{fr.port}</td>
                  <td className="p-2 text-[#a8b6ca]">{c.state || '—'}</td>
                  <td className="p-2 tabular-nums">{c.pid}</td>
                  <td className="p-2">{c.processName}</td>
                  <td className="p-2 text-right tabular-nums text-[#8a9ab5]">{fmtBytes(bytes.out)}</td>
                  <td className="p-2 text-right tabular-nums text-[#8a9ab5]">{fmtBytes(bytes.in)}</td>
                  <td className="p-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] ${
                        tag === 'THREAT'
                          ? 'bg-red-500/25 text-red-200'
                          : tag === 'PORT'
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : tag === 'OK'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-white/10 text-[#8a9ab5]'
                      }`}
                    >
                      {tag}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-white/10 bg-[#0f1824] px-3 py-2 font-mono text-[9px] text-[#8a9ab5]">
        <span className="text-red-300">■</span> 185.220.x.x / C2 ·{' '}
        <span className="text-yellow-300">■</span> unusual ports ·{' '}
        <span className="text-emerald-300">■</span> known-good / RFC1918
      </div>
    </div>
  )
}
