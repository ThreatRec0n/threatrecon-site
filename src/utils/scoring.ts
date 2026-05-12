import type { CaseDefinition, CaseEvidenceItem } from '@/types/case.types';
import type { EmployeeProfile } from '@/types/employee.types';
import type { AccusationSubmission } from '@/types/verdict.types';
import type { VerdictResult } from '@/types/verdict.types';

function gradeFromScore(total: number): string {
  if (total >= 108) return 'S — MASTER INVESTIGATOR';
  if (total >= 96) return 'A — SENIOR INVESTIGATOR';
  if (total >= 84) return 'B — INVESTIGATOR';
  if (total >= 72) return 'C — JUNIOR INVESTIGATOR';
  if (total >= 60) return 'D — TRAINEE';
  return 'F — CASE DISMISSED';
}

function summaryQuality(summary: string, keyTerms: string[]): number {
  const lower = summary.toLowerCase();
  const hits = keyTerms.filter((t) => lower.includes(t.toLowerCase())).length;
  if (hits >= Math.min(4, keyTerms.length)) return 5;
  if (hits >= 2) return 3;
  return 1;
}

function timelineAccuracy(
  playerOrder: string[],
  canonicalIds: string[],
): number {
  if (!canonicalIds.length) return 1;
  const rank = new Map(canonicalIds.map((id, i) => [id, i]));
  let pairs = 0;
  let correct = 0;
  const filtered = playerOrder.filter((id) => rank.has(id));
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      pairs++;
      const ri = rank.get(filtered[i])!;
      const rj = rank.get(filtered[j])!;
      if (ri < rj) correct++;
    }
  }
  if (!pairs) return 0;
  return correct / pairs;
}

export function buildVerdict(args: {
  caseDef: CaseDefinition;
  evidenceById: Map<string, CaseEvidenceItem>;
  employees: Record<string, EmployeeProfile>;
  accusation: AccusationSubmission;
  taggedToSuspect: Record<string, string[]>;
  screenshotCount: number;
  timelineEvidenceOrder: string[];
  summaryKeyTerms: string[];
}): VerdictResult {
  const {
    caseDef,
    evidenceById,
    employees,
    accusation,
    taggedToSuspect,
    screenshotCount,
    timelineEvidenceOrder,
    summaryKeyTerms,
  } = args;

  const correctSuspect = accusation.suspectId === caseDef.guiltyEmployeeId;
  const correctMotive = accusation.motive === caseDef.correctMotive;
  const correctIncident = accusation.incidentType === caseDef.correctIncidentType;

  const foundSet = new Set(taggedToSuspect[caseDef.guiltyEmployeeId] ?? []);
  const total = caseDef.scoringEvidenceIds.length;
  const foundCount = caseDef.scoringEvidenceIds.filter((id) =>
    foundSet.has(id),
  ).length;
  const ratio = total ? foundCount / total : 0;
  const evidenceScore = Math.round(ratio * 30);

  let screenshotScore = 0;
  if (screenshotCount >= 4) screenshotScore = 5;
  else if (screenshotCount >= 2) screenshotScore = 3;

  const tlAcc = timelineAccuracy(
    timelineEvidenceOrder,
    caseDef.scoringEvidenceIds,
  );
  const timelinePoints = Math.round(tlAcc * 10);

  const summaryQualityScore = summaryQuality(accusation.summary, summaryKeyTerms);

  let totalScore = 0;
  if (correctSuspect) totalScore += 40;
  if (correctMotive) totalScore += 20;
  if (correctIncident) totalScore += 10;
  totalScore += evidenceScore + screenshotScore + timelinePoints + summaryQualityScore;

  const missed = caseDef.scoringEvidenceIds
    .filter((id) => !foundSet.has(id))
    .map((id) => {
      const ev = evidenceById.get(id);
      return {
        title: ev?.title ?? id,
        location: ev?.locationHint ?? '',
        command: ev?.commandHint,
      };
    });

  const guilty = employees[caseDef.guiltyEmployeeId];

  const wrongReveal =
    !correctSuspect && accusation.suspectId
      ? {
          name: employees[accusation.suspectId]?.fullName ?? '',
          avatarId: employees[accusation.suspectId]?.avatarId ?? 'AVATAR_M1',
        }
      : undefined;

  const actualPerp = !correctSuspect && guilty
    ? { name: guilty.fullName, avatarId: guilty.avatarId }
    : undefined;

  const allKeyForActual: VerdictResult['allKeyEvidenceForActual'] =
    !correctSuspect
      ? caseDef.scoringEvidenceIds.map((id) => {
          const ev = evidenceById.get(id)!;
          return {
            title: ev.title,
            location: ev.locationHint,
            command: ev.commandHint,
          };
        })
      : undefined;

  return {
    correctSuspect,
    correctMotive,
    correctIncident,
    evidenceFoundRatio: ratio,
    evidenceScore,
    screenshotScore,
    timelineAccuracy: tlAcc,
    summaryQualityScore,
    totalScore,
    grade: gradeFromScore(totalScore),
    missedEvidence: missed,
    revealWrongSuspect: wrongReveal,
    actualPerpetrator: actualPerp,
    missedCluesSummary: !correctSuspect && guilty
      ? `The strongest artifacts tied ${guilty.fullName} to after-hours access, bulk transfers, and mailbox rule changes. Review forwarding rules, USB history, and badge anomalies early—they often converge on the same narrow time window.`
      : undefined,
    allKeyEvidenceForActual: allKeyForActual,
  };
}
