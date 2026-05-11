import { useEffect, useMemo, useState } from 'react'

interface MitreTactic {
  id: string
  shortName: string
  name: string
}
interface MitreTechnique {
  id: string
  name: string
  tactics: string[]
}

type Coverage = Record<string, 'detected' | 'missed'>

const TACTIC_ORDER = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact',
]

export function AttackHeatmap() {
  const [tactics, setTactics] = useState<MitreTactic[] | null>(null)
  const [techniques, setTechniques] = useState<MitreTechnique[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [coverage, setCoverage] = useState<Coverage>(() => {
    try {
      const raw = localStorage.getItem('threatrecon_mitre_coverage')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    let cancelled = false
    fetch('/data/mitre-attack-v19.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((stix: { objects: Array<Record<string, unknown>> }) => {
        if (cancelled) return
        const objects = stix.objects ?? []
        const t: MitreTactic[] = []
        const tx: MitreTechnique[] = []
        for (const o of objects) {
          if (o.type === 'x-mitre-tactic' && !(o as { x_mitre_deprecated?: boolean }).x_mitre_deprecated) {
            t.push({
              id: (o as { external_references: { external_id: string }[] }).external_references?.[0]?.external_id ?? '',
              shortName: (o as { x_mitre_shortname: string }).x_mitre_shortname,
              name: (o as { name: string }).name,
            })
          } else if (
            o.type === 'attack-pattern' &&
            !(o as { revoked?: boolean }).revoked &&
            !(o as { x_mitre_deprecated?: boolean }).x_mitre_deprecated &&
            !(o as { x_mitre_is_subtechnique?: boolean }).x_mitre_is_subtechnique
          ) {
            const refs = (o as { external_references?: { external_id?: string; source_name?: string }[] }).external_references ?? []
            const id = refs.find((r) => r.source_name === 'mitre-attack')?.external_id
            const phases = (o as { kill_chain_phases?: { phase_name: string }[] }).kill_chain_phases ?? []
            if (!id) continue
            tx.push({ id, name: (o as { name: string }).name, tactics: phases.map((p) => p.phase_name) })
          }
        }
        t.sort((a, b) => TACTIC_ORDER.indexOf(a.shortName) - TACTIC_ORDER.indexOf(b.shortName))
        setTactics(t)
        setTechniques(tx)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /* Sync coverage from localStorage when it might change (other tabs etc.) */
  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem('threatrecon_mitre_coverage')
        setCoverage(raw ? JSON.parse(raw) : {})
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const grid = useMemo(() => {
    if (!tactics || !techniques) return null
    const map: Record<string, MitreTechnique[]> = {}
    for (const t of tactics) map[t.shortName] = []
    for (const tech of techniques) {
      for (const tactic of tech.tactics) {
        if (map[tactic]) map[tactic]!.push(tech)
      }
    }
    return map
  }, [tactics, techniques])

  if (error) {
    return (
      <div className="rounded border border-red-500/30 bg-red-500/10 p-4 font-mono text-[11px] text-red-200">
        Failed to load MITRE ATT&CK data: {error}
      </div>
    )
  }
  if (!tactics || !techniques || !grid) {
    return (
      <div className="rounded border border-white/10 bg-[#0f1824] p-4 font-mono text-[11px] text-[#8a9ab5]">
        Loading MITRE ATT&CK matrix…
      </div>
    )
  }

  const counts = {
    total: techniques.length,
    detected: techniques.filter((t) => coverage[t.id] === 'detected').length,
    missed: techniques.filter((t) => coverage[t.id] === 'missed').length,
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1824] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-sm tracking-[0.3em] text-[#8a9ab5]">MITRE ATT&CK COVERAGE</div>
        <div className="font-mono text-[11px] text-[#a8b6ca]">
          <span className="text-emerald-300">{counts.detected}</span> detected ·{' '}
          <span className="text-red-300">{counts.missed}</span> missed ·{' '}
          <span className="text-[#5e9bff]">{counts.total - counts.detected - counts.missed}</span> never seen
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: tactics.length * 160 }}>
          {tactics.map((tactic) => (
            <div key={tactic.shortName} className="flex w-40 flex-shrink-0 flex-col">
              <div className="sticky top-0 z-10 mb-1 truncate rounded bg-[#1a2436] px-2 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-[#5e9bff]">
                {tactic.name}
              </div>
              <div className="max-h-[420px] overflow-y-auto pr-1">
                {(grid[tactic.shortName] ?? []).map((tech) => {
                  const state = coverage[tech.id]
                  const cls =
                    state === 'detected'
                      ? 'bg-emerald-500/40 border-emerald-300/40 text-emerald-50'
                      : state === 'missed'
                      ? 'bg-yellow-500/30 border-yellow-300/30 text-yellow-100'
                      : 'bg-[#2d3a4a]/60 border-white/5 text-[#8a9ab5]'
                  return (
                    <div
                      key={tech.id}
                      className={`mb-1 truncate rounded border px-2 py-1 font-mono text-[10px] ${cls}`}
                      title={`${tech.id} — ${tech.name}${state ? ` (${state})` : ''}`}
                    >
                      {tech.id} {tech.name}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
