import type { ScanInput, CandidateRecord, SiteAdapter } from '@/lib/types';
import { overallScore } from '@/lib/scoring';

export function evaluateCandidates(adapter: SiteAdapter, input: ScanInput, rawCandidates: any[]): CandidateRecord[] {
  const results: CandidateRecord[] = [];
  for (const c of rawCandidates) {
    const { matched, matchedFields, reason, confidence } = adapter.match(c, input);
    if (!matched) continue;
    const combined = overallScore(input, c);
    results.push({
      site: adapter.id,
      url: c.url,
      matchedAttribute: matchedFields[0] ?? input.type,
      confidence: Math.max(confidence, combined.score),
      reason: `${reason}; ${combined.reason}`.trim(),
    });
  }
  return results;
}

export function digitsFromPhone(e164?: string): string | undefined {
  if (!e164) return undefined;
  return e164.replace(/\D/g, '');
}
