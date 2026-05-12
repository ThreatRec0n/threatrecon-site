import type { DeskWindowKind } from './DesktopWindows';

export const UBUNTU_DOCK_APPS: {
  kind: DeskWindowKind;
  label: string;
  glyph: string;
}[] = [
  { kind: 'explorer', label: 'Files', glyph: '📁' },
  { kind: 'edge', label: 'Firefox', glyph: '🦊' },
  { kind: 'cmd', label: 'Terminal', glyph: '>_/' },
  { kind: 'explorer', label: 'VS Code', glyph: '</>' },
  { kind: 'outlook', label: 'Slack', glyph: '#' },
  { kind: 'explorer', label: 'Docker Desktop', glyph: '🐳' },
  { kind: 'explorer', label: 'Settings', glyph: '⚙' },
  { kind: 'explorer', label: 'Ubuntu Software', glyph: '🛒' },
];

type Props = {
  title: string;
  frozenClock?: string;
  onOpenApp: (kind: DeskWindowKind, title: string) => void;
  onOpenActivities: () => void;
  openKinds: DeskWindowKind[];
};

export function UbuntuDockChrome({
  title,
  frozenClock = 'Mon 23:03',
  onOpenApp,
  onOpenActivities,
  openKinds,
}: Props) {
  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[7900] flex h-8 items-center justify-between border-b border-black bg-[#1a1a1a] px-3 font-[Ubuntu,sans-serif] text-[11px] text-[#eeeeec]">
        <button
          type="button"
          onClick={onOpenActivities}
          className="text-left text-[#e95420] hover:underline"
        >
          Activities
        </button>
        <span className="truncate px-4 text-center text-white/90">{title}</span>
        <span className="flex shrink-0 items-center gap-3 text-white/60">
          <span aria-hidden>🔊</span>
          <span aria-hidden>🌐</span>
          <span aria-hidden>⚡</span>
          <span className="font-mono text-[#d4a017]" title="Frozen incident snapshot">
            {frozenClock}
          </span>
          <span aria-hidden>🔔</span>
          <span aria-hidden>▼</span>
        </span>
      </div>

      <div className="fixed bottom-0 left-0 top-8 z-[7900] flex w-[72px] flex-col items-center gap-2 border-r border-white/10 bg-[rgba(40,40,40,0.85)] py-3 backdrop-blur-md">
        {UBUNTU_DOCK_APPS.map((d) => (
          <button
            key={`${d.kind}-${d.label}`}
            type="button"
            title={d.label}
            className="relative flex h-12 w-12 flex-col items-center justify-center rounded-lg hover:bg-white/10"
            onClick={() => onOpenApp(d.kind, d.label)}
          >
            <span className="text-lg">{d.glyph}</span>
            {openKinds.includes(d.kind) ? (
              <span className="absolute left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-[#e95420]" />
            ) : null}
          </button>
        ))}
        <button
          type="button"
          title="Applications"
          className="mt-auto flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-lg hover:bg-white/10"
          onClick={onOpenActivities}
        >
          ⊞
        </button>
      </div>
    </>
  );
}
