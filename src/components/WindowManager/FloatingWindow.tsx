import { useCallback, type ReactNode } from 'react'
import { Rnd } from 'react-rnd'
import { useWindows, type WindowState } from './WindowManager'

const SNAP_THRESHOLD = 18

export function WindowSurface({ children }: { children?: ReactNode }) {
  const { windows } = useWindows()
  return (
    <>
      {children}
      {windows.filter((w) => !w.minimized).map((w) => (
        <FloatingWindow key={w.id} state={w} />
      ))}
    </>
  )
}

function FloatingWindow({ state }: { state: WindowState }) {
  const { close, toggleMinimize, bringToFront, updateRect, toggleMaximize } = useWindows()

  const onClickAny = useCallback(() => {
    bringToFront(state.id)
  }, [bringToFront, state.id])

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
      style={{ zIndex: state.zIndex }}
      enableResizing={!state.maximized}
      disableDragging={state.maximized}
    >
      <div className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0f1824] shadow-2xl shadow-black/60">
        <header className="window-titlebar flex cursor-move items-center justify-between border-b border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-[#e8edf5]">
          <span className="flex items-center gap-2">
            {state.icon}
            <span className="truncate">{state.title}</span>
          </span>
          <span className="flex items-center gap-1 text-[#8a9ab5]">
            <button
              type="button"
              className="rounded px-2 py-0.5 hover:bg-white/10"
              title="Minimize"
              onClick={(e) => {
                e.stopPropagation()
                toggleMinimize(state.id)
              }}
            >
              −
            </button>
            <button
              type="button"
              className="rounded px-2 py-0.5 hover:bg-white/10"
              title={state.maximized ? 'Restore' : 'Maximize'}
              onClick={(e) => {
                e.stopPropagation()
                toggleMaximize(state.id)
              }}
            >
              {state.maximized ? '❐' : '☐'}
            </button>
            <button
              type="button"
              className="rounded px-2 py-0.5 hover:bg-red-500/30"
              title="Close"
              onClick={(e) => {
                e.stopPropagation()
                close(state.id)
              }}
            >
              ✕
            </button>
          </span>
        </header>
        <div className="window-content min-h-0 flex-1 overflow-hidden">{state.render()}</div>
      </div>
    </Rnd>
  )
}
