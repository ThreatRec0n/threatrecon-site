import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { ThreatReconLogo } from '@/components/shared/Logo';
import { usePlayer } from '@/contexts/PlayerContext';

export function HomeScreen() {
  const nav = useNavigate();
  const { profile, setProfile } = usePlayer();
  const [name, setName] = useState(profile?.name ?? '');
  const [agency, setAgency] = useState(profile?.agency ?? '');
  const [stage, setStage] = useState<'form' | 'verify'>('form');
  const [logLines, setLogLines] = useState<string[]>([]);

  const [badge] = useState(
    () =>
      profile?.badge ??
      `TR-${Math.floor(100000 + Math.random() * 899999)}`,
  );

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) return;
    const next = {
      ...(profile ?? {
        casesCompleted: [],
        caseHistory: [],
        createdAt: new Date().toISOString(),
      }),
      name: trimmed,
      badge,
      agency: agency.trim(),
    };
    setProfile(next);
    setStage('verify');
    const lines = [
      `> INVESTIGATOR ${trimmed.toUpperCase()} — CREDENTIALS VERIFIED`,
      `> BADGE: ${badge}`,
      '> CLEARANCE: ACTIVE',
      '> CASE FILES LOADING...',
      '> YOUR ORDERS: FIND THE THREAT WITHIN.',
    ];
    setLogLines([]);
    lines.forEach((l, i) => {
      window.setTimeout(() => {
        setLogLines((prev) => [...prev, l]);
      }, 400 * (i + 1));
    });
    window.setTimeout(() => nav('/cases'), 400 * (lines.length + 2));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary px-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] noise" />
      <ThreatReconLogo className="mb-6" />
      <p className="mb-10 font-display text-lg tracking-wide text-amber">
        INSIDE JOB — Digital Forensics Investigation Platform
      </p>

      {stage === 'form' ? (
        <div className="w-full max-w-md border border-border-active bg-bg-secondary/90 p-6 shadow polaroid backdrop-blur">
          <label className="block font-mono text-xs text-amber">
            INVESTIGATOR NAME
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-border bg-bg-tertiary px-3 py-2 font-mono text-sm text-ink-primary outline-none focus:border-border-active"
              maxLength={60}
            />
          </label>
          <div className="mt-4 font-mono text-xs text-ink-secondary">
            BADGE NUMBER{' '}
            <span className="text-amber-bright">{badge}</span>{' '}
            <span className="text-ink-muted">(auto-assigned)</span>
          </div>
          <label className="mt-4 block font-mono text-xs text-amber">
            AGENCY / ORGANIZATION (OPTIONAL)
            <input
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="mt-1 w-full border border-border bg-bg-tertiary px-3 py-2 font-mono text-sm text-ink-primary outline-none focus:border-border-active"
            />
          </label>
          <Button className="mt-6 w-full" onClick={submit}>
            ACCEPT ASSIGNMENT →
          </Button>
        </div>
      ) : (
        <pre className="max-h-60 w-full max-w-lg overflow-auto border border-border bg-black/60 p-4 font-mono text-xs text-evidence-network">
          {logLines.join('\n')}
        </pre>
      )}
    </div>
  );
}
