import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useGame } from '../../contexts/GameContext'
import { useEvidence } from '../../contexts/EvidenceContext'
import { usePlayer } from '../../contexts/PlayerContext'
import type { IncidentReport, TimelineRow } from '../../types/report.types'
import { computeOperativeScore, countableTaggedIocItems } from '../../engine/ScoringEngine'
import type { Difficulty } from '../../types/player.types'
import { verificationHash } from '../../utils/hashUtils'

export interface DebriefPayload {
  verificationId: string
  completionTimestamp: string
  caseId: string
  seed: number
  difficulty: Difficulty
  score: number
  grade: string
  breakdown: {
    speed: number
    completeness: number
    forensicIntegrity: number
    hardening: number
    reportQuality: number
  }
  timeUsedSec: number
  timerTotalSec: number
  actorName: string
  industryName: string
  entryTechnique: string
  mitre: string[]
  playerName: string
  artifactsFound: string[]
  artifactsTotal: number
  forensicViolations: { kind: string; target: string; note: string }[]
}

const REGULATIONS: Record<string, { name: string; deadline: string; authority: string }> = {
  healthcare: { name: 'HIPAA', deadline: '60 days', authority: 'HHS OCR' },
  financial: { name: 'PCI-DSS', deadline: '72 hours', authority: 'Card Brands' },
  defense: { name: 'CMMC/DIBCAC', deadline: '72 hours', authority: 'DIBCAC' },
  government: { name: 'FISMA', deadline: '1 hour (US-CERT)', authority: 'CISA' },
  retail: { name: 'PCI-DSS', deadline: '72 hours', authority: 'Card Brands' },
  university: { name: 'FERPA + state law', deadline: 'varies', authority: 'State AG' },
  manufacturing: { name: 'State data breach law', deadline: 'varies', authority: 'State AG' },
  lawfirm: { name: 'State bar + state law', deadline: 'varies', authority: 'State Bar' },
}

const emptyReport = (): IncidentReport => ({
  executiveSummary: '',
  timeline: [],
  attackVectorCategory: '',
  attackVectorDetail: '',
  firstEvidenceTimestamp: '',
  iocs: { ips: '', domains: '', hashes: '', paths: '', registry: '', processes: '', accounts: '', tasks: '', cves: '' },
  blastRadius: { systems: '', dataTypes: '', dataExfil: 'Unknown', exfilDetails: '', businessImpact: '' },
  actions: { eradication: '', hardening: '', evidence: '' },
  regulatory: { requires: 'Undetermined', framework: '', deadline: '', dataTypes: '', individuals: '', draft: '' },
  recommendations: { short: '', medium: '', long: '' },
})

function computeReportErrors(report: IncidentReport): Record<string, string> {
  const errs: Record<string, string> = {}
  if (!report.executiveSummary.trim()) errs.executiveSummary = 'Executive summary required.'
  if (!report.attackVectorCategory) errs.attackVectorCategory = 'Select an attack vector.'
  if (report.timeline.length === 0) errs.timeline = 'Add at least one timeline entry.'
  if (!report.iocs.paths.trim() && !report.iocs.hashes.trim()) errs.iocs = 'List file paths or hashes from evidence.'
  if (!report.blastRadius.dataTypes.trim()) errs.blast = 'Describe data types accessed.'
  if (!report.actions.eradication.trim()) errs.actions = 'Document eradication steps performed.'
  if (!report.recommendations.short.trim()) errs.recs = 'Provide at least short-term recommendations.'
  return errs
}

