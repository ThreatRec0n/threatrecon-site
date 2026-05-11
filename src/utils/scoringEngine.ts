export interface ScoringEvent {
  type: ScoringEventType
  timestamp: number
  data?: Record<string, unknown>
}

export type ScoringEventType =
  | 'TOOL_OPENED'
  | 'EVENT_FOUND'
  | 'C2_IDENTIFIED'
  | 'PROCESS_IDENTIFIED'
  | 'PERSIST_FOUND'
  | 'ARTIFACT_CAPTURED'
  | 'C2_BLOCKED'
  | 'HARDENING_COMPLETED'
  | 'FILE_FOUND'
  | 'USER_IDENTIFIED'
  | 'REPORT_SUBMITTED'
  | 'TIMED_OUT'

export interface ScoreBreakdown {
  detection: number
  investigation: number
  response: number
  report: number
  speed: number
  bonus: number
  penalties: number
  total: number
  grade: string
  radarAxes: {
    speed: number
    complete: number
    forensic: number
    harden: number
    report: number
  }
}

/** Pairwise high-value events closer than 100ms triggers fraud heuristic */
export function detectSuspiciousBurst(events: ScoringEvent[]): boolean {
  const HIGH = new Set<ScoringEventType>([
    'EVENT_FOUND',
    'C2_IDENTIFIED',
    'PROCESS_IDENTIFIED',
    'PERSIST_FOUND',
    'ARTIFACT_CAPTURED',
    'C2_BLOCKED',
    'FILE_FOUND',
    'USER_IDENTIFIED',
  ])
  const highs = events.filter((e) => HIGH.has(e.type)).sort((a, b) => a.timestamp - b.timestamp)
  for (let i = 0; i < highs.length; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      if (highs[j]!.timestamp - highs[i]!.timestamp < 100) return true
    }
  }
  return false
}

/** Keeps earliest occurrence per event type (dedupe cheat repeats). */
export function dedupeScoringEventsByType(events: ScoringEvent[]): ScoringEvent[] {
  const seen = new Set<ScoringEventType>()
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const out: ScoringEvent[] = []
  for (const e of sorted) {
    if (seen.has(e.type)) continue
    seen.add(e.type)
    out.push(e)
  }
  return out
}

function gradeFromTotal(t: number): string {
  let grade = 'F-'
  if (t >= 95) grade = 'S+'
  else if (t >= 90) grade = 'S'
  else if (t >= 85) grade = 'A+'
  else if (t >= 80) grade = 'A'
  else if (t >= 75) grade = 'B+'
  else if (t >= 70) grade = 'B'
  else if (t >= 65) grade = 'C+'
  else if (t >= 60) grade = 'C'
  else if (t >= 50) grade = 'D'
  else if (t >= 35) grade = 'F'
  else grade = 'F-'
  return grade
}

