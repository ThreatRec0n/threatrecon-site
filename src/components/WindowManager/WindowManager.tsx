import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface WindowDescriptor {
  id: string
  title: string
  icon?: ReactNode
  render: () => ReactNode
  defaultRect?: { x: number; y: number; width: number; height: number }
  minWidth?: number
  minHeight?: number
}

export interface WindowState {
  id: string
  title: string
  icon?: ReactNode
  render: () => ReactNode
  rect: { x: number; y: number; width: number; height: number }
  minimized: boolean
  zIndex: number
  minWidth: number
  minHeight: number
  preMaxRect?: { x: number; y: number; width: number; height: number }
  maximized: boolean
}

interface ManagerContextValue {
  windows: WindowState[]
  open: (desc: WindowDescriptor) => void
  close: (id: string) => void
  toggleMinimize: (id: string) => void
  bringToFront: (id: string) => void
  updateRect: (id: string, rect: { x: number; y: number; width: number; height: number }) => void
  toggleMaximize: (id: string) => void
}

const Ctx = createContext<ManagerContextValue | null>(null)

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([])
  const topZ = useRef(100)
  const cascadeOffset = useRef(0)

  const bringToFront = useCallback((id: string) => {
    topZ.current += 1
    const z = topZ.current
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)))
  }, [])

  const open = useCallback((desc: WindowDescriptor) => {
    setWindows((ws) => {
      const existing = ws.find((w) => w.id === desc.id)
      topZ.current += 1
      if (existing) {
        return ws.map((w) => (w.id === desc.id ? { ...w, minimized: false, zIndex: topZ.current } : w))
      }
      cascadeOffset.current = (cascadeOffset.current + 28) % 220
      const offset = cascadeOffset.current
      const rect = desc.defaultRect ?? { x: 120 + offset, y: 80 + offset, width: 880, height: 540 }
      const next: WindowState = {
        id: desc.id,
        title: desc.title,
        icon: desc.icon,
        render: desc.render,
        rect,
        minimized: false,
        zIndex: topZ.current,
        minWidth: desc.minWidth ?? 360,
        minHeight: desc.minHeight ?? 240,
        maximized: false,
      }
      return [...ws, next]
    })
  }, [])

  const close = useCallback((id: string) => {
    setWindows((ws) => ws.filter((w) => w.id !== id))
  }, [])

  const toggleMinimize = useCallback((id: string) => {
    topZ.current += 1
    const z = topZ.current
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, minimized: !w.minimized, zIndex: w.minimized ? z : w.zIndex } : w)),
    )
  }, [])

  const updateRect = useCallback(
    (id: string, rect: { x: number; y: number; width: number; height: number }) => {
      setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, rect } : w)))
    },
    [],
  )

  const toggleMaximize = useCallback((id: string) => {
    setWindows((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w
        if (w.maximized && w.preMaxRect) {
          return { ...w, maximized: false, rect: w.preMaxRect, preMaxRect: undefined }
        }
        const desktop = document.getElementById('tr-desktop')
        const dw = desktop?.clientWidth ?? window.innerWidth
        const dh = desktop?.clientHeight ?? window.innerHeight
        return {
          ...w,
          maximized: true,
          preMaxRect: w.rect,
          rect: { x: 0, y: 0, width: dw, height: dh },
        }
      }),
    )
  }, [])

  const value = useMemo<ManagerContextValue>(
    () => ({ windows, open, close, toggleMinimize, bringToFront, updateRect, toggleMaximize }),
    [windows, open, close, toggleMinimize, bringToFront, updateRect, toggleMaximize],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWindows(): ManagerContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWindows requires WindowManagerProvider')
  return v
}
