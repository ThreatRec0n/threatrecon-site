import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CaseDefinition } from '../../types/case.types'
import type { Difficulty } from '../../types/player.types'
import { Logo } from '../shared/Logo'
import {
  type ReportQuestion,
  getCaseQuestions,
  shuffleQuestionOptions,
} from '../../data/reportQuestions'

function mitreTechniqueUrl(id: string): string | null {
  const m = id.trim().toUpperCase().match(/^T(\d{4})(?:\.(\d{3}))?$/)
  if (!m) return null
  const base = `https://attack.mitre.org/techniques/T${m[1]}`
  return m[2] ? `${base}/${m[2]}/` : `${base}/`
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconX({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

const CATEGORY_STYLE: Record<ReportQuestion['category'], { label: string; badge: string }> = {
  initial_access: { label: 'Initial Access', badge: 'bg-orange-500/25 text-orange-100 border-orange-500/40' },
  threat_actor: { label: 'Threat Actor', badge: 'bg-red-500/25 text-red-100 border-red-500/40' },
  malware: { label: 'Malware', badge: 'bg-amber-500/25 text-amber-100 border-amber-500/40' },
  c2: { label: 'C2', badge: 'bg-indigo-500/25 text-indigo-100 border-indigo-500/40' },
  persistence: { label: 'Persistence', badge: 'bg-yellow-500/20 text-yellow-100 border-yellow-500/35' },
  technique: { label: 'Technique', badge: 'bg-blue-500/25 text-blue-100 border-blue-500/40' },
  victim: { label: 'Victim', badge: 'bg-teal-500/25 text-teal-100 border-teal-500/35' },
  containment: { label: 'Containment', badge: 'bg-emerald-500/25 text-emerald-100 border-emerald-500/35' },
  lateral_movement: { label: 'Lateral Movement', badge: 'bg-purple-500/25 text-purple-100 border-purple-500/35' },
  exfil: { label: 'Exfiltration', badge: 'bg-pink-500/25 text-pink-100 border-pink-500/35' },
}

export interface QuizAnswerRecord {
  questionId: string
  category: ReportQuestion['category']
  selectedIndex: number | null
  correctIndex: number
  pointsEarned: number
  questionText: string
  options: string[]
}

export interface ReportQuizProps {
  open: boolean
  caseDef: CaseDefinition
  analystName: string
  difficulty: Difficulty
  timerRemaining: number
  timerTotal: number
  sessionShuffleSeed: number
  onLiveScore?: (n: number) => void
  onSubmit: (result: { quizScore: number; quizTotal: number; answers: QuizAnswerRecord[] }) => void
}

export function ReportQuiz({
  open,
  caseDef,
  analystName,
  difficulty,
  timerRemaining,
  timerTotal,
  sessionShuffleSeed,
  onLiveScore,
  onSubmit,
}: ReportQuizProps) {
  const prepared = useMemo(() => {
    const bank = getCaseQuestions(caseDef)
    return bank.questions.map((q) => shuffleQuestionOptions(q, sessionShuffleSeed))
  }, [caseDef, sessionShuffleSeed])

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([])
  const [runningScore, setRunningScore] = useState(0)
  const [nextReady, setNextReady] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const reviewRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setSelected(null)
    setRevealed(false)
    setAnswers([])
    setRunningScore(0)
    onLiveScore?.(0)
    setNextReady(false)
    setShowSummary(false)
  }, [open, caseDef.caseId, sessionShuffleSeed, onLiveScore])

  const totalPts = prepared.reduce((s, p) => s + p.question.pointValue, 0)

  useEffect(() => {
    if (!revealed) return
    setNextReady(false)
    window.clearTimeout(timerRef.current ?? undefined)
    timerRef.current = window.setTimeout(() => setNextReady(true), 1500)
    return () => window.clearTimeout(timerRef.current ?? undefined)
  }, [revealed, step])

  const current = prepared[step]

  const fmtClock = (sec: number) => {
    const m = Math.floor(Math.max(0, sec) / 60)
    const s = Math.max(0, sec) % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const categoryHits = useMemo(() => {
    const map = new Map<ReportQuestion['category'], { ok: number; total: number }>()
    for (const p of prepared) {
      const c = p.question.category
      if (!map.has(c)) map.set(c, { ok: 0, total: 0 })
      map.get(c)!.total += 1
    }
    for (const a of answers) {
      const z = map.get(a.category)
      if (!z) continue
      if (a.pointsEarned > 0) z.ok += 1
    }
    return map
  }, [prepared, answers])

  const pickOption = (idx: number) => {
    if (revealed || !current) return
    setSelected(idx)
    setRevealed(true)
    const ok = idx === current.correctIndex
    const pts = ok ? current.question.pointValue : 0
    const nextScore = runningScore + pts
    setRunningScore(nextScore)
    onLiveScore?.(nextScore)
    setAnswers((prev) => [
      ...prev,
      {
        questionId: current.question.id,
        category: current.question.category,
        selectedIndex: idx,
        correctIndex: current.correctIndex,
        pointsEarned: pts,
        questionText: current.question.question,
        options: current.question.options,
      },
    ])
  }

  const goNext = useCallback(() => {
    if (!nextReady) return
    if (step >= prepared.length - 1) return
    setStep((s) => s + 1)
    setSelected(null)
    setRevealed(false)
  }, [nextReady, step, prepared.length])

  const finalize = useCallback(() => {
    const quizScore = answers.reduce((s, a) => s + a.pointsEarned, 0)
    onSubmit({ quizScore, quizTotal: totalPts, answers })
  }, [answers, onSubmit, totalPts])

  const diffLabel = difficulty.replace('_', ' ').toUpperCase()

  const keyFindings = useMemo(() => {
    const labels: Partial<Record<ReportQuestion['category'], string>> = {}
    for (const a of answers) {
      const prep = prepared.find((p) => p.question.id === a.questionId)
      if (!prep) continue
      labels[prep.question.category] = prep.question.options[a.selectedIndex ?? -1] ?? '(skipped)'
    }
    return {
      threatActor: labels.threat_actor ?? '—',
      initialAccess: labels.initial_access ?? '—',
      c2: labels.c2 ?? '—',
      persistence: labels.persistence ?? '—',
      containment: labels.containment ?? '—',
    }
  }, [answers, prepared])

  if (!open) return null

  const pct = totalPts > 0 ? Math.round((runningScore / totalPts) * 100) : 0

  return (
    <div className="fixed inset-0 z-[8000] flex flex-col text-[#e8edf5]" style={{ background: 'rgba(6,10,18,0.97)' }}>
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 text-[#5e9bff]" />
          <div className="font-mono text-[10px] text-[#8a9ab5]">
            <div className="font-display text-[11px] tracking-[0.35em] text-[#e8edf5]">THREATRECON</div>
          </div>
        </div>
        <div className="font-display text-sm tracking-[0.45em] text-[#5e9bff]">INCIDENT REPORT QUIZ</div>
        <div className="text-right font-mono text-[11px] text-[#a8b6ca]">
          <div className="text-white">{caseDef.code ?? caseDef.caseId.slice(0, 8)}</div>
          <div className="tabular-nums text-[#5e9bff]">
            {fmtClock(timerRemaining)} / {fmtClock(timerTotal)}
          </div>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-8 py-2 font-mono text-[11px]">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Analyst <span className="text-[#5e9bff]">{analystName}</span>
          </span>
          <span className="text-[#8a9ab5]">|</span>
          <span>{diffLabel}</span>
          <span className="text-[#8a9ab5]">|</span>
          <span>
            Score so far{' '}
            <span className="text-emerald-300">
              {runningScore}/{totalPts}
            </span>
          </span>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          {[...categoryHits.entries()].map(([cat, v]) => (
            <span
              key={cat}
              title={`${cat}: ${v.ok}/${v.total}`}
              className="rounded border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#8a9ab5]"
            >
              {CATEGORY_STYLE[cat].label.slice(0, 3)} {v.ok}/{v.total}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 px-6 py-3">
        <div className="font-mono text-[11px] text-[#8a9ab5]">
          Question {Math.min(step + 1, prepared.length)} of {prepared.length}
        </div>
        <div className="flex gap-1.5">
          {prepared.map((_, i) => {
            const answered = showSummary || i < step || (i === step && revealed)
            const cur = !showSummary && i === step && !revealed
            return (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full border ${
                  answered ? 'border-emerald-400 bg-emerald-400' : cur ? 'animate-pulse border-[#5e9bff] bg-[#5e9bff]/70' : 'border-white/20 bg-black/40'
                }`}
              />
            )
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-10 pt-2">
        {!showSummary ? (
          current ? (
            <div className="w-full max-w-[900px] rounded-xl border border-white/10 bg-[#0c121f]/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${CATEGORY_STYLE[current.question.category].badge}`}
                >
                  {CATEGORY_STYLE[current.question.category].label}
                </span>
                {current.question.mitreTag ? (
                  <button
                    type="button"
                    className="rounded border border-purple-500/35 bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-purple-200 hover:bg-purple-500/25"
                    onClick={() => {
                      const url = mitreTechniqueUrl(current.question.mitreTag!)
                      if (url) window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    {current.question.mitreTag}
                  </button>
                ) : null}
              </div>

              <h2 className="mt-4 text-[20px] font-semibold leading-snug text-white">{current.question.question}</h2>

              <div className="mt-6 grid gap-3">
                {current.question.options.map((opt, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx] ?? '?'
                  const isSel = selected === idx
                  const isCorr = idx === current.correctIndex
                  let border = 'border-white/15 bg-black/25'
                  const labelBg = 'bg-[#5e9bff]/25 text-[#9fd0ff]'
                  if (revealed) {
                    if (isCorr) border = 'border-emerald-400 bg-emerald-500/10'
                    else if (isSel && !isCorr) border = 'border-red-400 bg-red-500/10'
                    else border = 'border-white/10 bg-black/20'
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={revealed}
                      onClick={() => pickOption(idx)}
                      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left font-mono text-[13px] transition-colors hover:border-white/30 hover:bg-white/[0.04] disabled:cursor-default ${border}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 font-display text-sm ${labelBg}`}
                      >
                        {letter}
                      </span>
                      <span
                        className={`flex-1 ${revealed && isCorr ? 'text-emerald-200' : ''} ${revealed && isSel && !isCorr ? 'text-red-200' : ''}`}
                      >
                        {opt}
                      </span>
                      {revealed && isCorr ? <IconCheck className="shrink-0 text-emerald-400" /> : null}
                      {revealed && isSel && !isCorr ? <IconX className="shrink-0 text-red-400" /> : null}
                    </button>
                  )
                })}
              </div>

              {revealed ? (
                <div
                  className={`mt-6 rounded-lg border px-4 py-3 font-mono text-[12px] ${
                    selected === current.correctIndex ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/35 bg-red-500/10'
                  }`}
                >
                  <div
                    className={`font-display text-[11px] tracking-[0.25em] ${selected === current.correctIndex ? 'text-emerald-300' : 'text-red-300'}`}
                  >
                    {selected === current.correctIndex ? 'CORRECT' : 'INCORRECT'}
                  </div>
                  <p className="mt-2 leading-relaxed text-[#e8edf5]">{current.question.explanation}</p>
                  {selected !== current.correctIndex ? (
                    <p className="mt-2 text-[11px] text-[#a8b6ca]">
                      Where to find this: <span className="text-[#5e9bff]">{current.question.hint}</span>
                    </p>
                  ) : null}
                  {current.question.mitreTag ? (
                    <button
                      type="button"
                      className="mt-2 text-[11px] text-purple-300 underline"
                      onClick={() => {
                        const url = mitreTechniqueUrl(current.question.mitreTag!)
                        if (url) window.open(url, '_blank', 'noopener,noreferrer')
                      }}
                    >
                      Open MITRE reference for {current.question.mitreTag}
                    </button>
                  ) : null}
                  <div className="mt-3 text-[11px]">
                    Points earned:{' '}
                    <span className={selected === current.correctIndex ? 'text-emerald-300' : 'text-red-300'}>
                      {selected === current.correctIndex ? `+${current.question.pointValue}` : '+0'} pts
                    </span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!nextReady}
                      onClick={() => {
                        if (step >= prepared.length - 1) setShowSummary(true)
                        else goNext()
                      }}
                      className="rounded border border-[#5e9bff]/50 bg-[#5e9bff]/15 px-4 py-2 text-[12px] font-semibold text-[#9fd0ff] hover:bg-[#5e9bff]/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {step >= prepared.length - 1 ? 'View Results →' : 'Next Question →'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null
        ) : (
          <div className="w-full max-w-[900px] space-y-8">
            <div className="rounded-xl border border-white/10 bg-[#0c121f]/95 p-8 text-center">
              <div className="font-display text-[11px] tracking-[0.35em] text-[#8a9ab5]">FINAL QUIZ SCORE</div>
              <div className="mt-4 font-display text-6xl text-[#5e9bff]">
                {runningScore} / {totalPts}
              </div>
              <div className="mt-2 font-mono text-lg text-[#a8b6ca]">
                GRADE{' '}
                {(() => {
                  const p = runningScore / Math.max(1, totalPts)
                  if (p >= 0.9) return 'A'
                  if (p >= 0.8) return 'B+'
                  if (p >= 0.7) return 'B'
                  if (p >= 0.6) return 'C'
                  if (p >= 0.5) return 'D'
                  return 'F'
                })()}
              </div>
              <div className="mx-auto mt-6 h-3 max-w-md overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5e9bff] to-emerald-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {pct < 50 ? (
                <p className="mt-6 rounded border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 font-mono text-[12px] text-yellow-100">
                  You missed critical findings — review the tools before your next case.
                </p>
              ) : null}
              {pct >= 80 ? (
                <p className="mt-6 rounded border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 font-mono text-[12px] text-emerald-100">
                  Excellent analysis — you identified the key indicators of compromise.
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0c121f]/90 p-6">
              <div className="font-display text-[11px] tracking-[0.3em] text-[#8a9ab5]">PERFORMANCE BY CATEGORY</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[...categoryHits.entries()].map(([cat, v]) => (
                  <div key={cat} className="rounded border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span>{CATEGORY_STYLE[cat].label}</span>
                      <span className="text-[#5e9bff]">
                        {v.ok}/{v.total}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                      <div className="h-full bg-[#5e9bff]" style={{ width: `${v.total ? (v.ok / v.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div ref={reviewRef} className="rounded-xl border border-white/10 bg-[#0c121f]/90 p-6">
              <div className="font-display text-[11px] tracking-[0.3em] text-[#8a9ab5]">QUESTION REVIEW</div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[11px]">
                  <thead className="text-left text-[#8a9ab5]">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Prompt</th>
                      <th className="p-2">Your answer</th>
                      <th className="p-2">Correct</th>
                      <th className="p-2">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answers.map((a, i) => (
                      <tr key={a.questionId} className="border-t border-white/5">
                        <td className="p-2 align-top tabular-nums">{i + 1}</td>
                        <td className="max-w-xs p-2 align-top text-[#e8edf5]">{a.questionText}</td>
                        <td className={`p-2 align-top ${a.pointsEarned ? 'text-emerald-300' : 'text-red-300'}`}>
                          {a.selectedIndex !== null ? a.options[a.selectedIndex] : '—'}
                        </td>
                        <td className="p-2 align-top text-emerald-200">{a.options[a.correctIndex]}</td>
                        <td className="p-2 align-top tabular-nums">{a.pointsEarned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-[#5e9bff]/25 bg-[#5e9bff]/10 p-6 font-mono text-[12px]">
              <div className="font-display text-[11px] tracking-[0.3em] text-[#8a9ab5]">KEY FINDINGS SUMMARY</div>
              <ul className="mt-4 space-y-2">
                <li>
                  <span className="text-[#8a9ab5]">Threat Actor:</span> <span className="text-white">{keyFindings.threatActor}</span>
                </li>
                <li>
                  <span className="text-[#8a9ab5]">Initial Access:</span> <span className="text-white">{keyFindings.initialAccess}</span>
                </li>
                <li>
                  <span className="text-[#8a9ab5]">C2 Infrastructure:</span> <span className="text-white">{keyFindings.c2}</span>
                </li>
                <li>
                  <span className="text-[#8a9ab5]">Persistence:</span> <span className="text-white">{keyFindings.persistence}</span>
                </li>
                <li>
                  <span className="text-[#8a9ab5]">Recommended Action:</span> <span className="text-white">{keyFindings.containment}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pb-6">
              <button
                type="button"
                className="rounded border border-white/15 px-6 py-3 font-mono text-[12px] hover:bg-white/5"
                onClick={() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Review Answers
              </button>
              <button
                type="button"
                className="rounded bg-[#5e9bff] px-8 py-3 font-mono text-[12px] font-semibold text-[#060a12] hover:bg-[#7eb6ff]"
                onClick={() => finalize()}
              >
                Submit Report →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
