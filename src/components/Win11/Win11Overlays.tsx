import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useWindows } from '../WindowManager/WindowManager'
import { IconEdgeLogo } from './Win11Icons'
import { useClipboardHistory } from '../../contexts/ClipboardHistoryContext'

const RUN_HISTORY = ['cmd', 'regedit', 'eventvwr', 'taskmgr', 'mmc']

export function Win11RunDialog({
  open,
  onClose,
  onSubmitCommand,
}: {
  open: boolean
  onClose: () => void
  onSubmitCommand: (cmd: string) => void
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue('')
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  const submit = () => {
    const c = value.trim().toLowerCase()
    if (!c) return
    onSubmitCommand(c)
    onClose()
  }

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1600] bg-black/40 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        className="fixed left-1/2 top-1/2 z-[1610] w-[min(420px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/12 bg-[#2d2d2d] shadow-2xl"
        style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
          <IconEdgeLogo size={18} />
          <span className="text-[13px] font-semibold text-white">Run</span>
        </div>
        <div className="px-4 py-3">
          <label className="text-[12px] text-[#bbb]">Open:</label>
          <input
            ref={inputRef}
            list="tr-run-history"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            className="mt-1 w-full rounded border border-white/15 bg-black/35 px-2 py-2 text-[13px] text-white outline-none"
          />
          <datalist id="tr-run-history">
            {RUN_HISTORY.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded px-4 py-1.5 text-[12px] hover:bg-white/10" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="rounded px-4 py-1.5 text-[12px] hover:bg-white/10" disabled>
              Browse…
            </button>
            <button type="button" className="rounded bg-[#0067c0] px-4 py-1.5 text-[12px] text-white hover:bg-[#0078d4]" onClick={submit}>
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function Win11SearchOverlay({
  open,
  onClose,
  query,
  setQuery,
  topApps,
  onPickTool,
  eventSnippets,
}: {
  open: boolean
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  topApps: { id: string; label: string; Icon: ComponentType<{ size?: number }> }[]
  onPickTool: (id: string) => void
  eventSnippets: { eventId: number; title: string }[]
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return { apps: topApps, events: [] as typeof eventSnippets }
    return {
      apps: topApps.filter((a) => a.label.toLowerCase().includes(q) || a.id.includes(q)),
      events: eventSnippets.filter((e) => String(e.eventId).includes(q) || e.title.toLowerCase().includes(q)),
    }
  }, [query, topApps, eventSnippets])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1500] bg-black/55 backdrop-blur-md" onClick={onClose} aria-label="Close search" />
      <div
        className="fixed left-1/2 top-[12vh] z-[1510] w-[min(720px,96vw)] -translate-x-1/2 rounded-xl border border-white/10 bg-[#2c2c2c]/95 p-5 shadow-2xl"
        style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search SOC workstation…"
          className="w-full rounded-lg border border-white/12 bg-black/30 px-4 py-3 text-[18px] text-white outline-none placeholder:text-white/35"
        />
        <div className="mt-6 max-h-[50vh] overflow-y-auto">
          {filtered.events.length ? (
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Best match — Event IDs</div>
              {filtered.events.slice(0, 8).map((ev) => (
                <button
                  key={ev.eventId + ev.title}
                  type="button"
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/10"
                  onClick={() => {
                    onPickTool('evt')
                    onClose()
                  }}
                >
                  <span className="rounded bg-[#264f78] px-2 py-0.5 font-mono text-[11px]">{ev.eventId}</span>
                  <span className="text-[13px] text-[#eaeaea]">{ev.title}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Apps</div>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
            {(query.trim() ? filtered.apps : topApps).map((a) => (
              <button
                key={a.id}
                type="button"
                className="flex flex-col items-center gap-1 rounded-lg border border-transparent px-2 py-3 hover:border-white/10 hover:bg-white/[0.06]"
                onClick={() => {
                  onPickTool(a.id)
                  onClose()
                }}
              >
                <a.Icon size={28} />
                <span className="text-center text-[11px] text-[#ddd]">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function Win11TaskViewOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { windows, bringToFront, close } = useWindows()

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1350] bg-black/70 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div className="fixed inset-x-0 bottom-[52px] top-[10vh] z-[1360] flex flex-col px-10 pt-6" style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-auto mb-4 flex gap-4 overflow-x-auto pb-2">
          {windows.map((w) => (
            <button
              key={w.id}
              type="button"
              className="relative w-[220px] shrink-0 rounded-lg border border-white/15 bg-[#2b2b2b]/95 shadow-xl transition-transform duration-200 hover:-translate-y-1"
              onClick={() => {
                bringToFront(w.id)
                onClose()
              }}
            >
              <div className="flex h-[120px] flex-col items-center justify-center bg-gradient-to-br from-[#1f3a5f]/80 to-[#111]/90 px-2">
                <span className="text-[11px] font-semibold text-[#dce9ff]">{w.title}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="truncate text-[11px] text-[#ccc]">{w.title}</span>
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-[11px] hover:bg-white/15"
                  onClick={(e) => {
                    e.stopPropagation()
                    close(w.id)
                  }}
                >
                  ✕
                </button>
              </div>
            </button>
          ))}
        </div>
        <div className="pointer-events-auto mt-auto rounded-xl border border-white/10 bg-[#2a2a2a]/90 px-4 py-3">
          <div className="text-[12px] text-[#aaa]">Virtual desktops</div>
          <div className="mt-2 flex gap-2">
            <div className="rounded-lg border border-[#0078d4] bg-black/30 px-4 py-2 text-[12px] text-white">
              Desktop 1 — SOC Investigation
            </div>
            <button type="button" className="rounded-lg border border-dashed border-white/25 px-4 py-2 text-[12px] hover:bg-white/10">
              + New desktop
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function Win11QuickSettings({
  open,
  onClose,
  anchorRight,
}: {
  open: boolean
  onClose: () => void
  anchorRight?: boolean
}) {
  const [vol] = useState(75)
  const [bri] = useState(85)

  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1300] bg-transparent" onClick={onClose} aria-hidden />
      <div
        className={`fixed bottom-[52px] z-[1310] w-[360px] max-w-[94vw] rounded-xl border border-white/10 bg-[#2c2c2c]/96 p-4 shadow-2xl backdrop-blur-xl ${anchorRight ? 'right-3' : 'right-[180px]'}`}
        style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Wi‑Fi', 'SOC-SECURE-NET', true],
            ['Bluetooth', 'Off', false],
            ['Airplane', 'Off', false],
            ['Focus assist', 'Off', false],
            ['VPN', 'Connected', true],
            ['Night light', 'Off', false],
            ['Accessibility', '', false],
            ['Cast', '', false],
          ].map(([a, b, on]) => (
            <button
              key={String(a)}
              type="button"
              className="flex aspect-square flex-col justify-between rounded-lg bg-[#3b3b3b]/90 p-2 text-left text-[10px] hover:bg-[#454545]"
            >
              <span className="font-semibold text-[#f5f5f5]">{a}</span>
              <span className={`text-[9px] ${on ? 'text-emerald-300' : 'text-[#888]'}`}>{b}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-black/25 px-3 py-2 text-[11px] text-[#bbb]">
          Wi‑Fi expanded (simulated): <span className="text-white">SOC-SECURE-NET</span> · Signal excellent · IP{' '}
          <span className="font-mono text-[#a8d4ff]">10.50.1.12</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span aria-hidden>🔊</span>
          <input type="range" min={0} max={100} value={vol} readOnly className="flex-1 accent-[#0078d4]" />
          <span className="w-8 tabular-nums text-[11px]">{vol}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span aria-hidden>☀</span>
          <input type="range" min={0} max={100} value={bri} readOnly className="flex-1 accent-[#ffb74d]" />
          <span className="w-8 tabular-nums text-[11px]">{bri}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-[11px] text-[#a8d4ff]">
          <button type="button" className="hover:underline">
            Settings
          </button>
          <button type="button" className="hover:underline">
            Network settings
          </button>
          <button type="button" className="hover:underline">
            Edit quick settings
          </button>
        </div>
      </div>
    </>
  )
}

export function Win11ActionCenter({
  open,
  onClose,
  caseTitle,
}: {
  open: boolean
  onClose: () => void
  caseTitle: string
}) {
  const [notes, setNotes] = useState<{ id: string; title: string; body: string; time: string }[]>([
    {
      id: '1',
      title: 'SIEM correlation spike',
      body: `Suspicious persistence aligned with ${caseTitle}`,
      time: '11:02 AM',
    },
    {
      id: '2',
      title: 'Outbound TOR observation',
      body: 'NetFlow anomaly toward bulletproof host · tier-2 review',
      time: '10:41 AM',
    },
  ])
  const [focusAssist, setFocusAssist] = useState(false)

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  const today = new Date()

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1250] bg-black/30" onClick={onClose} aria-hidden />
      <aside
        className="fixed right-0 top-0 z-[1260] flex h-full w-[380px] max-w-[100vw] flex-col border-l border-white/10 bg-[#2c2c2c]/98 shadow-2xl backdrop-blur-xl"
        style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-[14px] font-semibold">Notification Center</span>
          <button type="button" className="text-[12px] text-[#a8d4ff] hover:underline" onClick={() => setNotes([])}>
            Clear all
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {notes.map((n) => (
            <div key={n.id} className="mb-2 rounded-lg border border-white/10 bg-black/25 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#264f78] text-[11px]">SIEM</span>
                  <div>
                    <div className="text-[11px] text-[#aaa]">Microsoft Defender ATP · {n.time}</div>
                    <div className="text-[13px] font-semibold text-white">{n.title}</div>
                  </div>
                </div>
                <button type="button" className="text-[#888] hover:text-white" onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}>
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[12px] leading-snug text-[#ccc]">{n.body}</p>
            </div>
          ))}
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="text-center text-[13px] font-semibold">
              {today.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-[#888]">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                <span key={idx}>{d}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px]">
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = i - 5 + 1
                const valid = dayNum > 0 && dayNum <= 31
                const isToday = valid && dayNum === today.getDate()
                return (
                  <span
                    key={i}
                    className={`rounded-full py-1 ${isToday ? 'bg-[#0078d4] font-semibold text-white' : valid ? 'text-[#ddd]' : 'text-transparent'}`}
                  >
                    {valid ? dayNum : '·'}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        <footer className="border-t border-white/10 px-4 py-3">
          <button
            type="button"
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] ${focusAssist ? 'bg-[#0078d4]/30' : 'bg-white/[0.04]'}`}
            onClick={() => setFocusAssist((f) => !f)}
          >
            Focus assist
            <span className="text-[11px] text-[#aaa]">{focusAssist ? 'On' : 'Off'}</span>
          </button>
        </footer>
      </aside>
    </>
  )
}

export function Win11WidgetsPanel({
  open,
  onClose,
  threatActor,
}: {
  open: boolean
  onClose: () => void
  threatActor: string
}) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1150] bg-black/40" onClick={onClose} aria-hidden />
      <aside className="fixed bottom-[52px] left-3 top-[8vh] z-[1160] w-[min(360px,92vw)] rounded-xl border border-white/10 bg-[#1e1e1e]/96 shadow-2xl backdrop-blur-xl">
        <div className="max-h-full space-y-3 overflow-y-auto p-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1a5080] to-[#0d2847] p-4 text-white">
            <div className="text-[22px] font-light">72°F</div>
            <div className="text-[12px] text-white/75">McLean, VA · SOC Campus (simulated)</div>
          </div>
          <div className="rounded-xl bg-[#2c2c2c] p-3">
            <div className="text-[12px] font-semibold text-[#aaa]">SOC stats</div>
            <div className="mt-2 space-y-1 text-[13px]">
              <div>Active alerts: 3</div>
              <div>Cases open: 1</div>
              <div>Last sensor sweep: 5 min ago</div>
            </div>
          </div>
          <div className="rounded-xl bg-[#2c2c2c] p-3">
            <div className="text-[12px] font-semibold text-[#aaa]">Threat intel</div>
            <p className="mt-2 text-[13px] leading-snug text-[#ddd]">
              Tracking cluster associated with <span className="text-[#ffb74d]">{threatActor}</span> — prioritize outbound staging and scheduled task tampering.
            </p>
          </div>
          <div className="rounded-xl bg-[#2c2c2c] p-3">
            <div className="text-[12px] font-semibold text-[#aaa]">Headlines</div>
            <ul className="mt-2 list-disc space-y-2 pl-4 text-[12px] text-[#c8c8c8]">
              <li>CISA releases guidance on LOLBins abuse in enterprise SOC playbooks</li>
              <li>Ransomware affiliates pivot to OAuth token theft — defenders urged to review consent grants</li>
              <li>MITRE ATT&amp;CK v15 emphasizes persistence detection fidelity on endpoints</li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}

export function Win11ClipboardPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, clear } = useClipboardHistory()

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-[1400] bg-black/25" onClick={onClose} aria-hidden />
      <div className="fixed bottom-[56px] left-1/2 z-[1410] w-[min(380px,94vw)] -translate-x-1/2 rounded-xl border border-white/10 bg-[#2c2c2c]/98 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold">Clipboard</span>
          <button type="button" className="text-[11px] text-[#a8d4ff]" onClick={() => clear()}>
            Clear
          </button>
        </div>
        <ul className="max-h-52 space-y-2 overflow-y-auto">
          {items.map((t, i) => (
            <li key={i} className="rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] text-[#dce9ff]">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function Win11AltTabSwitcher({
  open,
  index,
  windows,
  onSelect,
}: {
  open: boolean
  index: number
  windows: { id: string; title: string }[]
  onSelect: (id: string) => void
}) {
  if (!open || windows.length === 0) return null

  return (
    <div className="fixed left-1/2 top-[28%] z-[2000] -translate-x-1/2 rounded-xl border border-white/12 bg-[#1f1f1f]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <div className="flex gap-2">
        {windows.map((w, i) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect(w.id)}
            className={`w-36 rounded-lg border px-2 py-4 text-center text-[11px] ${i === index ? 'border-[#0078d4] bg-[#0078d4]/25' : 'border-white/10 bg-black/30'}`}
          >
            <div className="mx-auto mb-2 h-14 rounded bg-gradient-to-br from-[#264f78]/90 to-[#111]" />
            <span className="line-clamp-2 text-[#eaeaea]">{w.title}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 text-center text-[10px] text-[#777]">Alt+Tab · release Alt to switch</div>
    </div>
  )
}

export function Win11CalendarFlyout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = new Date()
  if (!open) return null
  return (
    <>
      <button type="button" className="fixed inset-0 z-[1240] bg-transparent" onClick={onClose} aria-hidden />
      <div className="fixed bottom-[52px] right-[120px] z-[1245] w-[280px] rounded-xl border border-white/10 bg-[#2c2c2c]/98 p-4 shadow-2xl backdrop-blur-xl">
        <div className="text-[13px] font-semibold">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-[#888]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
            <span key={idx}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px]">
          {Array.from({ length: 35 }).map((_, i) => {
            const dayNum = i - 5 + 1
            const valid = dayNum > 0 && dayNum <= 31
            const isToday = valid && dayNum === today.getDate()
            return (
              <span
                key={i}
                className={`rounded-full py-1 ${isToday ? 'bg-[#0078d4] font-semibold text-white' : valid ? 'text-[#ddd]' : 'text-transparent'}`}
              >
                {valid ? dayNum : '·'}
              </span>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function Win11ScreenshotToast({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-[60px] left-1/2 z-[2100] -translate-x-1/2 rounded-lg border border-white/15 bg-[#2d2d2d] px-5 py-3 text-[13px] text-white shadow-xl">
      Screenshot copied to clipboard (simulated)
    </div>
  )
}
