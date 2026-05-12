import clsx from 'clsx';
import { useMemo, useState } from 'react';
import type { DeskWindowKind, DeskWindowState } from './DesktopWindows';

type Pinned = {
  id: string;
  label: string;
  kind: DeskWindowKind;
};

const PINNED: Pinned[] = [
  { id: 'edge', label: 'Edge', kind: 'edge' },
  { id: 'fe', label: 'Files', kind: 'explorer' },
  { id: 'teams', label: 'Teams', kind: 'outlook' },
  { id: 'outlook', label: 'Out', kind: 'outlook' },
  { id: 'code', label: 'VS', kind: 'explorer' },
];

type Props = {
  openWindows: DeskWindowState[];
  activeWindowId: string | null;
  onOpenPinned: (kind: DeskWindowKind) => void;
  onToggleWindow: (id: string) => void;
  onOpenStartApp: (kind: DeskWindowKind, title: string) => void;
};

const ALL_APPS: { letter: string; items: { name: string; kind: DeskWindowKind }[] }[] =
  [
    {
      letter: 'C',
      items: [
        { name: 'Command Prompt', kind: 'cmd' },
        { name: 'Calculator', kind: 'explorer' },
      ],
    },
    {
      letter: 'E',
      items: [
        { name: 'Event Viewer', kind: 'explorer' },
        { name: 'Microsoft Edge', kind: 'edge' },
      ],
    },
    {
      letter: 'F',
      items: [{ name: 'File Explorer', kind: 'explorer' }],
    },
    {
      letter: 'N',
      items: [{ name: 'Notepad', kind: 'notepad' }],
    },
    {
      letter: 'R',
      items: [{ name: 'Registry Editor', kind: 'explorer' }],
    },
    {
      letter: 'T',
      items: [
        { name: 'Task Manager', kind: 'taskmgr' },
        { name: 'Microsoft Teams', kind: 'outlook' },
      ],
    },
    {
      letter: 'W',
      items: [
        { name: 'Windows PowerShell', kind: 'powershell' },
        { name: 'Microsoft Word', kind: 'notepad' },
      ],
    },
  ];

export function WindowsTaskbar({
  openWindows,
  activeWindowId,
  onOpenPinned,
  onToggleWindow,
  onOpenStartApp,
}: Props) {
  const [startOpen, setStartOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_APPS;
    return ALL_APPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.name.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [search]);

  return (
    <>
      {startOpen ? (
        <div
          className="fixed inset-0 z-[8000] bg-black/40"
          role="presentation"
          onClick={() => setStartOpen(false)}
        />
      ) : null}

      {startOpen ? (
        <div className="fixed bottom-12 left-1/2 z-[8100] flex h-[min(700px,70vh)] w-[min(600px,94vw)] -translate-x-1/2 flex-col overflow-hidden rounded-t-xl border border-white/10 bg-[rgba(32,32,32,0.98)] shadow-2xl backdrop-blur-[40px]">
          <div className="border-b border-white/10 p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps, settings, and documents..."
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-wide text-white/60">
              <span>Pinned</span>
              <span>All apps</span>
            </div>
            <div className="grid flex-1 grid-cols-6 gap-3 overflow-y-auto p-4">
              {PINNED.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex flex-col items-center gap-1 rounded bg-white/5 p-2 font-mono text-[10px] text-white hover:bg-white/10"
                  onClick={() => {
                    onOpenPinned(p.kind);
                    setStartOpen(false);
                  }}
                >
                  <span className="text-xl">▣</span>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="max-h-[220px] overflow-y-auto border-t border-white/10 p-3">
              {filteredApps.map((grp) => (
                <div key={grp.letter} className="mb-3">
                  <p className="font-mono text-[11px] font-bold text-amber">{grp.letter}</p>
                  <ul className="mt-1 space-y-1">
                    {grp.items.map((item) => (
                      <li key={item.name}>
                        <button
                          type="button"
                          className="w-full rounded px-2 py-1 text-left font-mono text-[11px] text-white/85 hover:bg-white/10"
                          onClick={() => {
                            onOpenStartApp(item.kind, item.name);
                            setStartOpen(false);
                          }}
                        >
                          {item.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-[7900] flex h-12 items-center gap-2 border-t border-black bg-[#1c1c1c] px-2">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded hover:bg-white/10"
          title="Start"
          onClick={() => setStartOpen((s) => !s)}
        >
          <span className="text-lg text-sky-400">⊞</span>
        </button>
        <div className="flex h-9 w-[280px] items-center rounded-full border border-white/10 bg-black/40 px-4 font-mono text-[11px] text-white/40">
          🔍 Search
        </div>
        <div className="flex-1" />
        <div className="flex items-end gap-1">
          {PINNED.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex h-11 w-12 flex-col items-center justify-end pb-1 hover:bg-white/10"
              title={p.label}
              onClick={() => onOpenPinned(p.kind)}
            >
              <span className="text-lg text-white/80">▣</span>
            </button>
          ))}
          {openWindows.map((w) => (
            <button
              key={w.id}
              type="button"
              className={clsx(
                'flex h-11 w-12 flex-col items-center justify-end pb-1 hover:bg-white/10',
                activeWindowId === w.id && !w.minimized && 'border-b-2 border-sky-400',
                w.minimized && 'opacity-50',
              )}
              title={w.title}
              onClick={() => onToggleWindow(w.id)}
            >
              <span className="text-xs text-white/70">▪</span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 justify-end" />
        <div className="flex items-center gap-3 pr-3 font-mono text-[11px] text-white/70">
          <span>▲</span>
          <span>📶</span>
          <span>🔔</span>
          <div className="text-right leading-tight">
            <div className="text-[#d4a017]">11:47 PM</div>
            <div className="text-[10px] text-white/50">5/7/2026</div>
          </div>
        </div>
      </div>
    </>
  );
}