export function ReportEditor({
  onClose,
  hardeningPct,
  forceSubmit = false,
}: {
  onClose: () => void
  hardeningPct: number
  forceSubmit?: boolean
}) {
  const navigate = useNavigate()
  const { caseDef, forensic, timerTotal, timerRemaining, difficulty, resetCase, hardeningDone, getOperativeJournalSnapshot } =
    useGame()
  const { items } = useEvidence()
  const { profile, completeCase, pushLeaderboard } = usePlayer()
  const [report, setReport] = useState<IncidentReport>(() => buildInitialReport(caseDef, items))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const timeUsedSec = useMemo(() => {
    if (!caseDef) return 0
    return Math.max(0, timerTotal - timerRemaining)
  }, [caseDef, timerTotal, timerRemaining])

  /* Pre-fill regulatory section once caseDef is known */
  useEffect(() => {
    if (!caseDef) return
    const reg = matchRegulation(caseDef.industry.id, caseDef.industry.compliance)
    setReport((r) => ({
      ...r,
      regulatory: {
        ...r.regulatory,
        framework: r.regulatory.framework || reg.name,
        deadline: r.regulatory.deadline || reg.deadline,
      },
      iocs: {
        ...r.iocs,
        paths: r.iocs.paths || items.filter((i) => i.path).map((i) => i.path).join('\n'),
        hashes: r.iocs.hashes || items.filter((i) => i.hash).map((i) => i.hash).join('\n'),
        ips: r.iocs.ips || (caseDef.c2Ip ?? ''),
      },
    }))
  }, [caseDef, items])

  /* Auto-submit on time-up */
  useEffect(() => {
    if (!forceSubmit || !caseDef || !difficulty) return
    submit(true)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [forceSubmit])

  if (!caseDef || !difficulty) return null

  const submit = (forced = false) => {
    const fieldErrors = computeReportErrors(report)
    const validationPassed = Object.keys(fieldErrors).length === 0

    if (!forced && !validationPassed) {
      setErrors(fieldErrors)
      return
    }
    if (forced && !validationPassed) setErrors(fieldErrors)

    const journal = getOperativeJournalSnapshot()
    const taggedIocCount = countableTaggedIocItems(items)
    const hardeningDoneCount = Object.values(hardeningDone).filter(Boolean).length

    const { total, grade, breakdown } = computeOperativeScore({
      journal,
      taggedIocCount,
      hardeningDoneCount,
      reportComplete: validationPassed,
      forcedIncompleteSubmit: forced && !validationPassed,
      timeUsedSec,
      timerTotalSec: timerTotal,
    })

    const artifactsTotal = Math.max(1, caseDef.artifacts.length)

    const completionTimestamp = new Date().toISOString()
    const verificationId = verificationHash([
      caseDef.caseId,
      profile.name,
      String(total),
      completionTimestamp,
    ])

    completeCase({
      caseId: caseDef.caseId,
      seed: caseDef.seed,
      difficulty,
      score: total,
      grade,
      timeSeconds: timeUsedSec,
    })

    pushLeaderboard({
      id: verificationId.slice(0, 16),
      name: profile.name,
      score: total,
      timeSeconds: timeUsedSec,
      difficulty,
      date: new Date().toISOString(),
    })

    const payload: DebriefPayload = {
      verificationId,
      completionTimestamp,
      caseId: caseDef.caseId,
      seed: caseDef.seed,
      difficulty,
      score: total,
      grade,
      breakdown,
      timeUsedSec,
      timerTotalSec: timerTotal,
      actorName: caseDef.threatActor.displayName,
      industryName: caseDef.industry.companyName,
      entryTechnique: caseDef.entryVector.name,
      mitre: caseDef.attackChain.map((t) => t.id),
      playerName: profile.name,
      artifactsFound: items.map((i) => i.title),
      artifactsTotal,
      forensicViolations: forensic.getViolations().map((v) => ({ kind: v.kind, target: v.target, note: v.note })),
    }

    localStorage.setItem(`tr_verify_${verificationId}`, JSON.stringify(payload))

    /* Update MITRE coverage in localStorage */
    try {
      const raw = localStorage.getItem('threatrecon_mitre_coverage')
      const cov: Record<string, 'detected' | 'missed'> = raw ? JSON.parse(raw) : {}
      const foundMitre = new Set<string>()
      items.forEach((i) => i.mitre?.forEach((m) => foundMitre.add(m)))
      caseDef.attackChain.forEach((t) => {
        cov[t.id] = foundMitre.has(t.id) ? 'detected' : cov[t.id] === 'detected' ? 'detected' : 'missed'
      })
      localStorage.setItem('threatrecon_mitre_coverage', JSON.stringify(cov))
    } catch {
      /* swallow — coverage is best-effort */
    }

    resetCase()
    navigate('/debrief', { state: payload })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-6 backdrop-blur">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1824] shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="font-display text-lg tracking-wide text-[#e8edf5]">INCIDENT REPORT</div>
            <div className="font-mono text-[11px] text-[#8a9ab5]">
              TR-{caseDef.caseNumber} · {caseDef.industry.companyName} · Analyst: {profile.name}
            </div>
          </div>
          <button type="button" className="rounded border border-white/10 px-3 py-1 text-[11px]" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 font-mono text-[12px] text-[#e8edf5]">
          <Section title="SECTION 1 — EXECUTIVE SUMMARY" error={errors.executiveSummary}>
            <CharCounter value={report.executiveSummary} max={1000} />
            <textarea
              className="mt-2 min-h-[140px] w-full rounded border border-white/10 bg-black/30 p-3"
              value={report.executiveSummary}
              maxLength={1000}
              onChange={(e) => setReport({ ...report, executiveSummary: e.target.value })}
              placeholder="Plain-language summary for non-technical leadership."
            />
          </Section>

          <Section title="SECTION 2 — INCIDENT TIMELINE" error={errors.timeline}>
            <Timeline
              rows={report.timeline}
              setRows={(rows) => setReport({ ...report, timeline: rows })}
              evidenceTitles={items.map((i) => i.title)}
            />
          </Section>

          <Section title="SECTION 3 — ATTACK VECTOR" error={errors.attackVectorCategory}>
            <select
              className="mt-2 w-full rounded border border-white/10 bg-black/30 p-2"
              value={report.attackVectorCategory}
              onChange={(e) =>
                setReport({ ...report, attackVectorCategory: e.target.value as IncidentReport['attackVectorCategory'] })
              }
            >
              <option value="">Select…</option>
              <option value="Phishing">Phishing</option>
              <option value="Exploit">Exploit</option>
              <option value="Valid Accounts">Valid Accounts</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="External Service">External Service</option>
            </select>
            <textarea
              className="mt-2 min-h-[80px] w-full rounded border border-white/10 bg-black/30 p-3"
              value={report.attackVectorDetail}
              onChange={(e) => setReport({ ...report, attackVectorDetail: e.target.value })}
              placeholder="Specific technique and chain: how the attacker initially gained access."
            />
          </Section>

          <Section title="SECTION 4 — INDICATORS OF COMPROMISE" error={errors.iocs}>
            <div className="grid gap-3 md:grid-cols-2">
              <IocField
                label="File paths"
                value={report.iocs.paths}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, paths: v } })}
              />
              <IocField
                label="SHA256 hashes"
                value={report.iocs.hashes}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, hashes: v } })}
              />
              <IocField
                label="IP addresses"
                value={report.iocs.ips}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, ips: v } })}
              />
              <IocField
                label="Domains"
                value={report.iocs.domains}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, domains: v } })}
              />
              <IocField
                label="Registry keys"
                value={report.iocs.registry}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, registry: v } })}
              />
              <IocField
                label="Processes"
                value={report.iocs.processes}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, processes: v } })}
              />
              <IocField
                label="User accounts"
                value={report.iocs.accounts}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, accounts: v } })}
              />
              <IocField
                label="Scheduled tasks"
                value={report.iocs.tasks}
                onChange={(v) => setReport({ ...report, iocs: { ...report.iocs, tasks: v } })}
              />
            </div>
          </Section>

          <Section title="SECTION 5 — BLAST RADIUS & IMPACT" error={errors.blast}>
            <textarea
              className="mt-2 min-h-[80px] w-full rounded border border-white/10 bg-black/30 p-3"
              value={report.blastRadius.systems}
              onChange={(e) => setReport({ ...report, blastRadius: { ...report.blastRadius, systems: e.target.value } })}
              placeholder="Affected systems / hosts / accounts."
            />
            <textarea
              className="mt-2 min-h-[80px] w-full rounded border border-white/10 bg-black/30 p-3"
              value={report.blastRadius.dataTypes}
              onChange={(e) => setReport({ ...report, blastRadius: { ...report.blastRadius, dataTypes: e.target.value } })}
              placeholder="Data types potentially accessed (PHI, PII, financial, IP)."
            />
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <select
                className="rounded border border-white/10 bg-black/30 p-2"
                value={report.blastRadius.dataExfil}
                onChange={(e) =>
                  setReport({
                    ...report,
                    blastRadius: { ...report.blastRadius, dataExfil: e.target.value as 'Yes' | 'No' | 'Unknown' },
                  })
                }
              >
                <option value="Unknown">Exfiltration: Unknown</option>
                <option value="Yes">Exfiltration: Yes</option>
                <option value="No">Exfiltration: No</option>
              </select>
              <input
                className="rounded border border-white/10 bg-black/30 p-2 font-mono text-[11px]"
                value={report.blastRadius.exfilDetails}
                onChange={(e) =>
                  setReport({ ...report, blastRadius: { ...report.blastRadius, exfilDetails: e.target.value } })
                }
                placeholder="Bytes exfiltrated / channel"
              />
            </div>
            <textarea
              className="mt-2 min-h-[60px] w-full rounded border border-white/10 bg-black/30 p-3"
              value={report.blastRadius.businessImpact}
              onChange={(e) =>
                setReport({ ...report, blastRadius: { ...report.blastRadius, businessImpact: e.target.value } })
              }
              placeholder="Business impact (downtime, revenue, reputation)."
            />
          </Section>

          <Section title="SECTION 6 — ACTIONS TAKEN" error={errors.actions}>
            <FieldArea
              label="Eradication"
              value={report.actions.eradication}
              onChange={(v) => setReport({ ...report, actions: { ...report.actions, eradication: v } })}
              placeholder="What was removed, in what order. Reference forensic preservation steps."
            />
            <FieldArea
              label="Hardening"
              value={report.actions.hardening}
              onChange={(v) => setReport({ ...report, actions: { ...report.actions, hardening: v } })}
              placeholder="What controls were added or strengthened."
            />
            <FieldArea
              label="Evidence preservation"
              value={report.actions.evidence}
              onChange={(v) => setReport({ ...report, actions: { ...report.actions, evidence: v } })}
              placeholder="Hashes captured, registry exports, memory dumps, etc."
            />
          </Section>

          <Section title="SECTION 7 — REGULATORY NOTIFICATION">
            <select
              className="mt-2 w-full rounded border border-white/10 bg-black/30 p-2"
              value={report.regulatory.requires}
              onChange={(e) =>
                setReport({
                  ...report,
                  regulatory: { ...report.regulatory, requires: e.target.value as IncidentReport['regulatory']['requires'] },
                })
              }
            >
              <option value="Undetermined">Undetermined</option>
              <option value="Yes">Yes — notification required</option>
              <option value="No">No</option>
            </select>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              <input
                className="rounded border border-white/10 bg-black/30 p-2 font-mono text-[11px]"
                value={report.regulatory.framework}
                onChange={(e) =>
                  setReport({ ...report, regulatory: { ...report.regulatory, framework: e.target.value } })
                }
                placeholder="Framework"
              />
              <input
                className="rounded border border-white/10 bg-black/30 p-2 font-mono text-[11px]"
                value={report.regulatory.deadline}
                onChange={(e) =>
                  setReport({ ...report, regulatory: { ...report.regulatory, deadline: e.target.value } })
                }
                placeholder="Deadline"
              />
              <input
                className="rounded border border-white/10 bg-black/30 p-2 font-mono text-[11px]"
                value={report.regulatory.individuals}
                onChange={(e) =>
                  setReport({ ...report, regulatory: { ...report.regulatory, individuals: e.target.value } })
                }
                placeholder="# affected"
              />
            </div>
            <textarea
              className="mt-2 min-h-[80px] w-full rounded border border-white/10 bg-black/30 p-3"
              value={report.regulatory.draft}
              onChange={(e) => setReport({ ...report, regulatory: { ...report.regulatory, draft: e.target.value } })}
              placeholder="Draft notification text."
            />
          </Section>

          <Section title="SECTION 8 — RECOMMENDATIONS" error={errors.recs}>
            <FieldArea
              label="Short-term (next 24-72h)"
              value={report.recommendations.short}
              onChange={(v) => setReport({ ...report, recommendations: { ...report.recommendations, short: v } })}
            />
            <FieldArea
              label="Medium-term (30-90 days)"
              value={report.recommendations.medium}
              onChange={(v) => setReport({ ...report, recommendations: { ...report.recommendations, medium: v } })}
            />
            <FieldArea
              label="Long-term (strategic)"
              value={report.recommendations.long}
              onChange={(v) => setReport({ ...report, recommendations: { ...report.recommendations, long: v } })}
            />
          </Section>
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <div className="text-[11px] text-[#8a9ab5]">
            Scorable IOC tags (SIEM auto-capture excluded):{' '}
            <span className="text-[#5e9bff]">{countableTaggedIocItems(items)}</span> · Forensic integrity{' '}
            <span className="text-[#5e9bff]">{forensic.snapshot()}</span>/100 · Hardening{' '}
            <span className="text-[#5e9bff]">{Math.round(hardeningPct)}%</span> · Evidence items captured{' '}
            <span className="text-[#5e9bff]">{items.length}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" className="rounded border border-white/10 px-4 py-2 text-[12px]" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-[#5e9bff] px-6 py-2 font-mono text-[12px] font-bold text-[#060a12] hover:brightness-110"
              onClick={() => submit(false)}
            >
              SUBMIT REPORT
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function buildInitialReport(caseDef: ReturnType<typeof useGame>['caseDef'], items: ReturnType<typeof useEvidence>['items']): IncidentReport {
  const r = emptyReport()
  if (caseDef) {
    const reg = matchRegulation(caseDef.industry.id, caseDef.industry.compliance)
    r.regulatory.framework = reg.name
    r.regulatory.deadline = reg.deadline
    r.iocs.paths = items.filter((i) => i.path).map((i) => i.path).join('\n')
    r.iocs.hashes = items.filter((i) => i.hash).map((i) => i.hash).join('\n')
    if (caseDef.c2Ip) r.iocs.ips = caseDef.c2Ip
  }
  return r
}

