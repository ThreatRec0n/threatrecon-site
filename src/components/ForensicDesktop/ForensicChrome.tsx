import { formatElapsed } from '@/utils/timer';

type Props = {
  caseTr: string;
  examinerName: string;
  examinerBadge: string;
  targetLabel: string;
  osLabel: string;
  elapsedSeconds: number;
  taggedCount: number;
  onToggleDrawer: () => void;
  drawerOpen: boolean;
  onCaptureClick: () => void;
};

export function ForensicChrome({
  caseTr,
  examinerName,
  examinerBadge,
  targetLabel,
  osLabel,
  elapsedSeconds,
  taggedCount,
  onToggleDrawer,
  drawerOpen,
  onCaptureClick,
}: Props) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[9000] border-[3px] border-[#d4a017] shadow-[inset_0_0_30px_rgba(212,160,23,0.08)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute left-[-20%] top-[10%] rotate-[-30deg] select-none font-mono text-[180px] font-bold leading-none text-[#d4a017]/[0.05]"
          style={{ whiteSpace: 'nowrap' }}
        >
          READ-ONLY FORENSIC COPY — {caseTr}
        </div>
      </div>

      <div className="fixed right-4 top-4 z-[9500] max-w-sm rounded border border-[#d4a017]/80 bg-[rgba(13,10,5,0.85)] p-3 font-mono text-[11px] shadow-xl backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-wide text-[#d4a017]">
          🔒 READ-ONLY FORENSIC COPY
        </p>
        <p className="mt-2 text-[#d4a017]">
          CASE:{' '}
          <span className="text-white">{caseTr}</span>
        </p>
        <p className="mt-1 text-[#d4a017]">
          EXAMINER:{' '}
          <span className="text-white">
            {examinerName || '—'} | Badge:{' '}
            {examinerBadge || 'TR-0000'}
          </span>
        </p>
        <p className="mt-1 text-[#d4a017]">
          TARGET: <span className="text-white">{targetLabel}</span>
        </p>
        <p className="mt-1 text-[#d4a017]">
          OS: <span className="text-white">{osLabel}</span>
        </p>
        <hr className="my-2 border-[#d4a017]/30" />
        <div className="flex justify-between gap-4">
          <span className="text-[#d4a017]">
            ⏱ <span className="text-white">{formatElapsed(elapsedSeconds)}</span>
          </span>
          <span className="text-[#d4a017]">
            🏷{' '}
            <span className="text-white">
              {taggedCount} items tagged
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={onCaptureClick}
          className="mt-3 w-full rounded border border-[#d4a017]/50 bg-black/40 py-1.5 text-[10px] uppercase tracking-wide text-[#d4a017] hover:bg-[#d4a017]/10"
        >
          📷 Capture region (Ctrl+Shift+S)
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleDrawer}
        className="fixed right-0 top-1/2 z-[9400] -translate-y-1/2 rounded-l-md border border-r-0 border-[#d4a017] bg-[rgba(13,10,5,0.92)] px-2 py-6 font-mono text-[11px] uppercase tracking-wide text-[#d4a017] shadow-lg backdrop-blur-sm hover:bg-[#d4a017]/15"
        title="Evidence panel"
      >
        {drawerOpen ? '►' : '◄'} EVIDENCE
      </button>
    </>
  );
}
