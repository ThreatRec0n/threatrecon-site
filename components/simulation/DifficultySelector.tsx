'use client';

import { useState } from 'react';
import { Leaf, BarChart3, Target, Skull } from 'lucide-react';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface DifficultyOption {
  id: Difficulty;
  name: string;
  icon: any;
  description: string;
  stats: {
    events: number;
    alerts: number;
    iocs: string;
    sla: string;
  };
  recommended: string;
  color: string;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    icon: Leaf,
    description: 'Perfect for your first investigation. Clear threats, extended time limits, and helpful hints.',
    stats: {
      events: 100,
      alerts: 3,
      iocs: '5-8',
      sla: '2x normal (30min Critical)'
    },
    recommended: 'New to SOC analysis',
    color: 'green'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    icon: BarChart3,
    description: 'Real-world mix of threats and noise. Some false positives to challenge your analysis skills.',
    stats: {
      events: 500,
      alerts: 6,
      iocs: '15-20',
      sla: 'Normal (15min Critical)'
    },
    recommended: '6+ months SOC experience',
    color: 'blue'
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: Target,
    description: 'High-pressure environment with significant noise. Multiple false positives and time pressure.',
    stats: {
      events: 2000,
      alerts: 10,
      iocs: '30-40',
      sla: 'Strict (12min Critical)'
    },
    recommended: '1+ years SOC experience',
    color: 'orange'
  },
  {
    id: 'expert',
    name: 'Expert',
    icon: Skull,
    description: 'Enterprise chaos. Massive event volume, many false positives, extreme time pressure.',
    stats: {
      events: 5000,
      alerts: 20,
      iocs: '60-80',
      sla: 'Very Strict (7.5min Critical)'
    },
    recommended: 'Senior SOC Analyst',
    color: 'red'
  }
];

interface Props {
  onSelect: (difficulty: Difficulty) => void;
  defaultDifficulty?: Difficulty;
}

export function DifficultySelector({ onSelect, defaultDifficulty = 'intermediate' }: Props) {
  const [selected, setSelected] = useState<Difficulty>(defaultDifficulty);

  const handleSelect = (id: Difficulty) => {
    setSelected(id);
  };

  const handleStart = () => {
    onSelect(selected);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      green: isSelected ? 'border-green-500 bg-green-500/10' : 'border-gray-700 hover:border-green-500/50',
      blue: isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-500/50',
      orange: isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-orange-500/50',
      red: isSelected ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-red-500/50'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Select Difficulty</h1>
        <p className="text-gray-400 mb-8">Choose your challenge level. You can change this later.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {DIFFICULTIES.map((diff) => {
            const Icon = diff.icon;
            const isSelected = selected === diff.id;

            return (
              <button
                key={diff.id}
                onClick={() => handleSelect(diff.id)}
                className={`text-left p-6 rounded-lg border-2 transition-all ${getColorClasses(diff.color, isSelected)}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`w-8 h-8 ${isSelected ? `text-${diff.color}-400` : 'text-gray-400'}`} />
                  <div>
                    <h3 className="text-xl font-bold text-white">{diff.name}</h3>
                    {isSelected && (
                      <span className="text-xs text-green-400 font-semibold">SELECTED</span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-4 min-h-[60px]">{diff.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Events:</span>
                    <span className="text-white font-mono">{diff.stats.events}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Alerts:</span>
                    <span className="text-white font-mono">{diff.stats.alerts}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">IOCs:</span>
                    <span className="text-white font-mono">{diff.stats.iocs}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">SLA Time:</span>
                    <span className="text-white font-mono text-xs">{diff.stats.sla}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-400">
                    <span className="font-semibold">Recommended for:</span>
                    <br />
                    {diff.recommended}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Start Investigation
          </button>
        </div>
      </div>
    </div>
  );
}

