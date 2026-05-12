import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { useGame } from '@/contexts/GameContext';

export function DebriefScreen() {
  const { caseId } = useParams();
  const nav = useNavigate();
  const { content, exitCase } = useGame();

  if (!caseId || !content || content.definition.id !== caseId) {
    return (
      <div className="p-10 font-mono text-amber">
        Missing debrief context.
        <Button className="mt-4" onClick={() => nav('/cases')}>
          CASE GRID
        </Button>
      </div>
    );
  }

  const d = content.definition.debrief;

  return (
    <div className="min-h-screen bg-bg-primary px-12 py-10 text-ink-secondary">
      <article className="mx-auto max-w-4xl space-y-10 border border-border-active bg-bg-secondary p-10 shadow polaroid">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber">
            Forensic debrief
          </p>
          <h1 className="mt-3 font-display text-3xl text-ink-primary">
            What happened — classified narrative
          </h1>
          <p className="mt-4 font-document text-base leading-relaxed">
            {d.fullStory}
          </p>
        </header>

        <section>
          <h2 className="font-display text-xl text-amber">How they did it</h2>
          <div className="mt-4 space-y-6">
            {d.techniques.map((t) => (
              <div key={t.title} className="border border-border bg-bg-tertiary p-4">
                <h3 className="font-display text-lg text-ink-primary">{t.title}</h3>
                <p className="mt-2 font-document text-sm">{t.whatTheyDid}</p>
                <p className="mt-2 font-document text-sm text-ink-muted">
                  {t.howItWorks}
                </p>
                <p className="mt-2 font-mono text-[11px] text-evidence-network">
                  Artifacts: {t.artifacts}
                </p>
                <p className="mt-2 font-mono text-[11px]">{t.howInvestigatorsFind}</p>
                <p className="mt-2 font-mono text-[10px] text-amber">
                  Example: {t.exampleCommands.join(' · ')}
                </p>
                <p className="mt-2 font-mono text-[10px] text-ink-muted">
                  Real tools: {t.realTools}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-amber">Key takeaways</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 font-document text-sm">
            {d.keyTakeaways.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-amber">Behavioral indicators</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 font-document text-sm">
            {d.behavioralIndicators.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>

        <section className="border border-threat-red/40 bg-threat-red-dim/40 p-4 font-document text-sm">
          <h2 className="font-display text-lg text-threat-red">
            What to do differently
          </h2>
          <p className="mt-2">{d.whatToDoDifferentlyGeneric}</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              exitCase();
              nav('/cases');
            }}
          >
            RETURN TO CASE GRID
          </Button>
          <Button variant="ghost" onClick={() => nav(`/case/${caseId}/workspace`)}>
            REVIEW WORKSPACE AGAIN
          </Button>
        </div>
      </article>
    </div>
  );
}
