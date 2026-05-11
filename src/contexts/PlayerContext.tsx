import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Difficulty, LeaderboardRow, PlayerProfile } from '../types/player.types'
import { LEADERBOARD_KEY, PLAYER_STORAGE_KEY } from '../types/player.types'

const defaultProfile = (): PlayerProfile => ({
  name: '',
  difficulty: null,
  casesCompleted: 0,
  casesAttempted: 0,
  totalScore: 0,
  averageScore: 0,
  bestTime: null,
  caseHistory: [],
  attestkCoverage: {},
  hintsUsed: 0,
  createdAt: new Date().toISOString(),
})

function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    if (!raw) return defaultProfile()
    return { ...defaultProfile(), ...JSON.parse(raw) } as PlayerProfile
  } catch {
    return defaultProfile()
  }
}

function saveProfile(p: PlayerProfile): void {
  localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(p))
}

export interface PlayerContextValue {
  profile: PlayerProfile
  setName: (name: string) => void
  setDifficulty: (d: Difficulty) => void
  recordCaseAttempt: () => void
  completeCase: (payload: {
    caseId: string
    seed: number
    difficulty: Difficulty
    score: number
    grade: string
    timeSeconds: number
  }) => void
  leaderboard: LeaderboardRow[]
  pushLeaderboard: (row: LeaderboardRow) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile())
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>(() => {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY)
      return raw ? (JSON.parse(raw) as LeaderboardRow[]) : []
    } catch {
      return []
    }
  })

  const setName = useCallback((name: string) => {
    setProfile((prev) => {
      const next = { ...prev, name }
      saveProfile(next)
      return next
    })
  }, [])

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setProfile((prev) => {
      const next = { ...prev, difficulty }
      saveProfile(next)
      return next
    })
  }, [])

  const recordCaseAttempt = useCallback(() => {
    setProfile((prev) => {
      const next = { ...prev, casesAttempted: prev.casesAttempted + 1 }
      saveProfile(next)
      return next
    })
  }, [])

  const completeCase = useCallback(
    (payload: {
      caseId: string
      seed: number
      difficulty: Difficulty
      score: number
      grade: string
      timeSeconds: number
    }) => {
      setProfile((prev) => {
        const nextHistory = [
          ...prev.caseHistory,
          {
            caseId: payload.caseId,
            seed: payload.seed,
            difficulty: payload.difficulty,
            score: payload.score,
            grade: payload.grade,
            completedAt: new Date().toISOString(),
            timeSeconds: payload.timeSeconds,
          },
        ]
        const completed = prev.casesCompleted + 1
        const totalScore = prev.totalScore + payload.score
        const averageScore = totalScore / Math.max(1, completed)
        const bestTime =
          prev.bestTime === null ? payload.timeSeconds : Math.min(prev.bestTime, payload.timeSeconds)
        const next = {
          ...prev,
          casesCompleted: completed,
          caseHistory: nextHistory,
          totalScore,
          averageScore,
          bestTime,
        }
        saveProfile(next)
        return next
      })
    },
    [],
  )

  const pushLeaderboard = useCallback(
    (row: LeaderboardRow) => {
      const next = [...leaderboard, row]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      setLeaderboard(next)
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next))
    },
    [leaderboard],
  )

  const value = useMemo<PlayerContextValue>(
    () => ({
      profile,
      setName,
      setDifficulty,
      recordCaseAttempt,
      completeCase,
      leaderboard,
      pushLeaderboard,
    }),
    [profile, setName, setDifficulty, recordCaseAttempt, completeCase, leaderboard, pushLeaderboard],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer requires PlayerProvider')
  return ctx
}
