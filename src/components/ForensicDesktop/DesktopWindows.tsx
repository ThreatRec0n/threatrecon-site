import type { ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import clsx from 'clsx';

export type DeskWindowKind =
  | 'cmd'
  | 'powershell'
  | 'explorer'
  | 'notepad'
  | 'outlook'
  | 'edge'
  | 'taskmgr';

export interface DeskWindowState {
  id: string;
  kind: DeskWindowKind;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
}

type Props = {
  windows: DeskWindowState[];
  activeId: string | null;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onDragStop: (id: string, x: number, y: number) => void;
  onResizeStop: (id: string, w: number, h: number, x: number, y: number) => void;
  renderBody: (kind: DeskWindowKind, win: DeskWindowState) => ReactNode;
};

export function DesktopWindows({
  windows,
  activeId,
  onFocus,
  onClose,
  onMinimize,
  onDragStop,
  onResizeStop,
  renderBody,
}: Props) {
  return (
    <>
      {windows
        .filter((w) => !w.minimized)
        .map((win) => (
          <Rnd
            key={win.id}
            size={{ width: win.w, height: win.h }}
            position={{ x: win.x, y: win.y }}
            minWidth={280}
            minHeight={160}
            bounds="parent"
            dragHandleClassName="win-drag-handle"
            className={clsx(
              'fixed overflow-hidden rounded border border-white/10 shadow-2xl',
              activeId === win.id ? 'z-[5000]' : 'z-[4000]',
            )}
            style={{ zIndex: win.z }}
            onDragStop={(_e, d) => onDragStop(win.id, d.x, d.y)}
            onResizeStop={(_e, _dir, ref, _delta, pos) =>
              onResizeStop(win.id, ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
            }
            onMouseDown={() => onFocus(win.id)}
          >
            <div className="flex h-full flex-col bg-[#1a1a1a]">
              <header className="win-drag-handle flex h-8 shrink-0 cursor-move items-center justify-between border-b border-black bg-[#202020] px-2">
                <span className="flex items-center gap-2 truncate font-mono text-[11px] text-white">
                  <span className="opacity-70">■</span>
                  {win.title}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    className="flex h-7 w-11 items-center justify-center text-xs text-white hover:bg-white/10"
                    onClick={() => onMinimize(win.id)}
                  >
                    _
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-11 items-center justify-center text-xs text-white hover:bg-white/10"
                  >
                    □
                  </button>
                  <button
                    type="button"
                    className="flex h-7 w-11 items-center justify-center text-xs text-white hover:bg-[#c42b1c]"
                    onClick={() => onClose(win.id)}
                  >
                    ×
                  </button>
                </span>
              </header>
              <div className="min-h-0 flex-1 overflow-hidden">{renderBody(win.kind, win)}</div>
            </div>
          </Rnd>
        ))}
    </>
  );
}
