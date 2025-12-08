'use client';

export interface CaseNote {
  id: string;
  timestamp: string;
  content: string;
}

interface Props {
  scenarioId: string;
  onNotesChange: (notes: CaseNote[]) => void;
}

export default function CaseNotes({ scenarioId, onNotesChange }: Props) {
  return (
    <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
      <h3 className="text-lg font-semibold text-white mb-4">Case Notes</h3>
      <p className="text-gray-400 text-sm">Case notes functionality coming soon.</p>
    </div>
  );
}

