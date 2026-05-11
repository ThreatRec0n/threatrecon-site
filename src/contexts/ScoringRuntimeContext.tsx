import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { type ScoringEvent, type ScoringEventType, detectSuspiciousBurst } from '../utils/scoringEngine'

export interface ScoringRuntimeContextValue {
  sessionShuffleSeed: number
  scoringEvents: ScoringEvent[]
  addScoringEvent: (type: ScoringEventType, data?: Record<string, unknown>) => void
  suspiciousBurst: boolean
  quizSubmitted: boolean
  markQuizSubmitted: () => void
  resetForCase: () => void
  recordFirstToolOpened: () => void
  getFirstToolOpenedAt: () => number | null
}

const ScoringRuntimeContext = createContext<ScoringRuntimeContextValue | null>(null)

export function ScoringRuntimeProvider({
  caseId,
  children,
}: {
  caseId: string
  children: ReactNode
}) {
  const sessionShuffleSeed = useMemo(() => {
    let h = 0
    const str = `${caseId}:${Date.now()}`
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
    return Math.abs(h)
  }, [caseId])

  const [scoringEvents, setScoringEvents] = useState<ScoringEvent[]>([])
  const seenTypesRef = useRef<Set<ScoringEventType>>(new Set())
  const [suspiciousBurst, setSuspiciousBurst] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const firstToolOpenedAtRef = useRef<number | null>(null)

  const resetForCase = useCallback(() => {
    seenTypesRef.current = new Set()
    setScoringEvents([])
    setSuspiciousBurst(false)
    setQuizSubmitted(false)
    firstToolOpenedAtRef.current = null
  }, [])

  useEffect(() => {
    resetForCase()
  }, [caseId, resetForCase])

  const recordFirstToolOpened = useCallback(() => {
    if (firstToolOpenedAtRef.current !== null) return
    firstToolOpenedAtRef.current = Date.now()
  }, [])

  const getFirstToolOpenedAt = useCallback(() => firstToolOpenedAtRef.current, [])

  const addScoringEvent = useCallback(
    (type: ScoringEventType, data?: Record<string, unknown>) => {
      const ts = Date.now()

      if (type === 'TOOL_OPENED') {
        recordFirstToolOpened()
      }

      if (seenTypesRef.current.has(type)) return
      seenTypesRef.current.add(type)

      setScoringEvents((prev) => {
        const next = [...prev, { type, timestamp: ts, data }]
        if (detectSuspiciousBurst(next)) setSuspiciousBurst(true)
        return next
      })
    },
    [recordFirstToolOpened],
  )

  const markQuizSubmitted = useCallback(() => {
    setQuizSubmitted(true)
  }, [])

  const value = useMemo(
    (): ScoringRuntimeContextValue => ({
      sessionShuffleSeed,
      scoringEvents,
      addScoringEvent,
      suspiciousBurst,
      quizSubmitted,
      markQuizSubmitted,
      resetForCase,
      recordFirstToolOpened,
      getFirstToolOpenedAt,
    }),
    [
      sessionShuffleSeed,
      scoringEvents,
      addScoringEvent,
      suspiciousBurst,
      quizSubmitted,
      markQuizSubmitted,
      resetForCase,
      recordFirstToolOpened,
      getFirstToolOpenedAt,
    ],
  )

  return <ScoringRuntimeContext.Provider value={value}>{children}</ScoringRuntimeContext.Provider>
}

export function useScoringRuntime(): ScoringRuntimeContextValue {
  const ctx = useContext(ScoringRuntimeContext)
  if (!ctx) throw new Error('useScoringRuntime requires ScoringRuntimeProvider')
  return ctx
}
