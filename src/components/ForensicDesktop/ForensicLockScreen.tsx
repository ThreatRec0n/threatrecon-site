import { Avatar } from '@/components/Avatar/Avatar';
import type { EmployeeProfile } from '@/types/employee.types';
import type { ForensicOs } from '@/investigation/suspectWorkstation';
import { useEffect } from 'react';

type Props = {
  os: ForensicOs;
  employee: EmployeeProfile;
  onComplete: () => void;
};

export function ForensicLockScreen({ os, employee, onComplete }: Props) {
  const login = employee.email.split('@')[0] ?? 'user';

  useEffect(() => {
    const t = window.setTimeout(onComplete, 1500);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  if (os === 'ubuntu2204') {
    return (
      <div className="fixed inset-0 z-[10000] flex flex-col bg-[radial-gradient(ellipse_at_30%_60%,#2c0e4a_0%,#1a0a2e_45%,#050310_100%)] font-[Ubuntu,sans-serif] text-[#eeeeec]">
        <div className="p-6 font-mono text-xs text-[#e95420]">Ubuntu</div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-24">
          <div className="rounded-full border-2 border-[#e95420]/60 bg-black/30 p-1 shadow-xl">
            <Avatar id={employee.avatarId} className="scale-75 origin-center" />
          </div>
          <p className="mt-6 font-mono text-xl">{login}</p>
          <p className="mt-1 text-sm text-[#babdb6]">{employee.title}</p>
          <p className="mt-8 font-mono text-lg">11:03 PM</p>
          <p className="text-sm text-[#babdb6]">Wednesday, May 7, 2026</p>
          <p className="mt-8 text-center text-sm font-semibold text-[#e95420]">
            FORENSIC ACCESS — Bypassing GDM
          </p>
          <p className="mt-1 text-center text-xs text-[#babdb6]">
            Mounting read-only image...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden">
      <div
        className="absolute inset-0 scale-110 blur-sm"
        style={{
          background:
            'linear-gradient(180deg,#4a7d9e 0%,#87CEEB 22%,#98D4E8 38%,#4a7c59 52%,#3d6b4a 62%,#5c8a45 72%,#8B7355 88%,#7a6245 100%)',
        }}
      />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />
      <div className="relative flex h-full items-center justify-center p-8">
        <div className="w-full max-w-md rounded-xl border border-white/15 bg-white/10 p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center">
            <Avatar id={employee.avatarId} className="scale-90" />
            <p className="mt-4 font-display text-2xl text-white">
              {employee.fullName}
            </p>
            <p className="mt-1 text-center text-sm text-white/80">
              {employee.title}
            </p>
            <p className="mt-8 font-mono text-lg text-white">11:47 PM</p>
            <p className="text-sm text-white/70">Wednesday, May 7, 2026</p>
            <div className="mt-8 w-full rounded border border-amber/40 bg-black/40 px-4 py-3 text-center">
              <p className="font-mono text-xs uppercase tracking-wide text-amber">
                Forensic access — Auth bypass
              </p>
              <p className="mt-1 font-mono text-[11px] text-white/70">
                Examining read-only image...
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center gap-10 text-white/50">
        <span>📶</span>
        <span>♿</span>
        <span className="opacity-30">⏻</span>
      </footer>
    </div>
  );
}
