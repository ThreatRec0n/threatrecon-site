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
import { useGame } from './GameContext'

export type TimelineSeverity = 'red' | 'yellow' | 'green'

export interface TimelineEntry {
  id: string
  at: string
  eventType: string
  description: string
  severity: TimelineSeverity
}

interface TimelineContextValue {
  entries: TimelineEntry[]
  append: (e: Omit<TimelineEntry, 'id' | 'at'> & { id?: string; at?: string }) => void
  clear: () => void
}

const TimelineContext = createContext<TimelineContextValue | null>(null)

export function TimelineProvider({ children }: { children: ReactNode }) {
  const { caseDef } = useGame()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const caseIdRef = useRef<string | null>(null)

  useEffect(() => {
    const id = caseDef?.caseId ?? null
    if (id !== caseIdRef.current) {
      caseIdRef.current = id
      setEntries([])
    }
  }, [caseDef?.caseId])

  const append = useCallback((e: Omit<TimelineEntry, 'id' | 'at'> & { id?: string; at?: string }) => {
    const row: TimelineEntry = {
      id: e.id ?? `tl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      at: e.at ?? new Date().toISOString(),
      eventType: e.eventType,
      description: e.description,
      severity: e.severity,
    }
    setEntries((prev) => [...prev, row].sort((a, b) => a.at.localeCompare(b.at)))
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  const value = useMemo(() => ({ entries, append, clear }), [entries, append, clear])

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>
}

export function useTimeline(): TimelineContextValue {
  const ctx = useContext(TimelineContext)
  if (!ctx) throw new Error('useTimeline requires TimelineProvider')
  return ctx
}
