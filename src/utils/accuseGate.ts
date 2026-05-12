import type { CaseEvidenceItem } from '@/types/case.types';
import type { TaggedEvidence } from '@/contexts/EvidenceContext';

export function accuseThresholdMet(args: {
  tagged: TaggedEvidence[];
  screenshotsCount: number;
  notebookNotes: Record<string, string>;
  evidenceById: Map<string, CaseEvidenceItem>;
}): { ok: boolean; suspectId?: string; reasons: string[] } {
  const { tagged, screenshotsCount, notebookNotes, evidenceById } = args;
  const reasons: string[] = [];

  const bySuspect = new Map<string, TaggedEvidence[]>();
  for (const t of tagged) {
    const arr = bySuspect.get(t.suspectId) ?? [];
    arr.push(t);
    bySuspect.set(t.suspectId, arr);
  }

  let candidate: string | undefined;
  let max = 0;
  for (const [sid, arr] of bySuspect) {
    const distinct = new Set(arr.map((a) => a.evidenceId)).size;
    if (distinct > max) {
      max = distinct;
      candidate = sid;
    }
  }

  if (max < 5) {
    reasons.push('Tag at least 5 distinct evidence items to one suspect.');
  }
  if (screenshotsCount < 2) {
    reasons.push('Capture and save at least 2 labeled screenshots.');
  }

  const sources = new Set<string>();
  for (const t of tagged) {
    const ev = evidenceById.get(t.evidenceId);
    if (ev) sources.add(ev.source);
  }
  if (sources.size < 3) {
    reasons.push('Use evidence from at least 3 different sources (tabs/tools).');
  }

  if (max >= 5) {
    const notesOk =
      candidate &&
      (notebookNotes[candidate]?.trim().length ?? 0) > 0;
    if (!notesOk) {
      reasons.push(
        'Add notebook notes for the suspect with five or more tagged evidence items.',
      );
    }
  }

  const notesOk =
    candidate &&
    max >= 5 &&
    (notebookNotes[candidate]?.trim().length ?? 0) > 0;

  const ok =
    max >= 5 &&
    screenshotsCount >= 2 &&
    sources.size >= 3 &&
    Boolean(notesOk);

  return { ok, suspectId: candidate && max >= 5 ? candidate : undefined, reasons };
}
