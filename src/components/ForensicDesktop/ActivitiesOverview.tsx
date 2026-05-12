import type { DeskWindowKind, DeskWindowState } from './DesktopWindows';

type DockApp = { kind: DeskWindowKind; label: string; glyph: string };

type Props = {
  open: boolean;
  onClose: () => void;
  windows: DeskWindowState[];
  dockApps: DockApp[];
  onLaunch: (kind: DeskWindowKind, title: string) => void;
};

export function ActivitiesOverview({
  open,
  onClose,
  windows,
  dockApps,
  onLaunch,
}: Props) {
  if (!open) return null;
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[9200] flex flex-col bg-black/70 font-[Ubuntu,sans-serif] backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="presentation"
        className="flex flex-1 flex-col"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <input
          type="search"
          readOnly
          placeholder="Type to search applications (read-only forensic UI)"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-[#1a1a1a] px-5 py-2.5 text-sm text-[#eeeeec] outline-none ring-[#e95420]/40 placeholder:text-white/35 focus:ring-2"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-white/20 px-4 py-2 text-xs uppercase tracking-wide text-white/80 hover:bg-white/10"
        >
          Esc
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden p-6">
        <div className="flex min-w-0 flex-[2] flex-col gap-4 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-wide text-white/45">
            Running apps · workspace thumbnails
          </p>
          <div className="flex flex-wrap gap-4">
            {windows.length === 0 ? (
              <p className="text-sm text-white/40">No applications open.</p>
            ) : (
              windows.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={onClose}
                  className="w-44 rounded-lg border border-white/15 bg-[#2c2c2c]/90 p-3 text-left shadow-lg hover:border-[#e95420]/60"
                >
                  <div className="aspect-video rounded bg-black/50" />
                  <p className="mt-2 truncate text-[11px] text-[#eeeeec]">{w.title}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 pl-6">
          <p className="text-[11px] uppercase tracking-wide text-white/45">
            Applications
          </p>
          <div className="grid grid-cols-3 gap-3">
            {dockApps.map((d) => (
              <button
                key={`${d.kind}-${d.label}`}
                type="button"
                title={d.label}
                onClick={() => {
                  onLaunch(d.kind, d.label);
                  onClose();
                }}
                className="flex flex-col items-center gap-1 rounded-lg border border-transparent p-2 hover:border-[#e95420]/50 hover:bg-white/5"
              >
                <span className="text-2xl">{d.glyph}</span>
                <span className="text-center text-[9px] leading-tight text-white/75">
                  {d.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