function matchRegulation(industryId: string, compliance: string[]): { name: string; deadline: string; authority: string } {
  const lower = industryId.toLowerCase()
  if (REGULATIONS[lower]) return REGULATIONS[lower]!
  const fromCompliance = compliance.find((c) => /HIPAA|PCI|GDPR|FERPA|FISMA|CMMC|SOX/i.test(c))
  if (fromCompliance) return { name: fromCompliance, deadline: 'Per framework', authority: 'Applicable regulator' }
  return { name: 'Per organizational policy', deadline: 'Per policy', authority: 'Internal' }
}

function Section({ title, children, error }: { title: string; children: ReactNode; error?: string }) {
  return (
    <section className="mb-8 border-b border-white/5 pb-6">
      <div className="flex items-center justify-between">
        <div className="font-display text-sm tracking-[0.25em] text-[#8a9ab5]">{title}</div>
        {error ? <div className="font-mono text-[10px] text-red-400">{error}</div> : null}
      </div>
      {children}
    </section>
  )
}

function CharCounter({ value, max }: { value: string; max: number }) {
  return (
    <div className="text-right text-[10px] text-[#4a566b]">
      {value.length}/{max}
    </div>
  )
}

function FieldArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider text-[#8a9ab5]">{label}</div>
      <textarea
        className="mt-1 min-h-[70px] w-full rounded border border-white/10 bg-black/30 p-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function IocField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#8a9ab5]">{label}</div>
      <textarea
        className="mt-1 min-h-[80px] w-full rounded border border-white/10 bg-black/30 p-2 font-mono text-[10px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function Timeline({
  rows,
  setRows,
  evidenceTitles,
}: {
  rows: TimelineRow[]
  setRows: (rows: TimelineRow[]) => void
  evidenceTitles: string[]
}) {
  const addRow = () => {
    setRows([
      ...rows,
      { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, datetime: '', description: '', evidenceRef: '' },
    ])
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setRows(arrayMove(rows, oldIndex, newIndex))
  }

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] text-[#8a9ab5]">Drag to order events chronologically.</div>
        <button
          type="button"
          className="rounded border border-white/10 px-3 py-1 text-[11px] hover:bg-white/5"
          onClick={addRow}
        >
          + Add event
        </button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {rows.map((row) => (
              <TimelineItem
                key={row.id}
                row={row}
                evidenceTitles={evidenceTitles}
                onChange={(updated) => setRows(rows.map((r) => (r.id === row.id ? updated : r)))}
                onRemove={() => setRows(rows.filter((r) => r.id !== row.id))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {rows.length === 0 ? (
        <div className="rounded border border-dashed border-white/10 p-4 text-center text-[11px] text-[#4a566b]">
          No timeline entries yet. Click + Add event to begin.
        </div>
      ) : null}
    </div>
  )
}

function TimelineItem({
  row,
  evidenceTitles,
  onChange,
  onRemove,
}: {
  row: TimelineRow
  evidenceTitles: string[]
  onChange: (r: TimelineRow) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex gap-2 rounded border border-white/10 bg-black/20 p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab self-stretch px-1 text-[#5e9bff]"
        title="Drag to reorder"
      >
        ≡
      </button>
      <div className="flex flex-1 flex-col gap-2 md:flex-row">
        <input
          type="datetime-local"
          className="rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
          value={row.datetime}
          onChange={(e) => onChange({ ...row, datetime: e.target.value })}
        />
        <input
          className="flex-1 rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
          value={row.description}
          onChange={(e) => onChange({ ...row, description: e.target.value })}
          placeholder="What happened"
        />
        <select
          className="rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px]"
          value={row.evidenceRef ?? ''}
          onChange={(e) => onChange({ ...row, evidenceRef: e.target.value })}
        >
          <option value="">Evidence…</option>
          {evidenceTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="rounded px-2 text-[11px] text-red-300 hover:bg-red-500/10" onClick={onRemove}>
        ✕
      </button>
    </li>
  )
}
