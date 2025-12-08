'use client';

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  mitreTechniques: string[];
  query: string;
}

interface Props {
  onSave: (rule: DetectionRule) => void;
  onTest: (rule: DetectionRule) => void;
}

export default function DetectionRuleBuilder({ onSave, onTest }: Props) {
  return (
    <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
      <h3 className="text-lg font-semibold text-white mb-4">Detection Rule Builder</h3>
      <p className="text-gray-400 text-sm">Detection rule builder functionality coming soon.</p>
    </div>
  );
}

