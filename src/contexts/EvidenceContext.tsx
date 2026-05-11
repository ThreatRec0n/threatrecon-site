import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { EvidenceItem, EvidenceType } from '../types/evidence.types'
import { v4 as uuidv4 } from 'uuid'

export interface EvidenceContextValue {
  items: EvidenceItem[]
  addEvidence: (input: Omit<EvidenceItem, 'id'> & { id?: string }) => void
  removeEvidence: (id: string) => void
  tagIoc: (id: string, tagged: boolean) => void
  updateNotes: (id: string, notes: string) => void
  reset: () => void
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null)

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EvidenceItem[]>([])

  const addEvidence = useCallback((input: Omit<EvidenceItem, 'id'> & { id?: string }) => {
    const item: EvidenceItem = { ...input, id: input.id ?? uuidv4() }
    setItems((prev) => [...prev.filter((p) => p.path !== item.path || p.title !== item.title), item])
  }, [])

  const removeEvidence = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const tagIoc = useCallback((id: string, tagged: boolean) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, taggedIoc: tagged } : p)))
  }, [])

  const updateNotes = useCallback((id: string, notes: string) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)))
  }, [])

  const reset = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({ items, addEvidence, removeEvidence, tagIoc, updateNotes, reset }),
    [items, addEvidence, removeEvidence, tagIoc, updateNotes, reset],
  )

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>
}

export function useEvidence(): EvidenceContextValue {
  const ctx = useContext(EvidenceContext)
  if (!ctx) throw new Error('useEvidence requires EvidenceProvider')
  return ctx
}

export function badgeColor(t: EvidenceType): string {
  switch (t) {
    case 'FILE':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
    case 'REGISTRY':
      return 'bg-yellow-500/15 text-yellow-200 border-yellow-500/40'
    case 'PROCESS':
      return 'bg-orange-500/15 text-orange-200 border-orange-500/40'
    case 'NETWORK':
      return 'bg-blue-500/15 text-blue-200 border-blue-500/40'
    case 'LOG_ENTRY':
      return 'bg-purple-500/15 text-purple-200 border-purple-500/40'
    case 'USER_ACCOUNT':
      return 'bg-red-500/15 text-red-200 border-red-500/40'
    case 'SCHEDULED_TASK':
      return 'bg-green-500/15 text-green-200 border-green-500/40'
    default:
      return 'bg-white/10 text-white border-white/20'
  }
}
