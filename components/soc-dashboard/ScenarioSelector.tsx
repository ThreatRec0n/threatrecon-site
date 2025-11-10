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

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface ScenarioType {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  skillAreas: string[];
  estimatedTime: number; // minutes
}

const SCENARIO_TYPES: ScenarioType[] = [
  { 
    id: 'insider-threat', 
    name: 'Insider Threat', 
    description: 'Data exfiltration by legitimate user account',
    difficulty: 'beginner',
    skillAreas: ['Log Triage', 'User Behavior Analysis'],
    estimatedTime: 15,
  },
  { 
    id: 'credential-harvesting', 
    name: 'Credential Harvesting', 
    description: 'Steal credentials and use for lateral movement',
    difficulty: 'beginner',
    skillAreas: ['Log Triage', 'IR'],
    estimatedTime: 20,
  },
  { 
    id: 'phishing-malware-dropper', 
    name: 'Phishing with Malware Dropper', 
    description: 'Multi-stage phishing delivering malware via attachments',
    difficulty: 'beginner',
    skillAreas: ['Threat Hunting', 'Log Triage'],
    estimatedTime: 25,
  },
  { 
    id: 'ransomware-deployment', 
    name: 'Ransomware Deployment', 
    description: 'Full ransomware attack chain',
    difficulty: 'intermediate',
    skillAreas: ['IR', 'Threat Hunting'],
    estimatedTime: 30,
  },
  { 
    id: 'apt-persistence', 
    name: 'APT Persistence', 
    description: 'Advanced persistent threat establishing long-term access',
    difficulty: 'intermediate',
    skillAreas: ['Threat Hunting', 'MITRE ATT&CK'],
    estimatedTime: 35,
  },
  { 
    id: 'bec-compromise', 
    name: 'BEC (Business Email Compromise)', 
    description: 'Sophisticated BEC attack targeting financial transactions',
    difficulty: 'intermediate',
    skillAreas: ['IR', 'Threat Intelligence'],
    estimatedTime: 40,
  },
  { 
    id: 'cloud-misconfiguration', 
    name: 'Cloud Misconfiguration Breach', 
    description: 'Attack exploiting cloud infrastructure misconfigurations',
    difficulty: 'intermediate',
    skillAreas: ['Cloud Security', 'IR'],
    estimatedTime: 35,
  },
  { 
    id: 'insider-sabotage', 
    name: 'Insider Sabotage', 
    description: 'Malicious insider performing destructive actions',
    difficulty: 'intermediate',
    skillAreas: ['IR', 'User Behavior Analysis'],
    estimatedTime: 30,
  },
  { 
    id: 'ransomware-lockbit', 
    name: 'LockBit – Ransomware', 
    description: 'Complete ransomware deployment from phishing to encryption',
    difficulty: 'advanced',
    skillAreas: ['IR', 'Threat Hunting', 'MITRE ATT&CK'],
    estimatedTime: 45,
  },
  { 
    id: 'apt29-cozy-bear', 
    name: 'APT29 – Advanced Threat', 
    description: 'Multi-day APT campaign with credential dumping and lateral movement',
    difficulty: 'advanced',
    skillAreas: ['Threat Hunting', 'MITRE ATT&CK', 'Threat Intelligence'],
    estimatedTime: 60,
  },
  { 
    id: 'supply-chain-compromise', 
    name: 'Supply Chain Compromise', 
    description: 'Attack through compromised third-party software',
    difficulty: 'advanced',
    skillAreas: ['Threat Hunting', 'IR', 'Threat Intelligence'],
    estimatedTime: 50,
  },
];

export default function ScenarioSelector({ isOpen, onClose, onRegenerate }: Props) {
  const [selectedType, setSelectedType] = useState('insider-threat');
  const [stages, setStages] = useState(7);
  const [noiseLevel, setNoiseLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');

  const handleRegenerate = () => {
    const noiseCount = noiseLevel === 'low' ? 25 : noiseLevel === 'medium' ? 50 : 100;
    onRegenerate({
      story_type: selectedType,
      stages,
      noise_level: noiseLevel,
    });
    onClose();
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-900/40 text-green-400 border-green-800/60';
      case 'intermediate': return 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60';
      case 'advanced': return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
      case 'expert': return 'bg-red-900/40 text-red-400 border-red-800/60';
      default: return 'bg-gray-700/40 text-gray-400 border-gray-600/60';
    }
  };

  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner': return '🟢 Beginner';
      case 'intermediate': return '🟡 Intermediate';
      case 'advanced': return '🟠 Advanced';
      case 'expert': return '🔴 Expert';
      default: return '';
    }
  };

  const filteredScenarios = difficultyFilter === 'all' 
    ? SCENARIO_TYPES 
    : SCENARIO_TYPES.filter(s => s.difficulty === difficultyFilter);

  // Recommended path for new users
  const recommendedPath = [
    { id: 'insider-threat', reason: 'Start here - Simple scenario with clear indicators' },
    { id: 'credential-harvesting', reason: 'Learn credential-based attacks' },
    { id: 'phishing-malware-dropper', reason: 'Understand multi-stage phishing' },
    { id: 'ransomware-deployment', reason: 'Intermediate ransomware investigation' },
    { id: 'apt29-cozy-bear', reason: 'Advanced - Multi-day APT campaign' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
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
          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-3">
              Filter by Difficulty
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-3 py-2 text-sm rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] ${
                    difficultyFilter === level
                      ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]'
                      : 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff]/50'
                  }`}
                  aria-label={`Filter scenarios by ${level} difficulty`}
                >
                  {level === 'all' ? 'All Levels' : getDifficultyBadge(level)}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Path */}
          {difficultyFilter === 'all' && (
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">📚 Recommended Learning Path</h3>
              <ol className="text-xs text-[#c9d1d9] space-y-1 list-decimal list-inside">
                {recommendedPath.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-[#8b949e]">
                    <span className="text-[#c9d1d9]">{SCENARIO_TYPES.find(s => s.id === item.id)?.name}</span> - {item.reason}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Scenario Type */}
          <div>
            <label className="block text-sm font-semibold text-[#c9d1d9] mb-3">
              Scenario Type ({filteredScenarios.length} available)
            </label>
            <div className="space-y-2">
              {filteredScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedType(scenario.id)}
                  className={`w-full text-left p-3 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] ${
                    selectedType === scenario.id
                      ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]'
                      : 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff]/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-sm">{scenario.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${getDifficultyColor(scenario.difficulty)}`}>
                      {getDifficultyBadge(scenario.difficulty)}
                    </span>
                  </div>
                  <div className="text-xs text-[#8b949e] mt-1">{scenario.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#8b949e]">
                    <span>⏱️ ~{scenario.estimatedTime} min</span>
                    <span>•</span>
                    <span>{scenario.skillAreas.join(', ')}</span>
                  </div>
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
                  aria-label={`Set noise level to ${level}`}
                  aria-pressed={noiseLevel === level}
                  title={`${level === 'low' ? 'Easier to spot malicious activity' : level === 'medium' ? 'Realistic mix of normal and malicious' : 'Challenging - lots of background noise'}`}
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

