'use client';

import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';
import type { EvaluationResult } from '@/lib/evaluation-engine';
import type { CaseNote } from './CaseNotes';
import type { EvidenceItem } from './EvidenceBinder';

interface Props {
  scenarioName: string;
  scenarioId: string;
  notes: CaseNote[];
  evidence: EvidenceItem[];
  events: SimulatedEvent[];
  evaluationResult: EvaluationResult | null;
  iocTags: Record<string, string>;
  onExport: (format: string) => void;
}

export default function ReportExport({
  scenarioName,
  scenarioId,
  notes,
  evidence,
  events,
  evaluationResult,
  iocTags,
  onExport,
}: Props) {
  return (
    <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
      <h3 className="text-lg font-semibold text-white mb-4">Report Export</h3>
      <p className="text-gray-400 text-sm">Report export functionality coming soon.</p>
    </div>
  );
}

