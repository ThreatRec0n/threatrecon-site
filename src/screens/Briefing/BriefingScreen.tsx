import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/Avatar/Avatar';
import { useGame } from '@/contexts/GameContext';
import { useMemo } from 'react';

export function BriefingScreen() {
  const { caseId } = useParams();
  const nav = useNavigate();
  const { content, difficulty, caseId: ctxCase } = useGame();

  const ok = caseId && ctxCase === caseId && content && difficulty;

  const suspects = useMemo(() => {
    if (!content) return [];
    return content.definition.employeeIds.map((id) => content.employees[id]);
  }, [content]);

  if (!ok || !content || !difficulty) {
    return (
      <div className="p-10 font-mono text-sm text-amber">
        Case session missing — return to case grid.
        <Button className="mt-4" onClick={() => nav('/cases')}>
          CASE FILES
        </Button>
      </div>
    );
  }

  const b = content.definition.briefing;

  return (
    <div className="min-h-screen bg-bg-primary px-12 py-10">
      <Button variant="ghost" onClick={() => nav('/cases')}>
        ← BACK TO CASE GRID
      </Button>
      <article className="mx-auto mt-8 max-w-4xl border border-border-active bg-bg-paper p-10 text-ink-dark shadow polaroid">
        <header className="border-b border-black/10 pb-4">
          <p className="font-document text-xs uppercase tracking-[0.3em] text-black/50">
            {b.letterheadCompany}
          </p>
          <p className="mt-2 font-document text-sm text-black/60">{b.letterDate}</p>
          <p className="mt-4 inline-block rotate-[-4deg] border-4 border-threat-red/70 px-3 py-1 font-display text-xs uppercase tracking-[0.25em] text-threat-red">
            {b.classificationStamp ?? 'CONFIDENTIAL'}
          </p>
          <h1 className="mt-6 font-display text-3xl text-black">
            Investigation Charter — {content.definition.numberLabel}
          </h1>
          <p className="mt-2 font-document text-sm italic text-black/60">
            {content.definition.tagline}
          </p>
        </header>
        <section className="mt-6 space-y-4 font-document text-base leading-relaxed">
          <p>
            <span className="bg-black px-1 font-mono text-xs uppercase text-bg-paper">
              Incident narrative
            </span>{' '}
            {b.incidentSummary}
          </p>
          <p>
            <span className="font-semibold">Affected assets:</span> {b.stolenOrDamaged}
          </p>
          <p>
            <span className="font-semibold">Discovery timeline:</span>{' '}
            {b.discoveryTimeline}
          </p>
          <p className="border-l-4 border-amber/70 pl-4 text-black/80">
            {b.taskStatement}
          </p>
          <p className="font-mono text-xs text-black/50">
            DIFFICULTY SELECTION: {difficulty} — counter-forensic realism escalates with tier.
          </p>
        </section>

        <section className="mt-10 border-t border-black/10 pt-6">
          <h2 className="font-display text-xl text-black">
            Personnel with logical access
          </h2>
          <div className="mt-6 grid grid-cols-3 gap-6">
            {suspects.map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <Avatar id={s.avatarId} label={s.employeeIdLabel} />
                <p className="mt-2 text-center font-display text-sm text-black">
                  {s.fullName}
                </p>
                <p className="text-center font-mono text-[11px] text-black/60">
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </section>
      </article>
      <div className="mx-auto mt-8 flex max-w-4xl justify-end gap-3">
        <Button onClick={() => nav(`/case/${caseId}/workspace`)}>
          START INVESTIGATION →
        </Button>
      </div>
    </div>
  );
}
