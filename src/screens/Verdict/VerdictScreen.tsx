import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared/Button';
import { Avatar } from '@/components/Avatar/Avatar';
import { useGame } from '@/contexts/GameContext';
import { usePlayer } from '@/contexts/PlayerContext';
import type { VerdictResult } from '@/types/verdict.types';
import type { AccusationSubmission } from '@/types/verdict.types';
import type { AvatarId } from '@/types/employee.types';
import { downloadCaseReportPdf } from '@/utils/pdfGenerator';

import type { TaggedEvidence } from '@/contexts/EvidenceContext';

type Loc = {
  verdict: VerdictResult;
  accusation: AccusationSubmission;
  elapsedLabel: string;
  tagged?: TaggedEvidence[];
};

export function VerdictScreen() {
  const { caseId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { content, exitCase } = useGame();
  const { profile } = usePlayer();

  const state = location.state as Loc | undefined;

  if (!state || !caseId || !content || content.definition.id !== caseId) {
    return (
      <div className="p-10 font-mono text-amber">
        No verdict payload.
        <Button className="mt-4" onClick={() => nav('/cases')}>
          CASE GRID
        </Button>
      </div>
    );
  }

  const v = state.verdict;
  const accused = content.employees[state.accusation.suspectId];

  const goDebrief = () =>
    nav(`/case/${caseId}/debrief`, {
      state: { verdict: v, accusation: state.accusation },
    });

  const pdf = async () => {
    if (!profile || !accused) return;
    await downloadCaseReportPdf({
      player: profile,
      caseDef: content.definition,
      accused,
      summary: state.accusation.summary,
      tagged: state.tagged ?? [],
      evidenceById: new Map(content.evidenceItems.map((e) => [e.id, e])),
      score: v.totalScore,
      grade: v.grade,
      elapsedLabel: state.elapsedLabel,
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary px-10 py-10 font-mono text-sm text-ink-secondary">
      <div className="mx-auto max-w-3xl border border-border-active bg-bg-secondary p-8 shadow polaroid">
        {v.correctSuspect ? (
          <>
            <h1 className="font-display text-2xl text-threat-green">
              ✓ CASE CLOSED — ACCUSATION SUSTAINED
            </h1>
            <div className="mt-6 flex items-center gap-4">
              {accused ? <Avatar id={accused.avatarId} /> : null}
              <div>
                <p className="font-display text-xl text-ink-primary">
                  {accused?.fullName} — GUILTY
                </p>
                <p>Your accusation was correct.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl text-threat-red">
              ✗ CASE DISMISSED — ACCUSATION NOT SUSTAINED
            </h1>
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
              {accused ? <Avatar id={accused.avatarId} /> : null}
              <div>
                <p className="font-display text-lg text-ink-primary">
                  {accused?.fullName} — INNOCENT
                </p>
                <p className="mt-2">{v.missedCluesSummary}</p>
              </div>
            </div>
            {v.actualPerpetrator ? (
              <div className="mt-6 border border-border p-4">
                <p className="text-amber">ACTUAL PERPETRATOR</p>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar id={v.actualPerpetrator.avatarId as AvatarId} />
                  <span className="font-display text-lg text-ink-primary">
                    {v.actualPerpetrator.name}
                  </span>
                </div>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs uppercase text-amber">Scoring breakdown</p>
          <ul className="mt-3 space-y-1 text-[12px]">
            <li>Correct suspect: {v.correctSuspect ? '+40' : '0'} / 40</li>
            <li>Correct motive: {v.correctMotive ? '+20' : '0'} / 20</li>
            <li>Correct incident type: {v.correctIncident ? '+10' : '0'} / 10</li>
            <li>Evidence completeness: {v.evidenceScore} / 30</li>
            <li>Screenshots: {v.screenshotScore} / 5</li>
            <li>Timeline accuracy: {Math.round(v.timelineAccuracy * 10)} / 10</li>
            <li>Summary quality: {v.summaryQualityScore} / 5</li>
          </ul>
          <p className="mt-4 text-lg text-amber-bright">
            TOTAL {v.totalScore} / 120 — {v.grade}
          </p>
          <p className="mt-2 text-[11px] text-ink-muted">
            Investigation time recorded: {state.elapsedLabel}
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs uppercase text-amber">Evidence gaps</p>
          <ul className="mt-3 max-h-56 overflow-y-auto space-y-2 text-[11px]">
            {v.missedEvidence.map((m) => (
              <li key={m.title} className="border-b border-border pb-2">
                <span className="text-threat-red">✗</span> {m.title}
                <div className="text-ink-muted">{m.location}</div>
                {m.command ? (
                  <div className="text-amber">CMD: {m.command}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={goDebrief}>FORENSIC DEBRIEF</Button>
          {v.correctSuspect ? (
            <Button variant="ghost" onClick={() => void pdf()}>
              DOWNLOAD CASE REPORT PDF
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={() => {
              exitCase();
              nav('/cases');
            }}
          >
            RETURN TO CASES
          </Button>
        </div>
      </div>
    </div>
  );
}
