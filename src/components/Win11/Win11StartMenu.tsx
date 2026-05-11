import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'

type ToolId = string

export interface StartMenuTool {
  id: ToolId
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
}

const PINNED_GRID: { id: ToolId; label: string }[][] = [
  [
    { id: 'terminal', label: 'Terminal' },
    { id: 'evt', label: 'Event Viewer' },
    { id: 'reg', label: 'Registry Editor' },
    { id: 'net', label: 'Network Monitor' },
  ],
  [
    { id: 'proc', label: 'Process Monitor' },
    { id: 'tasks', label: 'Task Scheduler' },
    { id: 'fw', label: 'Firewall Manager' },
    { id: 'files', label: 'File Explorer' },
  ],
  [
    { id: 'timeline', label: 'Incident Timeline' },
    { id: 'users', label: 'Local Users' },
    { id: 'documents', label: 'Documents' },
    { id: 'settings-app', label: 'Settings' },
  ],
]

export function Win11StartMenu({
  open,
  onClose,
  toolsById,
  recommended,
  displayName,
  avatarInitials,
  onOpenTool,
  onOpenDocuments,
  onPowerSleep,
}: {
  open: boolean
  onClose: () => void
  toolsById: Map<string, StartMenuTool>
  recommended: { id: ToolId; label: string; ago: string }[]
  displayName: string
  avatarInitials: string
  onOpenTool: (id: ToolId) => void
  onOpenDocuments: () => void
  onPowerSleep: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [allApps, setAllApps] = useState(false)
  const [powerOpen, setPowerOpen] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) {
      setAllApps(false)
      setPowerOpen(false)
      setQ('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const allSorted = useMemo(() => {
    return [...toolsById.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [toolsById])

  const filteredPinned = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return PINNED_GRID
    return PINNED_GRID.map((row) =>
      row.filter((cell) => cell.label.toLowerCase().includes(qq) || cell.id.includes(qq)),
    ).filter((row) => row.length > 0)
  }, [q])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[940] cursor-default bg-transparent"
        aria-label="Close Start menu"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Start"
        className="fixed bottom-[52px] left-1/2 z-[950] flex max-h-[min(700px,calc(100vh-96px))] w-[min(660px,calc(100vw-24px))] -translate-x-1/2 translate-y-0 flex-col overflow-hidden rounded-xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.55)] transition-opacity duration-300 ease-out"
        style={{
          fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
          background: 'rgba(30,30,30,0.78)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 pb-3 pt-4">
          <div className="flex rounded-md border border-white/10 bg-black/25 px-3 py-2">
            <svg width={18} height={18} viewBox="0 0 24 24" className="mr-2 shrink-0 text-[#aaa]" aria-hidden>
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for apps, settings, files..."
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 pt-2">
          {!allApps ? (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white">Pinned</span>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[12px] text-[#a8d4ff] hover:bg-white/10"
                  onClick={() => setAllApps(true)}
                >
                  All apps &gt;
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {filteredPinned.flatMap((row) =>
                  row.map((cell) => {
                    const t = toolsById.get(cell.id)
                    const IconComp = t?.Icon
                    return (
                      <button
                        key={cell.id}
                        type="button"
                        className="flex flex-col items-center gap-1 rounded-lg border border-transparent px-1 py-2 transition-colors duration-200 hover:border-white/10 hover:bg-white/8"
                        onClick={() => {
                          if (cell.id === 'documents') onOpenDocuments()
                          else onOpenTool(cell.id)
                          onClose()
                        }}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/35 shadow-inner">
                          {IconComp ? <IconComp size={26} className="text-[#c8e8ff]" /> : null}
                        </span>
                        <span className="max-w-[84px] text-center text-[11px] leading-tight text-[#ececec]">
                          {cell.label}
                        </span>
                      </button>
                    )
                  }),
                )}
              </div>

              <div className="mt-6 text-[13px] font-semibold text-white">Recommended</div>
              <div className="mt-2 space-y-1">
                {recommended.length === 0 ? (
                  <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-[12px] text-white/45">
                    Recent tools will appear here as you investigate.
                  </div>
                ) : (
                  recommended.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-white/10"
                      onClick={() => {
                        onOpenTool(r.id)
                        onClose()
                      }}
                    >
                      <span className="text-[13px] text-[#f2f2f2]">{r.label}</span>
                      <span className="text-[11px] text-white/45">{r.ago}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div>
              <button
                type="button"
                className="mb-3 text-[12px] text-[#a8d4ff] hover:underline"
                onClick={() => setAllApps(false)}
              >
                &lt; Back
              </button>
              <div className="columns-2 gap-x-6">
                {allSorted.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="flex w-full items-center gap-2 py-1.5 text-left text-[13px] text-[#ececec] hover:text-white"
                    onClick={() => {
                      onOpenTool(t.id)
                      onClose()
                    }}
                  >
                    <t.Icon size={18} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between border-t border-white/10 px-4 py-3"
          style={{ background: 'rgba(15,15,15,0.55)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3d5a85] text-xs font-semibold text-white">
              {avatarInitials.slice(0, 3)}
            </div>
            <span className="text-[13px] font-medium text-white">{displayName}</span>
          </div>
          <div className="relative">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
              aria-haspopup
              aria-expanded={powerOpen}
              onClick={() => setPowerOpen(!powerOpen)}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" className="text-[#ececec]" aria-hidden>
                <path fill="currentColor" d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
              </svg>
            </button>
            {powerOpen ? (
              <div className="absolute bottom-full right-0 mb-2 w-44 rounded-lg border border-white/10 bg-[#2a2a2a] py-1 shadow-xl">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[12px] hover:bg-white/10"
                  onClick={() => {
                    setPowerOpen(false)
                    onPowerSleep()
                  }}
                >
                  Sleep
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[12px] text-white/45"
                  disabled
                >
                  Shutdown (disabled)
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[12px] text-white/45"
                  disabled
                >
                  Restart (disabled)
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
