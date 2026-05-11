import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import type { DebriefPayload } from '../../components/ReportEditor/ReportEditor'
import { downloadCertificatePdf } from '../../engine/CertificateGenerator'
import { Logo } from '../../components/shared/Logo'

export function DebriefScreen() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: DebriefPayload | undefined }
  const certRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  /* Synthesize a debrief timeline from MITRE chain + player findings */
  const timeline = useMemo(() => (state ? buildTimeline(state) : []), [state])

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060a12] text-[#e8edf5]">
        No debrief data.{' '}
        <button className="ml-3 underline" type="button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    )
  }

  const data = [
    { axis: 'Speed', value: state.breakdown.speed },
    { axis: 'Complete', value: state.breakdown.completeness },
    { axis: 'Forensic', value: state.breakdown.forensicIntegrity },
    { axis: 'Harden', value: state.breakdown.hardening },
    { axis: 'Report', value: state.breakdown.reportQuality },
  ]

  const onPdf = async () => {
    if (!certRef.current) return
    setBusy(true)
    try {
      await downloadCertificatePdf({
        verificationId: state.verificationId,
        playerName: state.playerName,
        caseId: state.caseId,
        scenario: state.industryName,
        difficulty: state.difficulty.replace('_', ' ').toUpperCase(),
        actor: state.actorName,
        vector: state.entryTechnique,
        score: state.score,
        grade: state.grade,
        breakdown: state.breakdown as unknown as Record<string, number>,
        mitre: state.mitre,
        element: certRef.current,
        filename: `ThreatRecon_Certificate_${state.playerName.replace(/\s+/g, '_')}.pdf`,
      })
      localStorage.setItem(`tr_verify_${state.verificationId}`, JSON.stringify(state))
    } finally {
      setBusy(false)
    }
  }

  const nameFontClass = certNameFontClass(state.playerName)

  return (
    <div className="min-h-screen bg-[#060a12] px-8 py-10 text-[#e8edf5]">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="font-display text-lg tracking-[0.35em] text-[#e8edf5]">DEBRIEF</div>
            <div className="font-mono text-[11px] text-[#8a9ab5]">ThreatRecon.io — OPERATIVE</div>
          </div>
        </div>
        <button type="button" className="rounded border border-white/10 px-4 py-2 text-[12px]" onClick={() => navigate('/')}>
          Main Menu
        </button>
      </header>

      <main className="mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-[#0f1824] p-6">
          <div className="font-display text-sm tracking-[0.3em] text-[#8a9ab5]">FINAL SCORE</div>
          <div className="mt-4 flex items-end gap-4">
            <div className="font-display text-7xl text-[#5e9bff]">{state.score}</div>
            <div className="mb-2 rounded-full border border-[#5e9bff]/40 px-4 py-1 font-mono text-sm text-[#5e9bff]">
              GRADE {state.grade}
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="#2d3a4a" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#8a9ab5', fontSize: 11 }} />
                <Radar name="Score" dataKey="value" stroke="#5e9bff" fill="#5e9bff" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0f1824] p-6 font-mono text-[12px]">
          <div className="text-[11px] text-[#8a9ab5]">ATTACK REPLAY (SUMMARY)</div>
          <ul className="mt-4 space-y-3 text-[#e8edf5]">
            <li>
              <span className="text-[#5e9bff]">Actor:</span> {state.actorName}
            </li>
            <li>
              <span className="text-[#5e9bff]">Entry:</span> {state.entryTechnique}
            </li>
            <li>
              <span className="text-[#5e9bff]">Target:</span> {state.industryName}
            </li>
            <li>
              <span className="text-[#5e9bff]">Time to report:</span> {fmtDuration(state.timeUsedSec)} /{' '}
              {fmtDuration(state.timerTotalSec)}
            </li>
            <li>
              <span className="text-[#5e9bff]">Artifacts found:</span> {state.artifactsFound.length} of {state.artifactsTotal}
            </li>
          </ul>
          <div className="mt-6 text-[11px] text-[#8a9ab5]">MITRE techniques in scenario</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.mitre.map((m) => (
              <span key={m} className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] text-purple-200">
                {m}
              </span>
            ))}
          </div>
        </section>
      </main>

      <section className="mx-auto mt-10 max-w-6xl rounded-xl border border-white/10 bg-[#0f1824] p-6">
        <div className="font-display text-sm tracking-[0.3em] text-[#8a9ab5]">ATTACK TIMELINE</div>
        <TimelineScrubber events={timeline} totalSec={state.timerTotalSec} />
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-xl border border-red-500/20 bg-[#0f1824] p-6">
        <div className="font-display text-sm tracking-[0.3em] text-[#8a9ab5]">
          ARTIFACTS MISSED ({state.artifactsTotal - state.artifactsFound.length} of {state.artifactsTotal})
        </div>
        <div className="mt-4 grid gap-3">
          {missedArtifacts(state).map((m) => (
            <div key={m.id} className="rounded border border-red-500/20 bg-red-500/5 p-4 font-mono text-[12px]">
              <div className="text-red-200">[✗] {m.label}</div>
              <div className="mt-1 text-[11px] text-[#a8b6ca]">Location: {m.location}</div>
              <div className="mt-1 text-[11px] text-[#5e9bff]">Technique: {m.mitre}</div>
              <div className="mt-1 text-[11px] text-[#8a9ab5]">{m.why}</div>
            </div>
          ))}
          {missedArtifacts(state).length === 0 ? (
            <div className="font-mono text-[11px] text-emerald-300">
              All known artifacts identified — clean sweep.
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-xl border border-purple-500/20 bg-[#0f1824] p-6">
        <div className="font-display text-sm tracking-[0.3em] text-[#8a9ab5]">MITRE ATT&CK COVERAGE — THIS CASE</div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {state.mitre.map((id) => {
            const detected = artifactsCoverTechnique(id, state)
            return (
              <div
                key={id}
                className={`flex items-center justify-between rounded border px-3 py-2 font-mono text-[12px] ${
                  detected ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'
                }`}
              >
                <span>{id}</span>
                <span>{detected ? '✓ identified' : '✗ missed'}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 font-mono text-[10px] text-[#4a566b]">Coverage saved to your dashboard heatmap.</div>
      </section>

      {state.forensicViolations.length > 0 ? (
        <section className="mx-auto mt-10 max-w-6xl rounded-xl border border-yellow-500/20 bg-[#0f1824] p-6">
          <div className="font-display text-sm tracking-[0.3em] text-[#8a9ab5]">FORENSIC INTEGRITY VIOLATIONS</div>
          <ul className="mt-4 space-y-2 font-mono text-[12px]">
            {state.forensicViolations.map((v, i) => (
              <li key={i} className="rounded border border-yellow-500/20 bg-yellow-500/5 p-2 text-yellow-100">
                <span className="font-bold uppercase">{v.kind.replace(/_/g, ' ')}</span> — {v.target} — {v.note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mx-auto mt-10 max-w-6xl">
        <div
          ref={certRef}
          className="rounded-xl border border-[#5e9bff]/30 bg-[#060a12] p-10 shadow-[0_0_80px_rgba(94,155,255,0.12)]"
        >
          <div className="text-center font-display text-xs tracking-[0.5em] text-[#8a9ab5]">
            THREATRECON.IO — OPERATIVE
          </div>
          <div className="mt-4 text-center font-display text-2xl text-[#e8edf5]">
            Certificate of Incident Response Proficiency
          </div>
          <div className={`mt-8 break-words text-center font-display text-white ${nameFontClass}`}>
            {state.playerName}
          </div>
          <div className="mt-8 grid gap-2 text-center font-mono text-[11px] text-[#a8b6ca]">
            <div>Case: {state.caseId}</div>
            <div>
              Score {state.score} · Grade {state.grade} · {state.difficulty.replace('_', ' ')}
            </div>
            <div>Scenario: {state.industryName} · Vector: {state.entryTechnique}</div>
            <div className="break-all text-[10px] text-[#4a566b]">Verification ID: {state.verificationId}</div>
            <div className="text-[10px] text-[#4a566b]">
              Local verify route:{' '}
              <span className="text-[#5e9bff]">/verify/{encodeURIComponent(state.verificationId)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            disabled={busy}
            className="rounded bg-[#5e9bff] px-6 py-3 font-mono text-[12px] text-[#060a12] disabled:opacity-50"
            onClick={() => void onPdf()}
          >
            {busy ? 'GENERATING…' : 'DOWNLOAD CERTIFICATE (PDF)'}
          </button>
          <button
            type="button"
            className="rounded border border-white/10 px-6 py-3 font-mono text-[12px]"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

interface TLEvent {
  offsetSec: number
  kind: 'attacker' | 'player'
  title: string
  detail: string
  found?: boolean
  technique?: string
}

function buildTimeline(state: DebriefPayload): TLEvent[] {
  /* Map attack chain to evenly spaced offsets within first half of timer */
  const total = state.timerTotalSec
  const events: TLEvent[] = []
  state.mitre.forEach((id, i) => {
    const off = Math.floor((i + 0.5) * (total / 2) / Math.max(1, state.mitre.length))
    events.push({
      offsetSec: off,
      kind: 'attacker',
      title: id,
      detail: `${id} executed`,
      technique: id,
      found: artifactsCoverTechnique(id, state),
    })
  })
  /* Player completed report at timeUsedSec */
  events.push({
    offsetSec: state.timeUsedSec,
    kind: 'player',
    title: 'Report submitted',
    detail: `Score ${state.score} (${state.grade})`,
  })
  events.sort((a, b) => a.offsetSec - b.offsetSec)
  return events
}

function TimelineScrubber({ events, totalSec }: { events: TLEvent[]; totalSec: number }) {
  const [sel, setSel] = useState(0)
  if (events.length === 0) return null
  const selected = events[sel]!
  return (
    <div>
      <div className="relative mt-6 h-12 rounded bg-black/40">
        <div className="absolute inset-y-0 left-0 right-0 my-auto h-px bg-white/10" />
        {events.map((e, i) => {
          const pct = Math.min(100, Math.max(0, (e.offsetSec / Math.max(1, totalSec)) * 100))
          const color = e.kind === 'attacker' ? (e.found ? 'bg-emerald-400 border-emerald-200' : 'bg-red-400 border-red-200') : 'bg-[#5e9bff] border-blue-200'
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSel(i)}
              className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${color} ${
                sel === i ? 'ring-2 ring-white' : ''
              }`}
              style={{ left: `${pct}%` }}
              title={`${fmtDuration(e.offsetSec)} — ${e.title}`}
            />
          )
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-[#4a566b]">
        <span>0:00</span>
        <span>{fmtDuration(totalSec)}</span>
      </div>

      <div className="mt-6 rounded border border-white/10 bg-black/30 p-4 font-mono text-[12px]">
        <div className="text-[#8a9ab5]">T+{fmtDuration(selected.offsetSec)}</div>
        <div className={`mt-2 text-base ${selected.kind === 'attacker' ? 'text-red-200' : 'text-[#5e9bff]'}`}>
          {selected.title}
        </div>
        <div className="mt-1 text-[#a8b6ca]">{selected.detail}</div>
        {selected.kind === 'attacker' ? (
          <div className="mt-2 text-[11px] text-[#8a9ab5]">
            {selected.found ? '✓ identified by player' : '✗ missed'}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function missedArtifacts(state: DebriefPayload): { id: string; label: string; mitre: string; location: string; why: string }[] {
  /* Without full case context, infer from technique IDs missed */
  const found = new Set(state.artifactsFound.map((s) => s.toLowerCase()))
  const out: { id: string; label: string; mitre: string; location: string; why: string }[] = []
  state.mitre.forEach((id) => {
    const labelGuess = state.entryTechnique && id === state.mitre[0] ? state.entryTechnique : id
    const matched = [...found].some((f) => f.includes(labelGuess.toLowerCase()) || f.includes(id.toLowerCase()))
    if (matched) return
    out.push({
      id,
      label: `${id} artifact`,
      mitre: id,
      location: 'See evidence locker / VFS / Registry',
      why: 'Not captured in evidence — missed in detection or hunt.',
    })
  })
  return out
}

function artifactsCoverTechnique(id: string, state: DebriefPayload): boolean {
  return state.artifactsFound.some((s) => s.toLowerCase().includes(id.toLowerCase()))
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function certNameFontClass(name: string): string {
  if (name.length <= 12) return 'text-5xl'
  if (name.length <= 20) return 'text-4xl'
  if (name.length <= 30) return 'text-3xl'
  return 'text-2xl'
}
