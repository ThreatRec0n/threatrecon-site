import type { CaseEvidenceItem } from '@/types/case.types';
import type { CaseContent } from './caseData.types';
import { case001Content } from './case-001-resignation';
import { case002Content } from './case-002-leak';
import { case003Content } from './case-003-ghost';
import { case004Content } from './case-004-saboteur';

export const CASE_ORDER: string[] = [
  case001Content.definition.id,
  case002Content.definition.id,
  case003Content.definition.id,
  case004Content.definition.id,
];

const BUNDLES: Record<string, CaseContent> = {
  [case001Content.definition.id]: case001Content,
  [case002Content.definition.id]: case002Content,
  [case003Content.definition.id]: case003Content,
  [case004Content.definition.id]: case004Content,
};

export function getCaseContent(caseId: string): CaseContent | undefined {
  return BUNDLES[caseId];
}

export function evidenceMap(caseId: string): Map<string, CaseEvidenceItem> {
  const c = BUNDLES[caseId];
  const m = new Map<string, CaseEvidenceItem>();
  if (!c) return m;
  for (const e of c.evidenceItems) m.set(e.id, e);
  return m;
}
