import clsx from 'clsx';
import type { EmployeeProfile } from '@/types/employee.types';
import type { ScreenshotEvidence } from '@/types/evidence.types';
import { Button } from '@/components/shared/Button';
import type { ReactNode } from 'react';

type PanelId = string;

type Props = {
  open: boolean;
  onClose: () => void;
  caseLabel: string;
  screenshots: ScreenshotEvidence[];
  taggedLabels: { evidenceId: string; title: string; suspectName: string }[];
  employees: EmployeeProfile[];
  activeEmpId: string;
  suspectOsLabel: (empId: string) => string;
  onPickMachine: (empId: string) => void;
  gateOk: boolean;
  gateReasons: string[];
  onAccuse: () => void;
  onOpenNotebook: () => void;
  navItems: { id: PanelId; label: string }[];
  toolkitPanel: PanelId;
  setToolkitPanel: (id: PanelId) => void;
  toolkitTaggingDeck: ReactNode;
  toolkitMain: ReactNode;
};

export function EvidenceDrawer({
  open,
  onClose,
  caseLabel,
  screenshots,
  taggedLabels,
  employees,
  activeEmpId,
  suspectOsLabel,
  onPickMachine,
  gateOk,
  gateReasons,
  onAccuse,
  onOpenNotebook,
  navItems,
  toolkitPanel,
  setToolkitPanel,
  toolkitTaggingDeck,
  toolkitMain,
}: Props) {
  return (
    <div
      className={clsx(
        'fixed bottom-0 top-0 z-[9300] flex w-[min(420px,92vw)] flex-col border-l border-[#d4a017]/40 bg-[rgba(8,8,10,0.97)] shadow-2xl backdrop-blur-md transition-transform duration-300',
        open ? 'right-0 translate-x-0' : 'right-0 translate-x-full',
      )}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-[#d4a017]">
            Evidence panel
          </p>
          <p className="font-display text-sm text-white">{caseLabel}</p>
        </div>
        <button
          type="button"
          className="font-mono text-lg text-white/60 hover:text-white"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="mb-6">
          <h3 className="font-mono text-[11px] text-[#d4a017]">
            📸 Screenshots ({screenshots.length})
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {screenshots.map((s) => (
              <div key={s.id} className="rounded border border-white/10 bg-black/40 p-1">
                <img src={s.dataUrl} alt="" className="h-16 w-full object-cover" />
                <p className="mt-1 truncate font-mono text-[9px] text-white/70">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="font-mono text-[11px] text-[#d4a017]">
            🏷 Tagged ({taggedLabels.length})
          </h3>
          <ul className="mt-2 space-y-1 font-mono text-[10px] text-white/80">
            {taggedLabels.map((t) => (
              <li key={t.evidenceId} className="truncate border-b border-white/5 py-1">
                {t.title} — {t.suspectName}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <Button className="w-full text-[11px]" variant="ghost" onClick={onOpenNotebook}>
            📓 Open notebook
          </Button>
        </section>

        <section className="mb-6 rounded border border-[#d4a017]/30 bg-black/30 p-3">
          <h3 className="font-mono text-[11px] text-[#d4a017]">⚖ Accuse</h3>
          <Button
            className="mt-3 w-full text-[11px]"
            variant={gateOk ? 'primary' : 'ghost'}
            disabled={!gateOk}
            onClick={onAccuse}
          >
            {gateOk ? 'OPEN ACCUSATION' : 'LOCKED'}
          </Button>
          {!gateOk ? (
            <ul className="mt-2 space-y-1 font-mono text-[9px] text-white/50">
              {gateReasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mb-6">
          <h3 className="font-mono text-[11px] text-[#d4a017]">Machines</h3>
          <ul className="mt-2 space-y-2">
            {employees.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  disabled={e.id === activeEmpId}
                  className={clsx(
                    'w-full rounded border px-3 py-2 text-left font-mono text-[11px]',
                    e.id === activeEmpId
                      ? 'border-[#d4a017]/60 bg-[#d4a017]/10 text-[#d4a017]'
                      : 'border-white/10 bg-black/30 text-white hover:border-[#d4a017]/40',
                  )}
                  onClick={() => onPickMachine(e.id)}
                >
                  {e.fullName}{' '}
                  <span className="text-[10px] text-white/50">
                    {suspectOsLabel(e.id)}
                  </span>
                  {e.id === activeEmpId ? (
                    <span className="ml-2 text-[10px] uppercase text-[#d4a017]">
                      active
                    </span>
                  ) : (
                    <span className="ml-2 text-[10px] text-white/40">mount →</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-white/10 pt-4">
          <h3 className="font-mono text-[11px] uppercase tracking-wide text-white/60">
            Investigation toolkit
          </h3>
          <div className="mt-2 grid max-h-48 grid-cols-2 gap-1 overflow-y-auto font-mono text-[10px]">
            {navItems.map((n) => (
              <button
                key={n.id}
                type="button"
                className={clsx(
                  'rounded px-2 py-1.5 text-left',
                  toolkitPanel === n.id
                    ? 'bg-[#d4a017]/20 text-[#d4a017]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10',
                )}
                onClick={() => setToolkitPanel(n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-h-[45vh] overflow-y-auto rounded border border-white/10 bg-black/40 p-3">
            {toolkitTaggingDeck}
            {toolkitMain}
          </div>
        </section>
      </div>
    </div>
  );
}
