import type { EvidenceItem } from './evidence.types'

export type Difficulty = 'recruit' | 'analyst' | 'threat_hunter' | 'incident_commander'

export interface CaseHistoryEntry {
  caseId: string
  seed: number
  difficulty: Difficulty
  score: number
  grade: string
  completedAt: string
  timeSeconds: number
}

export interface PlayerProfile {
  name: string
  difficulty: Difficulty | null
  casesCompleted: number
  casesAttempted: number
  totalScore: number
  averageScore: number
  bestTime: number | null
  caseHistory: CaseHistoryEntry[]
  attestkCoverage: Record<string, { seen: boolean; detected: boolean }>
  hintsUsed: number
  createdAt: string
}

export interface LeaderboardRow {
  id: string
  name: string
  score: number
  timeSeconds: number
  difficulty: Difficulty
  date: string
}

export const PLAYER_STORAGE_KEY = 'threatrecon_player'
export const LEADERBOARD_KEY = 'threatrecon_leaderboard'

export type StoredEvidenceSnapshot = EvidenceItem[]
