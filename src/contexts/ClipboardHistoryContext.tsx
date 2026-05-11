import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const MAX = 5

interface ClipboardHistoryValue {
  items: string[]
  push: (text: string) => void
  clear: () => void
}

const Ctx = createContext<ClipboardHistoryValue | null>(null)

export function ClipboardHistoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([
    'IOC: invoice_q2_signed.7z',
    'Dst: 185.220.101.8:4444',
    'Hash: SHA256 — pending analyst paste',
  ])

  const push = useCallback((text: string) => {
    const t = text.trim()
    if (!t) return
    setItems((prev) => [t, ...prev.filter((x) => x !== t)].slice(0, MAX))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => ({ items, push, clear }), [items, push, clear])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useClipboardHistory(): ClipboardHistoryValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useClipboardHistory requires ClipboardHistoryProvider')
  return v
}
