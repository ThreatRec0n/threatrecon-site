import { CASE_ORDER, getCaseContent } from '@/data/cases/registry';
import type { Difficulty } from '@/types/case.types';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { ThreatReconLogo } from '@/components/shared/Logo';
import { useGame } from '@/contexts/GameContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/shared/Modal';

export function CasesScreen() {
  const nav = useNavigate();
  const { openCase } = useGame();
  const { profile } = usePlayer();
  const [pick, setPick] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const completed = useMemo(
    () => new Set(profile?.casesCompleted ?? []),
    [profile?.casesCompleted],
  );

  const statusForIndex = (idx: number, id: string) => {
    if (idx === 0) return completed.has(id) ? 'COMPLETED' : 'OPEN';
    const prev = CASE_ORDER[idx - 1];
    if (!completed.has(prev)) return 'LOCKED';
    return completed.has(id) ? 'COMPLETED' : 'OPEN';
  };

  const start = (difficulty: Difficulty) => {
    if (!pick) return;
    openCase(pick.id, difficulty);
    setPick(null);
    nav(`/case/${pick.id}/briefing`);
  };

  return (
    <div className="min-h-screen bg-bg-primary px-10 py-8">
      <header className="mb-8 flex items-center justify-between">
        <ThreatReconLogo />
        <Button variant="ghost" onClick={() => nav('/')}>
          PROFILE
        </Button>
      </header>
      <h1 className="font-display text-2xl text-amber">
        AVAILABLE CASE FILES
      </h1>
      <p className="mt-2 max-w-3xl font-document text-ink-secondary">
        Cases unlock sequentially. Select a case to choose difficulty and review
        the briefing package.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-6">
        {CASE_ORDER.map((id, idx) => {
          const c = getCaseContent(id);
          if (!c) return null;
          const status = statusForIndex(idx, id);
          const locked = status === 'LOCKED';
          return (
            <button
              key={id}
              type="button"
              disabled={locked}
              onClick={() => !locked && setPick({ id, title: c.definition.tagline })}
              className={`border p-5 text-left shadow transition ${
                locked
                  ? 'cursor-not-allowed border-border bg-bg-secondary/40 opacity-50'
                  : 'border-border-active bg-bg-secondary hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-amber">
                  {c.definition.numberLabel}
                </span>
                <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                  {status}
                </span>
              </div>
              <p className="mt-3 font-display text-lg text-ink-primary">
                {c.definition.companyName}
              </p>
              <p className="mt-1 text-xs font-mono uppercase text-evidence-access">
                {c.definition.caseType}
              </p>
              <p className="mt-3 font-document text-sm text-ink-secondary">
                {c.definition.descriptionOneLine}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['BEGINNER', 'INTERMEDIATE', 'HARD'] as const).map((d) => (
                  <span
                    key={d}
                    className="rounded-sm bg-bg-tertiary px-2 py-1 font-mono text-[10px] text-ink-muted"
                  >
                    {d}: ~{c.definition.difficultyEstimateMinutes[d]}m
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <Modal
        open={Boolean(pick)}
        title={pick ? `${pick.title}` : ''}
        onClose={() => setPick(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPick(null)}>
              CANCEL
            </Button>
          </>
        }
      >
        {pick ? (
          <div className="space-y-3 font-mono text-sm text-ink-secondary">
            <p>Select difficulty tier:</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => start('BEGINNER')}>BEGINNER</Button>
              <Button onClick={() => start('INTERMEDIATE')}>
                INTERMEDIATE
              </Button>
              <Button onClick={() => start('HARD')}>HARD</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
