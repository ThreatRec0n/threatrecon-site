import type { CaseDefinition } from '../types/case.types'
import type { IncidentReport } from '../types/report.types'
import type { OperativeJournalSnapshot } from './OperativeJournal.types'

export interface DimensionScores {
  speed: number
  completeness: number
  forensicIntegrity: number
  hardening: number
  reportQuality: number
}

/** IOC tags that count toward investigation scoring (opening SIEM auto-capture excluded). */
export function countableTaggedIocItems(items: { taggedIoc?: boolean; notes?: string }[]): number {
  return items.filter((i) => i.taggedIoc && !i.notes?.includes('Auto-captured opening alert')).length
}

export interface OperativeScoreInput {
  journal: OperativeJournalSnapshot
  taggedIocCount: number
  hardeningDoneCount: number
  reportComplete: boolean
  forcedIncompleteSubmit: boolean
  timeUsedSec: number
  timerTotalSec: number
}

/**
 * ThreatRecon OPERATIVE rubric — max 100 points before penalties.
 * Speed bonus only applies when the analyst earned substantive detection/investigation/response points.
 */
export function computeOperativeScore(input: OperativeScoreInput): {
  total: number
  grade: string
  breakdown: DimensionScores
  rawSubtotal: number
  speedBonus: number
} {
  const j = input.journal

  let detection = 0
  if (j.detectionMalicious4688Or4698) detection += 8
  if (j.detectionNetworkC2) detection += 7
  if (j.detectionMaliciousProcess) detection += 5
  if (j.detectionRegistryRunPersist) detection += 5
  detection = Math.min(detection, 25)

  let investigation = Math.min(15, Math.min(3, Math.max(0, input.taggedIocCount)) * 5)
  if (j.investigationMsupdateExplorer) investigation += 5
  if (j.investigationCompromisedUser) investigation += 5
  investigation = Math.min(investigation, 25)

  let response = 0
  if (j.firewallBlockedC2) response += 10
  if (input.hardeningDoneCount >= 1) response += 5
  if (input.reportComplete) response += 10
  response = Math.min(response, 25)

  const substantive = detection + investigation + response

  let speedBonus = 0
  if (substantive > 0 && input.timerTotalSec > 0) {
    const ratio = input.timeUsedSec / input.timerTotalSec
    if (ratio <= 0.5) speedBonus = 15
    else if (ratio <= 0.7) speedBonus = 10
    else if (ratio <= 0.9) speedBonus = 5
    else speedBonus = 0
  }

  let total = substantive + speedBonus
  if (input.forcedIncompleteSubmit) total -= 10
  if (input.forcedIncompleteSubmit && !input.reportComplete) total -= 5
  total = Math.max(0, Math.min(100, Math.round(total)))

  const grade = gradeFromTotal(total)

  const evtPts = j.detectionMalicious4688Or4698 ? 8 : 0
  const regPts = j.detectionRegistryRunPersist ? 5 : 0
  const filePts = j.investigationMsupdateExplorer ? 5 : 0
  const forensicMax = 18
  const forensicIntegrity = forensicMax > 0 ? Math.round(((evtPts + regPts + filePts) / forensicMax) * 100) : 0

  const completeAxis = Math.round((Math.min(3, Math.max(0, input.taggedIocCount)) / 3) * 100)

  const hardenEarned = (j.firewallBlockedC2 ? 10 : 0) + (input.hardeningDoneCount >= 1 ? 5 : 0)
  const hardening = Math.round((hardenEarned / 15) * 100)

  const reportQuality = input.reportComplete ? 100 : 0

  const speedAxis = Math.round((speedBonus / 15) * 100)

  return {
    total,
    grade,
    breakdown: {
      speed: speedAxis,
      completeness: completeAxis,
      forensicIntegrity,
      hardening,
      reportQuality,
    },
    rawSubtotal: substantive + speedBonus,
    speedBonus,
  }
}

export function gradeFromTotal(t: number): string {
  if (t >= 90) return 'S'
  if (t >= 80) return 'A'
  if (t >= 70) return 'B'
  if (t >= 55) return 'C'
  if (t >= 40) return 'D'
  if (t >= 25) return 'F'
  return 'F-'
}

/** Legacy helper — section grades for reference UI only (not summed into final OPERATIVE score). */
export function scoreReportSections(
  report: IncidentReport,
  caseDef: CaseDefinition,
): { average: number; sections: { name: string; score: number }[] } {
  const sections: { name: string; score: number }[] = []

  const exec = report.executiveSummary.trim().length > 80 ? 82 : 40
  sections.push({ name: 'Executive Summary', score: exec })

  const tl = report.timeline.length >= 2 ? 78 : 35
  sections.push({ name: 'Timeline', score: tl })

  const vec =
    report.attackVectorCategory &&
    report.attackVectorDetail.toLowerCase().includes(caseDef.entryVector.id.toLowerCase())
      ? 95
      : 55
  sections.push({ name: 'Attack Vector', score: vec })

  const ioc = report.iocs.hashes.split('\n').filter(Boolean).length >= 1 ? 80 : 45
  sections.push({ name: 'IOCs', score: ioc })

  const blast = report.blastRadius.dataTypes.trim().length > 20 ? 75 : 40
  sections.push({ name: 'Blast Radius', score: blast })

  const act = report.actions.eradication.trim().length > 10 ? 72 : 40
  sections.push({ name: 'Actions Taken', score: act })

  const reg =
    report.regulatory.requires === 'Undetermined'
      ? 60
      : report.regulatory.framework.includes(industryFramework(caseDef))
        ? 88
        : 62
  sections.push({ name: 'Regulatory', score: reg })

  const rec =
    report.recommendations.short.length > 40 &&
    report.recommendations.medium.length > 40 &&
    report.recommendations.long.length > 40
      ? 85
      : 50
  sections.push({ name: 'Recommendations', score: rec })

  const average = sections.reduce((a, s) => a + s.score, 0) / sections.length
  return { average, sections }
}

function industryFramework(caseDef: CaseDefinition): string {
  const c = caseDef.industry.compliance.join(' ')
  if (c.includes('HIPAA')) return 'HIPAA'
  if (c.includes('PCI')) return 'PCI-DSS'
  if (c.includes('CMMC')) return 'CMMC'
  if (c.includes('FERPA')) return 'FERPA'
  return 'PCI-DSS'
}