export function calculateScore(
  events: ScoringEvent[],
  quizScore: number,
  quizTotal: number,
  timeUsed: number,
  timeLimit: number,
  artifactsFound: number,
  totalArtifacts: number,
  hardeningSteps: number,
  totalHardeningSteps: number,
  suspiciousBurst: boolean,
): ScoreBreakdown {
  const has = (t: ScoringEventType) => events.some((e) => e.type === t)

  let detection = 0
  const hasEventFound = has('EVENT_FOUND')
  const hasC2Identified = has('C2_IDENTIFIED')
  const hasProcessIdentified = has('PROCESS_IDENTIFIED')
  const hasPersistFound = has('PERSIST_FOUND')

  if (hasEventFound) detection += 5
  if (hasC2Identified) detection += 6
  if (hasProcessIdentified) detection += 5
  if (hasPersistFound) detection += 4
  detection = Math.min(20, detection)

  let investigation = 0
  const artifactPts = Math.round((artifactsFound / Math.max(1, totalArtifacts)) * 12)
  const hasFilesFound = has('FILE_FOUND')
  const hasUserIdentified = has('USER_IDENTIFIED')

  investigation += artifactPts
  if (hasFilesFound) investigation += 4
  if (hasUserIdentified) investigation += 4
  investigation = Math.min(20, investigation)

  let response = 0
  const hasC2Blocked = has('C2_BLOCKED')
  const hardeningPct = hardeningSteps / Math.max(1, totalHardeningSteps)

  if (hasC2Blocked) response += 12
  response += Math.round(hardeningPct * 8)
  response = Math.min(20, response)

  const report = Math.round((quizScore / Math.max(1, quizTotal)) * 20)

  let speed = 0
  const pctUsed = timeLimit > 0 ? timeUsed / timeLimit : 1
  if (pctUsed <= 0.4) speed = 10
  else if (pctUsed <= 0.6) speed = 8
  else if (pctUsed <= 0.75) speed = 5
  else if (pctUsed <= 0.9) speed = 2
  else speed = 0

  let bonus = 0
  const allDetected = hasEventFound && hasC2Identified && hasProcessIdentified && hasPersistFound
  const allArtifacts = artifactsFound >= totalArtifacts
  if (allDetected) bonus += 5
  if (allArtifacts) bonus += 5

  let penalties = 0
  const timedOut = has('TIMED_OUT')
  if (timedOut) penalties -= 8

  let total = Math.max(0, Math.min(100, detection + investigation + response + report + speed + bonus + penalties))

  if (suspiciousBurst) total = Math.round(total * 0.5)

  const grade = gradeFromTotal(total)

  const radarAxes = {
    speed: speed / 10,
    complete: artifactsFound / Math.max(1, totalArtifacts),
    forensic: ((hasEventFound ? 1 : 0) + (hasPersistFound ? 1 : 0) + (hasFilesFound ? 1 : 0)) / 3,
    harden: hasC2Blocked ? 0.5 + hardeningPct * 0.5 : hardeningPct * 0.3,
    report: report / 20,
  }

  return {
    detection,
    investigation,
    response,
    report,
    speed,
    bonus,
    penalties,
    total,
    grade,
    radarAxes,
  }
}

export type MissedScoringLine = { eventType: ScoringEventType; message: string }

/** Maximum rubric credit associated with each event type for debrief hints */
export function missedScoringMessages(events: ScoringEvent[]): MissedScoringLine[] {
  const has = (t: ScoringEventType) => events.some((e) => e.type === t)
  const lines: MissedScoringLine[] = []

  if (!has('EVENT_FOUND'))
    lines.push({
      eventType: 'EVENT_FOUND',
      message: '❌ Suspicious Security / PowerShell event (4688 / 4698 / encoded 4104) not reviewed — up to 5 detection points lost',
    })
  if (!has('C2_IDENTIFIED'))
    lines.push({
      eventType: 'C2_IDENTIFIED',
      message: '❌ Malicious or case-linked outbound session not identified in Network Monitor — up to 6 detection points lost',
    })
  if (!has('PROCESS_IDENTIFIED'))
    lines.push({
      eventType: 'PROCESS_IDENTIFIED',
      message: '❌ Malicious staging process not flagged in Process Monitor — up to 5 detection points lost',
    })
  if (!has('PERSIST_FOUND'))
    lines.push({
      eventType: 'PERSIST_FOUND',
      message: '❌ Persistence location not opened in Registry Editor — up to 4 detection points lost',
    })
  if (!has('FILE_FOUND'))
    lines.push({
      eventType: 'FILE_FOUND',
      message: '❌ Roaming staging artifact (msupdate.exe) not observed in File Explorer — up to 4 investigation points lost',
    })
  if (!has('USER_IDENTIFIED'))
    lines.push({
      eventType: 'USER_IDENTIFIED',
      message: '❌ Compromise context account not selected in Local Users — up to 4 investigation points lost',
    })
  if (!has('ARTIFACT_CAPTURED'))
    lines.push({
      eventType: 'ARTIFACT_CAPTURED',
      message: '⚠️ No analyst-tagged IOC in Evidence Locker — up to 12 investigation points lost from artifact coverage',
    })
  if (!has('C2_BLOCKED'))
    lines.push({
      eventType: 'C2_BLOCKED',
      message: '❌ C2 egress not blocked in Firewall Manager — up to 12 response points lost',
    })
  if (!has('HARDENING_COMPLETED'))
    lines.push({
      eventType: 'HARDENING_COMPLETED',
      message: '⚠️ Firewall hardening checklist not engaged — up to 8 response points lost from containment steps',
    })

  return lines
}
