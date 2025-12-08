'use client';

export interface EvidenceItem {
  id: string;
  type: string;
  value: string;
  timestamp: string;
}

interface Props {
  scenarioId: string;
  onEvidenceChange: (evidence: EvidenceItem[]) => void;
}

export default function EvidenceBinder({ scenarioId, onEvidenceChange }: Props) {
  return (
    <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
      <h3 className="text-lg font-semibold text-white mb-4">Evidence Binder</h3>
      <p className="text-gray-400 text-sm">Evidence binder functionality coming soon.</p>
    </div>
  );
}

