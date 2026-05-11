import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Rnd } from 'react-rnd'
import { useWindows, type SnapZone, type WindowState } from './WindowManager'

const SNAP_THRESHOLD = 18

export function WindowSurface({ children }: { children?: ReactNode }) {
  const { windows } = useWindows()
  return (
    <>
      {children}
      <div className="pointer-events-none absolute inset-0 z-[40]">
        {windows
          .filter((w) => !w.minimized)
          .map((w) => (
            <FloatingWindow key={w.id} state={w} />
          ))}
      </div>
    </>
  )
}

const SNAP_OPTIONS: { zone: SnapZone; label: string }[] = [
  { zone: 'half-left', label: 'Half left' },
  { zone: 'half-right', label: 'Half right' },
  { zone: 'wide-left', label: '70 / 30 (left)' },
  { zone: 'narrow-right', label: '70 / 30 (right)' },
  { zone: 'third-left', label: 'Third — left' },
  { zone: 'half-top', label: 'Half top' },
]

function FloatingWindow({ state }: { state: WindowState }) {
  const { close, toggleMinimize, bringToFront, updateRect, toggleMaximize, snapWindow } = useWindows()
  const [snapOpen, setSnapOpen] = useState(false)
  const snapLeaveTimer = useRef<number | null>(null)

  const onClickAny = useCallback(() => {
    bringToFront(state.id)
  }, [bringToFront, state.id])

  const clearSnapLeave = () => {
    if (snapLeaveTimer.current != null) window.clearTimeout(snapLeaveTimer.current)
    snapLeaveTimer.current = null
  }

  const scheduleSnapClose = () => {
    clearSnapLeave()
    snapLeaveTimer.current = window.setTimeout(() => setSnapOpen(false), 220)
  }

  return (
    <Rnd
      bounds="parent"
      dragHandleClassName="window-titlebar"
      enableUserSelectHack={false}
      cancel="input, textarea, button, select, .xterm, .xterm *, .window-content, .window-content *"
      minWidth={state.minWidth}
      minHeight={state.minHeight}
      size={{ width: state.rect.width, height: state.rect.height }}
      position={{ x: state.rect.x, y: state.rect.y }}
      onMouseDown={onClickAny}
      onDragStop={(_, d) => {
        const desktop = document.getElementById('tr-desktop')
        const dw = desktop?.clientWidth ?? window.innerWidth
        const dh = desktop?.clientHeight ?? window.innerHeight
        let { x, y } = d
        let { width, height } = state.rect
        if (y < SNAP_THRESHOLD) {
          x = 0
          y = 0
          width = dw
          height = dh
        } else if (x < SNAP_THRESHOLD) {
          x = 0
          y = 0
          width = Math.floor(dw / 2)
          height = dh
        } else if (x + state.rect.width > dw - SNAP_THRESHOLD) {
          x = Math.floor(dw / 2)
          y = 0
          width = Math.ceil(dw / 2)
          height = dh
        }
        updateRect(state.id, { x, y, width, height })
      }}
      onResizeStop={(_, _dir, ref, _delta, position) => {
        updateRect(state.id, {
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        })
      }}
      style={{ zIndex: state.zIndex, pointerEvents: 'auto' }}
      enableResizing={!state.maximized}
      disableDragging={state.maximized}
    >
      <div
        className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-t-xl rounded-b-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif" }}
      >
        <header
          className="window-titlebar flex h-10 shrink-0 cursor-move select-none items-center justify-between rounded-t-xl px-2 text-[13px] text-[#f3f3f3]"
          style={{ background: 'rgba(30,30,30,0.95)' }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            toggleMaximize(state.id)
          }}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 px-1">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">{state.icon}</span>
            <span className="truncate tracking-tight">{state.title}</span>
          </span>
          <span className="flex h-full items-stretch">
            <button
              type="button"
              className="flex w-11 items-center justify-center rounded-sm transition-colors duration-200 hover:bg-white/10"
              title="Minimize"
              onClick={(e) => {
                e.stopPropagation()
                toggleMinimize(state.id)
              }}
            >
              <span className="pb-1 text-lg leading-none text-[#e8e8e8]">&#8212;</span>
            </button>
            <div
              className="relative flex items-stretch"
              onMouseEnter={() => {
                clearSnapLeave()
                setSnapOpen(true)
              }}
              onMouseLeave={scheduleSnapClose}
            >
              <button
                type="button"
                className="flex w-11 items-center justify-center rounded-sm transition-colors duration-200 hover:bg-white/10"
                title={state.maximized ? 'Restore' : 'Maximize'}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMaximize(state.id)
                  setSnapOpen(false)
                }}
              >
                <span className="text-[15px] leading-none text-[#e8e8e8]">{state.maximized ? '\u2750' : '\u25A1'}</span>
              </button>
              {snapOpen ? (
                <div
                  className="pointer-events-auto absolute bottom-full right-0 z-[200] mb-1 rounded-lg border border-white/10 bg-[#2d2d2d]/98 p-2 shadow-xl backdrop-blur-md transition-opacity duration-200"
                  style={{ width: 148 }}
                  onMouseEnter={clearSnapLeave}
                  onMouseLeave={scheduleSnapClose}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-[#a0a0a0]">Snap layouts</div>
                  <div className="grid h-[72px] w-full grid-cols-3 grid-rows-2 gap-1">
                    {SNAP_OPTIONS.map((opt) => (
                      <button
                        key={opt.zone}
                        type="button"
                        title={opt.label}
                        className="rounded-sm border border-white/10 bg-[#3c3c3c]/90 transition-transform duration-150 hover:scale-[1.02] hover:border-[#5e9bff]/60 hover:bg-[#4a4a4a]"
                        onClick={(e) => {
                          e.stopPropagation()
                          snapWindow(state.id, opt.zone)
                          setSnapOpen(false)
                          window.dispatchEvent(
                            new CustomEvent('tr-snap-second-window', { detail: { zone: opt.zone } }),
                          )
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md bg-white/5 py-1 text-[11px] text-[#ddd] hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      snapWindow(state.id, 'maximize')
                      setSnapOpen(false)
                    }}
                  >
                    Full screen
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="flex w-11 items-center justify-center rounded-sm text-[#e8e8e8] transition-colors duration-200 hover:bg-[#c42b1c]"
              title="Close"
              onClick={(e) => {
                e.stopPropagation()
                close(state.id)
              }}
            >
              <span className="text-sm leading-none">&#10005;</span>
            </button>
          </span>
        </header>
        <div className="window-content min-h-0 flex-1 overflow-hidden rounded-b-xl bg-[#1a1a1a]">
          {state.render()}
        </div>
      </div>
    </Rnd>
  )
}
