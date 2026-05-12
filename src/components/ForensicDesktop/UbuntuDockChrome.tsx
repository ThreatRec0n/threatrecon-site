import type { DeskWindowKind } from './DesktopWindows';

type Props = {
  title: string;
  onOpenApp: (kind: DeskWindowKind, title: string) => void;
  openKinds: DeskWindowKind[];
};

const DOCK: { kind: DeskWindowKind; label: string; glyph: string }[] = [
  { kind: 'explorer', label: 'Files', glyph: '📁' },
  { kind: 'edge', label: 'Firefox', glyph: '🦊' },
  { kind: 'cmd', label: 'Terminal', glyph: '>_/' },
  { kind: 'explorer', label: 'VS Code', glyph: '</>' },
  { kind: 'outlook', label: 'Slack', glyph: '#' },
  { kind: 'explorer', label: 'Settings', glyph: '⚙' },
];

export function UbuntuDockChrome({ title, onOpenApp, openKinds }: Props) {
  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[7900] flex h-8 items-center justify-between border-b border-black bg-[#1a1a1a] px-3 font-[Ubuntu,sans-serif] text-[11px] text-[#eeeeec]">
        <span className="text-[#e95420]">Activities</span>
        <span className="truncate text-white/90">{title}</span>
        <span className="flex gap-3 text-white/60">
          🔊 🌐 ⚡ <span className="text-[#d4a017]">11:03 PM</span> 🔔
        </span>
      </div>

      <div className="fixed bottom-3 left-1/2 z-[7900] flex -translate-x-1/2 gap-2 rounded-xl border border-white/10 bg-[rgba(20,20,20,0.85)] px-4 py-2 shadow-xl backdrop-blur-md">
        {DOCK.map((d) => (
          <button
            key={`${d.kind}-${d.label}`}
            type="button"
            title={d.label}
            className="relative flex h-12 w-12 flex-col items-center justify-center rounded-lg hover:bg-white/10"
            onClick={() => onOpenApp(d.kind, d.label)}
          >
            <span className="text-lg">{d.glyph}</span>
            {openKinds.includes(d.kind) ? (
              <span className="absolute bottom-0 h-1 w-6 rounded-full bg-[#e95420]" />
            ) : null}
          </button>
        ))}
      </div>
    </>
  );
}
