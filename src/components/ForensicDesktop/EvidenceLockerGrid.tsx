import { Avatar } from '@/components/Avatar/Avatar';
import type { EmployeeProfile } from '@/types/employee.types';
import {
  evidenceBagMeta,
  formatTrCaseNumber,
  getSuspectOs,
  windowsOsLabel,
  displayMachineName,
} from '@/investigation/suspectWorkstation';
import clsx from 'clsx';

type Props = {
  caseId: string;
  caseLabel: string;
  employees: EmployeeProfile[];
  onMount: (employeeId: string) => void;
};

export function EvidenceLockerGrid({
  caseId,
  caseLabel,
  employees,
  onMount,
}: Props) {
  const tr = formatTrCaseNumber(caseId);

  return (
    <div className="min-h-screen bg-[#050508] px-6 py-12 text-ink-primary">
      <header className="mx-auto mb-10 max-w-6xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-amber">
          Evidence locker
        </p>
        <h1 className="mt-3 font-display text-3xl text-amber">{caseLabel}</h1>
        <p className="mt-2 font-mono text-sm text-ink-muted">{tr}</p>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-center gap-8">
        {employees.map((emp) => {
          const os = getSuspectOs(caseId, emp.id);
          const meta = evidenceBagMeta(emp.workstationId, emp.id);
          const host = displayMachineName(emp.workstationId);
          return (
            <article
              key={emp.id}
              className={clsx(
                'group relative w-[340px] cursor-pointer rounded-lg border border-amber/25 bg-[#0c0c10] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-transform hover:-translate-y-1 hover:border-amber/50 hover:shadow-[0_18px_48px_rgba(212,160,23,0.12)]',
              )}
              role="button"
              tabIndex={0}
              onClick={() => onMount(emp.id)}
              onKeyDown={(e) =>
                (e.key === 'Enter' || e.key === ' ') && onMount(emp.id)
              }
            >
              <div className="mb-4 border border-amber/40 bg-black/40 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-amber">
                Evidence property tag
              </div>

              <div className="flex flex-col items-center">
                <div className="rounded-md border-2 border-white/10 bg-[#1a1a1f] p-2 shadow-inner">
                  <Avatar id={emp.avatarId} className="h-24 w-24" />
                </div>

                <dl className="mt-4 w-full space-y-1 font-mono text-[11px] text-ink-secondary">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">NAME</dt>
                    <dd className="text-right text-ink-primary">{emp.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">EMP ID</dt>
                    <dd className="text-right">{emp.employeeIdLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">DEVICE</dt>
                    <dd className="text-right">{meta.deviceModel}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">S/N</dt>
                    <dd className="text-right">{meta.serial}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">OS</dt>
                    <dd className="text-right text-amber">{windowsOsLabel(os)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">IMAGE</dt>
                    <dd className="break-all text-right text-[10px]">
                      {meta.imageFile}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">SIZE</dt>
                    <dd className="text-right">{meta.capacityGb} GB</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">MD5</dt>
                    <dd className="break-all text-right text-[10px] opacity-80">
                      {meta.md5.slice(0, 18)}…
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">SHA256</dt>
                    <dd className="break-all text-right text-[10px] opacity-80">
                      {meta.sha256.slice(0, 18)}…
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-white/5 pt-2">
                    <dt className="text-ink-muted">HOST</dt>
                    <dd className="text-right text-[10px]">{host}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">COLLECTED</dt>
                    <dd className="text-right text-[10px]">{meta.collectedUtc}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">BY</dt>
                    <dd className="text-right text-[10px]">{meta.detective}</dd>
                  </div>
                </dl>

                <div className="mt-4 w-full border border-amber/30 bg-amber/5 py-2 text-center font-mono text-[10px] text-amber">
                  CHAIN OF CUSTODY: MAINTAINED ✓
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded border border-amber bg-amber/10 py-2 font-mono text-xs uppercase tracking-wide text-amber transition group-hover:bg-amber group-hover:text-black"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMount(emp.id);
                  }}
                >
                  Mount and examine →
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
