import type { CaseDefinition } from '../types/case.types'
import type { IncidentReport } from '../types/report.types'

export interface DimensionScores {
  speed: number
  completeness: number
  forensicIntegrity: number
  hardening: number
  reportQuality: number
}

export function computeFinalScore(input: {
  timeUsedSec: number
  timerTotalSec: number
  artifactsFound: number
  artifactsTotal: number
  forensicIntegrity: number
  hardeningPct: number
  reportAvg: number
}): { total: number; grade: string; breakdown: DimensionScores } {
  const speed =
    Math.max(0, 100 - (input.timeUsedSec / Math.max(1, input.timerTotalSec)) * 100 + 20)
  const completeness = (input.artifactsFound / Math.max(1, input.artifactsTotal)) * 100
  const forensicIntegrity = Math.max(0, Math.min(100, input.forensicIntegrity))
  const hardening = Math.max(0, Math.min(100, input.hardeningPct))
  const reportQuality = Math.max(0, Math.min(100, input.reportAvg))

  const total =
    speed * 0.2 +
    completeness * 0.25 +
    forensicIntegrity * 0.2 +
    hardening * 0.15 +
    reportQuality * 0.2

  const t = Math.round(total)
  let grade = 'F'
  if (t >= 95) grade = 'S'
  else if (t >= 85) grade = 'A'
  else if (t >= 75) grade = 'B'
  else if (t >= 65) grade = 'C'
  else if (t >= 50) grade = 'D'

  return {
    total: t,
    grade,
    breakdown: { speed, completeness, forensicIntegrity, hardening, reportQuality },
  }
}

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
