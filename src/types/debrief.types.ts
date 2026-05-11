import type { Difficulty } from './player.types'
import type { ScoreBreakdown, ScoringEvent } from '../utils/scoringEngine'

/** Legacy radar dimensions (0–100) for certificate/chart compatibility */
export interface DebriefRadarDimensions {
  speed: number
  completeness: number
  forensicIntegrity: number
  hardening: number
  reportQuality: number
}

export interface DebriefPayload {
  verificationId: string
  completionTimestamp: string
  caseId: string
  caseCode?: string
  seed: number
  difficulty: Difficulty
  score: number
  grade: string
  breakdown: DebriefRadarDimensions
  /** Present for quiz-era completions */
  scoreBreakdown?: ScoreBreakdown
  quizScore?: number
  quizTotal?: number
  suspiciousBurst?: boolean
  whatYouMissed?: string[]
  achievements?: string[]
  scoringEvents?: ScoringEvent[]
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
