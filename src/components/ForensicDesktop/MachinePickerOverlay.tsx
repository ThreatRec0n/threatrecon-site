import { Avatar } from '@/components/Avatar/Avatar';
import type { EmployeeProfile } from '@/types/employee.types';
import clsx from 'clsx';

type Props = {
  employees: EmployeeProfile[];
  activeEmpId: string;
  taggedCountByEmp: Record<string, number>;
  suspectOsLabel: (empId: string) => string;
  onCancel: () => void;
  onMount: (empId: string) => void;
};

export function MachinePickerOverlay({
  employees,
  activeEmpId,
  taggedCountByEmp,
  suspectOsLabel,
  onCancel,
  onMount,
}: Props) {
  return (
    <div className="fixed inset-0 z-[11000] flex flex-col bg-black/85 p-8 font-mono text-white backdrop-blur-sm">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg uppercase tracking-wide text-[#d4a017]">
          Select target workstation
        </h2>
        <button
          type="button"
          className="text-sm text-white/60 hover:text-white"
          onClick={onCancel}
        >
          ESC — cancel
        </button>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((e) => {
          const tagged = taggedCountByEmp[e.id] ?? 0;
          const active = e.id === activeEmpId;
          return (
            <div
              key={e.id}
              className={clsx(
                'rounded-lg border p-4 transition',
                active
                  ? 'border-[#d4a017] bg-[#d4a017]/10'
                  : 'border-white/15 bg-white/5 hover:border-[#d4a017]/40',
              )}
            >
              <div className="flex flex-col items-center">
                <Avatar id={e.avatarId} className="scale-75" />
                <p className="mt-2 font-display text-lg">{e.fullName}</p>
                <p className="text-[11px] text-white/60">{e.employeeIdLabel}</p>
                <p className="text-[11px] text-[#d4a017]">{suspectOsLabel(e.id)}</p>
                <p className="mt-2 text-[11px] text-white/50">
                  🏷 {tagged} tagged on this profile
                </p>
                <button
                  type="button"
                  disabled={active}
                  className={clsx(
                    'mt-4 w-full rounded border py-2 text-[11px] uppercase tracking-wide',
                    active
                      ? 'cursor-default border-white/20 bg-white/5 text-white/40'
                      : 'border-[#d4a017] bg-[#d4a017]/15 text-[#d4a017] hover:bg-[#d4a017]/25',
                  )}
                  onClick={() => !active && onMount(e.id)}
                >
                  {active ? 'ACTIVE' : 'MOUNT →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
