'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (config: {
    story_type: string;
    stages: number;
    noise_level: 'low' | 'medium' | 'high';
  }) => void;
}

const SCENARIO_TYPES = [
  { id: 'apt29-cozy-bear', name: 'APT29 – Advanced Threat', description: 'Multi-day APT campaign with credential dumping and lateral movement' },
  { id: 'ransomware-lockbit', name: 'LockBit – Ransomware', description: 'Complete ransomware deployment from phishing to encryption' },
  { id: 'insider-threat', name: 'Insider Threat', description: 'Data exfiltration by legitimate user account' },
  { id: 'credential-harvesting', name: 'Credential Harvesting', description: 'Steal credentials and use for lateral movement' },
  { id: 'ransomware-deployment', name: 'Ransomware Deployment', description: 'Full ransomware attack chain' },
];

export default function ScenarioSelector({ isOpen, onClose, onRegenerate }: Props) {
  const [selectedType, setSelectedType] = useState('apt29-cozy-bear');
  const [stages, setStages] = useState(7);
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const handleRegenerate = () => {
    const noiseCount = noiseLevel === 'low' ? 25 : noiseLevel === 'medium' ? 50 : 100;
    onRegenerate({
      story_type: selectedType,
      stages,
      noise_level: noiseLevel,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-[#161b22] border-l border-[#30363d] shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-selector-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22] z-10">
          <h2 id="scenario-selector-title" className="text-xl font-bold text-[#c9d1d9]">
            🧬 Scenario Settings
          </h2>
          <button
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            className="text-[#8b949e] hover:text-[#c9d1d9] text-xl focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded p-1"
            aria-label="Close Scenario Selector"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scenario Type */}
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-3">
              Scenario Type
            </label>
            <div className="space-y-2">
              {SCENARIO_TYPES.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedType(scenario.id)}
                  className={`w-full text-left p-3 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] ${
                    selectedType === scenario.id
                      ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]'
                      : 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff]/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{scenario.name}</div>
                  <div className="text-xs text-[#8b949e] mt-1">{scenario.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Attack Stages */}
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-3">
              Attack Stages: <span className="text-[#58a6ff]">{stages}</span>
            </label>
            <input
              type="range"
              min="4"
              max="10"
              value={stages}
              onChange={(e) => setStages(parseInt(e.target.value))}
              className="w-full h-2 bg-[#0d1117] rounded-lg appearance-none cursor-pointer accent-[#58a6ff]"
              aria-label="Number of attack stages"
            />
            <div className="flex justify-between text-xs text-[#8b949e] mt-1">
              <span>4 (Beginner)</span>
              <span>10 (Advanced)</span>
            </div>
          </div>

          {/* Noise Level */}
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-3">
              Noise Level
            </label>
            <div className="space-y-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setNoiseLevel(level)}
                  className={`w-full text-left p-3 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] ${
                    noiseLevel === level
                      ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]'
                      : 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff]/50'
                  }`}
                >
                  <div className="font-semibold text-sm capitalize">
                    {level === 'low' && '🔇 Low (25 benign events)'}
                    {level === 'medium' && '🔊 Medium (50 benign events)'}
                    {level === 'high' && '📢 High (100 benign events)'}
                  </div>
                  <div className="text-xs text-[#8b949e] mt-1">
                    {level === 'low' && 'Easier to spot malicious activity'}
                    {level === 'medium' && 'Realistic mix of normal and malicious'}
                    {level === 'high' && 'Challenging - lots of background noise'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#30363d]">
          <button
            onClick={handleRegenerate}
            className="w-full px-4 py-3 rounded text-sm font-semibold transition-colors bg-[#58a6ff] text-white hover:bg-[#4493f8] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            Regenerate Simulation
          </button>
        </div>
      </div>
    </>
  );
}

