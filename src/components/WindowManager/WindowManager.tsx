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

export type SnapZone =
  | 'maximize'
  | 'half-left'
  | 'half-right'
  | 'wide-left'
  | 'narrow-right'
  | 'third-left'
  | 'third-center'
  | 'third-right'
  | 'half-top'
  | 'half-bottom'

interface SavedGeom {
  [windowId: string]: { x: number; y: number; width: number; height: number }
}

function desktopBounds(): { w: number; h: number } {
  const desktop = document.getElementById('tr-desktop')
  return {
    w: desktop?.clientWidth ?? window.innerWidth,
    h: desktop?.clientHeight ?? window.innerHeight,
  }
}

function rectForSnap(zone: SnapZone): { x: number; y: number; width: number; height: number } {
  const { w: dw, h: dh } = desktopBounds()
  switch (zone) {
    case 'maximize':
      return { x: 0, y: 0, width: dw, height: dh }
    case 'half-left':
      return { x: 0, y: 0, width: Math.floor(dw / 2), height: dh }
    case 'half-right':
      return { x: Math.floor(dw / 2), y: 0, width: Math.ceil(dw / 2), height: dh }
    case 'wide-left': {
      const lw = Math.round(dw * 0.7)
      return { x: 0, y: 0, width: lw, height: dh }
    }
    case 'narrow-right': {
      const lw = Math.round(dw * 0.7)
      return { x: lw, y: 0, width: dw - lw, height: dh }
    }
    case 'third-left':
      return { x: 0, y: 0, width: Math.floor(dw / 3), height: dh }
    case 'third-center':
      return { x: Math.floor(dw / 3), y: 0, width: Math.floor(dw / 3), height: dh }
    case 'third-right':
      return { x: Math.floor((dw * 2) / 3), y: 0, width: Math.ceil(dw / 3), height: dh }
    case 'half-top':
      return { x: 0, y: 0, width: dw, height: Math.floor(dh / 2) }
    case 'half-bottom':
      return { x: 0, y: Math.floor(dh / 2), width: dw, height: Math.ceil(dh / 2) }
    default:
      return { x: 0, y: 0, width: dw, height: dh }
  }
}

interface ManagerContextValue {
  windows: WindowState[]
  open: (desc: WindowDescriptor) => void
  close: (id: string) => void
  toggleMinimize: (id: string) => void
  bringToFront: (id: string) => void
  updateRect: (id: string, rect: { x: number; y: number; width: number; height: number }) => void
  toggleMaximize: (id: string) => void
  snapWindow: (id: string, zone: SnapZone) => void
  minimizeAllForDesktop: () => void
  toggleRestoreDesktop: () => void
  toggleDesktop: () => void
  desktopClearActive: boolean
}

const Ctx = createContext<ManagerContextValue | null>(null)

function loadSaved(storageKey: string | null | undefined): SavedGeom {
  if (!storageKey || typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(`tr-win11-geom-${storageKey}`)
    if (!raw) return {}
    return JSON.parse(raw) as SavedGeom
  } catch {
    return {}
  }
}

function saveGeom(storageKey: string | null | undefined, geom: SavedGeom) {
  if (!storageKey || typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(`tr-win11-geom-${storageKey}`, JSON.stringify(geom))
  } catch {
    /* ignore quota */
  }
}

