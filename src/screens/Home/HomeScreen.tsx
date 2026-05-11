import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Logo } from '../../components/shared/Logo'
import { usePlayer } from '../../contexts/PlayerContext'
import { useGame } from '../../contexts/GameContext'
import type { Difficulty } from '../../types/player.types'

type Step = 'name' | 'difficulty' | 'briefing'

const DIFFICULTIES: {
  id: Difficulty
  title: string
  subtitle: string
  timer: string
}[] = [
  {
    id: 'recruit',
    title: 'RECRUIT',
    subtitle: 'Hints enabled · 45 minutes · low noise',
    timer: '45 min',
  },
  {
    id: 'analyst',
    title: 'ANALYST',
    subtitle: 'No hints · 35 minutes · medium noise',
    timer: '35 min',
  },
  {
    id: 'threat_hunter',
    title: 'THREAT HUNTER',
    subtitle: 'Counter-forensics · 25 minutes · high noise',
    timer: '25 min',
  },
  {
    id: 'incident_commander',
    title: 'INCIDENT COMMANDER',
    subtitle: 'Maximum noise · 15 minutes · exfiltration pressure',
    timer: '15 min',
  },
]

export function HomeScreen() {
  const navigate = useNavigate()
  const { profile, setName, setDifficulty, recordCaseAttempt } = usePlayer()
  const { startCase } = useGame()

  const [step, setStep] = useState<Step>('name')
  const [localName, setLocalName] = useState(profile.name)
  const [nameErr, setNameErr] = useState('')
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | null>(profile.difficulty)
  const [preset, setPreset] = useState<'procedural' | 'alpha-01' | 'bravo-02' | 'charlie-03' | 'delta-04'>(
    'alpha-01',
  )

  const nameOk = useMemo(() => {
    const n = localName.trim()
    if (n.length < 2 || n.length > 60) return false
    /* Allow Unicode letters/marks (incl. accents like André), digits, spaces, hyphens, apostrophes, periods */
    return /^[\p{L}\p{M}0-9 .'\-]+$/u.test(n)
  }, [localName])

  useEffect(() => {
    if (step !== 'briefing') return
    const lines = [
      `> OPERATIVE ${localName.trim().toUpperCase()} — CREDENTIALS VERIFIED`,
      `> CLEARANCE LEVEL: RECRUIT`,
      `> MISSION BRIEFING INCOMING...`,
      `> SYSTEM COMPROMISED. THREAT ACTOR ACTIVE.`,
      `> YOUR ORDERS: FIND THEM. REMOVE THEM. LOCK THE DOOR.`,
    ]
    let i = 0
    const el = window.setInterval(() => {
      i++
      if (i >= lines.length) {
        window.clearInterval(el)
      }
    }, 600)
    return () => window.clearInterval(el)
  }, [step, localName])

  const onBegin = () => {
    if (!selectedDiff || !nameOk) return
    setName(localName.trim())
    setDifficulty(selectedDiff)
    recordCaseAttempt()
    if (preset === 'procedural') {
      startCase({ difficulty: selectedDiff })
    } else {
      startCase({ difficulty: selectedDiff, presetCase: preset })
    }
    navigate('/game')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a12] text-[#e8edf5]">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute inset-0 scanline" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-12 w-12 text-[#5e9bff]" />
            <div>
              <div className="font-display text-xs tracking-[0.55em] text-[#8a9ab5]">THREATRECON.IO</div>
              <div className="font-display text-2xl tracking-[0.08em] text-[#e8edf5]">OPERATIVE</div>
            </div>
          </div>
          <Link className="font-mono text-[11px] text-[#5e9bff] hover:underline" to="/dashboard">
            Dashboard
          </Link>
        </header>

        <main className="mt-14 flex flex-1 items-center justify-center">
          {step === 'name' ? (
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-10 backdrop-blur-xl">
              <div className="font-display text-sm tracking-[0.35em] text-[#8a9ab5]">OPERATIVE CALLSIGN</div>
              <p className="mt-3 font-mono text-[12px] text-[#a8b6ca]">
                Your name will appear on your Certificate of Completion.
              </p>
              <label className="mt-8 block font-mono text-[11px] uppercase tracking-widest text-[#8a9ab5]">
                Full name
              </label>
              <input
                value={localName}
                onChange={(e) => {
                  setLocalName(e.target.value)
                  setNameErr('')
                }}
                placeholder="Enter your full name"
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-4 font-mono text-[14px] text-[#e8edf5] outline-none ring-[#5e9bff] focus:border-[#5e9bff] focus:ring-2"
              />
              {nameErr ? <div className="mt-2 font-mono text-[12px] text-red-400">{nameErr}</div> : null}
              <button
                type="button"
                disabled={!nameOk}
                onClick={() => {
                  if (!nameOk) {
                    setNameErr("Use 2–60 characters. Letters, digits, spaces, hyphens, apostrophes, periods.")
                    return
                  }
                  setStep('difficulty')
                }}
                className="mt-8 w-full rounded-lg bg-[#5e9bff] py-4 font-mono text-[13px] font-semibold text-[#060a12] disabled:cursor-not-allowed disabled:opacity-40"
              >
                BEGIN MISSION →
              </button>
            </div>
          ) : null}

          {step === 'difficulty' ? (
            <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-10 backdrop-blur-xl">
              <div className="font-display text-sm tracking-[0.35em] text-[#8a9ab5]">SELECT DIFFICULTY</div>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDiff(d.id)}
                    className={`rounded-xl border p-6 text-left transition hover:border-[#5e9bff]/60 ${
                      selectedDiff === d.id ? 'border-[#5e9bff] bg-[#5e9bff]/10' : 'border-white/10 bg-black/20'
                    }`}
                  >
                    <div className="font-display text-lg text-[#e8edf5]">{d.title}</div>
                    <div className="mt-2 font-mono text-[12px] text-[#a8b6ca]">{d.subtitle}</div>
                    <div className="mt-4 font-mono text-[11px] text-[#5e9bff]">Timer {d.timer}</div>
                  </button>
                ))}
              </div>

              <div className="mt-10">
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#8a9ab5]">Scenario</div>
                <select
                  className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-[12px]"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as typeof preset)}
                >
                  <option value="procedural">Procedural case (seeded)</option>
                  <option value="alpha-01">ALPHA-01 — The Ghost Process</option>
                  <option value="bravo-02">BRAVO-02 — Scheduled for Disaster</option>
                  <option value="charlie-03">CHARLIE-03 — The Insider</option>
                  <option value="delta-04">DELTA-04 — Supply Chain</option>
                </select>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-6 py-3 font-mono text-[12px]"
                  onClick={() => setStep('name')}
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedDiff}
                  onClick={() => setStep('briefing')}
                  className="flex-1 rounded-lg bg-[#5e9bff] py-3 font-mono text-[13px] font-semibold text-[#060a12] disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 'briefing' ? (
            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-10 backdrop-blur-xl">
              <BriefingLines name={localName.trim()} />
              <button
                type="button"
                className="mt-10 w-full rounded-lg bg-[#5e9bff] py-4 font-mono text-[13px] font-semibold text-[#060a12]"
                onClick={onBegin}
              >
                ENTER OPERATING ENVIRONMENT
              </button>
              <button
                type="button"
                className="mt-4 w-full rounded-lg border border-white/10 py-3 font-mono text-[12px]"
                onClick={() => setStep('difficulty')}
              >
                Back
              </button>
            </div>
          ) : null}
        </main>

        <footer className="mt-auto py-10 text-center font-mono text-[11px] text-[#4a566b]">
          Classification: controlled operational simulation · Hostile traffic is fabricated · threatrecon.io
        </footer>
      </div>
    </div>
  )
}

function BriefingLines({ name }: { name: string }) {
  const lines = [
    `> OPERATIVE ${name.toUpperCase()} — CREDENTIALS VERIFIED`,
    `> CLEARANCE LEVEL: RECRUIT`,
    `> MISSION BRIEFING INCOMING...`,
    `> SYSTEM COMPROMISED. THREAT ACTOR ACTIVE.`,
    `> YOUR ORDERS: FIND THEM. REMOVE THEM. LOCK THE DOOR.`,
  ]
  return (
    <div className="space-y-3 font-mono text-[13px] leading-relaxed text-[#a8b6ca]">
      {lines.map((l) => (
        <div key={l} className="border-l-2 border-[#5e9bff]/40 pl-4">
          {l}
        </div>
      ))}
    </div>
  )
}