export function WindowManagerProvider({
  children,
  geometryStorageKey,
}: {
  children: ReactNode
  geometryStorageKey?: string | null
}) {
  const [windows, setWindows] = useState<WindowState[]>([])
  const topZ = useRef(100)
  const cascadeOffset = useRef(0)
  const savedGeomRef = useRef<SavedGeom>({})
  const desktopMinimizedIdsRef = useRef<string[] | null>(null)
  const [desktopClearActive, setDesktopClearActive] = useState(false)

  useEffect(() => {
    savedGeomRef.current = loadSaved(geometryStorageKey ?? null)
  }, [geometryStorageKey])

  const persistRects = useCallback(
    (ws: WindowState[]) => {
      const key = geometryStorageKey ?? null
      if (!key) return
      const geom: SavedGeom = {}
      for (const w of ws) {
        if (!w.maximized && !w.minimized) geom[w.id] = { ...w.rect }
      }
      savedGeomRef.current = geom
      saveGeom(key, geom)
    },
    [geometryStorageKey],
  )

  const bringToFront = useCallback((id: string) => {
    topZ.current += 1
    const z = topZ.current
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)))
  }, [])

  const open = useCallback(
    (desc: WindowDescriptor) => {
      setWindows((ws) => {
        const existing = ws.find((w) => w.id === desc.id)
        topZ.current += 1
        if (existing) {
          const next = ws.map((w) =>
            w.id === desc.id ? { ...w, minimized: false, zIndex: topZ.current } : w,
          )
          persistRects(next)
          return next
        }
        cascadeOffset.current = (cascadeOffset.current + 28) % 220
        const offset = cascadeOffset.current
        const saved = savedGeomRef.current[desc.id]
        const fallback = desc.defaultRect ?? { x: 120 + offset, y: 80 + offset, width: 880, height: 540 }
        const rect = saved ?? fallback
        const nextWin: WindowState = {
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
        const next = [...ws, nextWin]
        persistRects(next)
        return next
      })
    },
    [persistRects],
  )

  const close = useCallback(
    (id: string) => {
      setWindows((ws) => {
        const next = ws.filter((w) => w.id !== id)
        persistRects(next)
        return next
      })
    },
    [persistRects],
  )

  const toggleMinimize = useCallback((id: string) => {
    topZ.current += 1
    const z = topZ.current
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, minimized: !w.minimized, zIndex: w.minimized ? z : w.zIndex } : w)),
    )
  }, [])

  const updateRect = useCallback(
    (id: string, rect: { x: number; y: number; width: number; height: number }) => {
      setWindows((ws) => {
        const next = ws.map((w) => (w.id === id ? { ...w, rect, maximized: false, preMaxRect: undefined } : w))
        persistRects(next)
        return next
      })
    },
    [persistRects],
  )

  const toggleMaximize = useCallback(
    (id: string) => {
      setWindows((ws) => {
        const next = ws.map((w) => {
          if (w.id !== id) return w
          if (w.maximized && w.preMaxRect) {
            return { ...w, maximized: false, rect: w.preMaxRect, preMaxRect: undefined }
          }
          const { w: dw, h: dh } = desktopBounds()
          return {
            ...w,
            maximized: true,
            preMaxRect: w.rect,
            rect: { x: 0, y: 0, width: dw, height: dh },
          }
        })
        persistRects(next)
        return next
      })
    },
    [persistRects],
  )

  const snapWindow = useCallback(
    (id: string, zone: SnapZone) => {
      setWindows((ws) => {
        const next = ws.map((w) => {
          if (w.id !== id) return w
          if (zone === 'maximize') {
            const { w: dw, h: dh } = desktopBounds()
            return {
              ...w,
              maximized: true,
              preMaxRect: w.preMaxRect ?? w.rect,
              rect: { x: 0, y: 0, width: dw, height: dh },
            }
          }
          const r = rectForSnap(zone)
          return {
            ...w,
            maximized: false,
            preMaxRect: undefined,
            rect: r,
          }
        })
        persistRects(next)
        return next
      })
      bringToFront(id)
    },
    [bringToFront, persistRects],
  )

  const minimizeAllForDesktop = useCallback(() => {
    setWindows((ws) => {
      const visible = ws.filter((w) => !w.minimized).map((w) => w.id)
      desktopMinimizedIdsRef.current = visible
      setDesktopClearActive(true)
      return ws.map((w) => ({ ...w, minimized: true }))
    })
  }, [])

  const toggleRestoreDesktop = useCallback(() => {
    setWindows((ws) => {
      const ids = desktopMinimizedIdsRef.current
      if (!ids || ids.length === 0) {
        setDesktopClearActive(false)
        desktopMinimizedIdsRef.current = null
        return ws.map((w) => ({ ...w, minimized: false }))
      }
      setDesktopClearActive(false)
      desktopMinimizedIdsRef.current = null
      topZ.current += 1
      const z = topZ.current
      return ws.map((w) => (ids.includes(w.id) ? { ...w, minimized: false, zIndex: z } : w))
    })
  }, [])

  const toggleDesktop = useCallback(() => {
    setWindows((ws) => {
      if (desktopMinimizedIdsRef.current != null) {
        const ids = desktopMinimizedIdsRef.current
        desktopMinimizedIdsRef.current = null
        setDesktopClearActive(false)
        topZ.current += 1
        const z = topZ.current
        if (ids.length === 0) return ws.map((w) => ({ ...w, minimized: false, zIndex: z }))
        return ws.map((w) => (ids.includes(w.id) ? { ...w, minimized: false, zIndex: z } : w))
      }
      const visible = ws.filter((w) => !w.minimized).map((w) => w.id)
      if (visible.length === 0) return ws
      desktopMinimizedIdsRef.current = visible
      setDesktopClearActive(true)
      return ws.map((w) => ({ ...w, minimized: true }))
    })
  }, [])

  const value = useMemo<ManagerContextValue>(
    () => ({
      windows,
      open,
      close,
      toggleMinimize,
      bringToFront,
      updateRect,
      toggleMaximize,
      snapWindow,
      minimizeAllForDesktop,
      toggleRestoreDesktop,
      toggleDesktop,
      desktopClearActive,
    }),
    [
      windows,
      open,
      close,
      toggleMinimize,
      bringToFront,
      updateRect,
      toggleMaximize,
      snapWindow,
      minimizeAllForDesktop,
      toggleRestoreDesktop,
      toggleDesktop,
      desktopClearActive,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWindows(): ManagerContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWindows requires WindowManagerProvider')
  return v
}
