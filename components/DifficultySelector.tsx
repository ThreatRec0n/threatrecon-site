'use client';

import { useState } from 'react';
import type { DifficultyLevel } from '@/lib/types';

interface Props {
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
}

const DIFFICULTY_INFO: Record<'beginner' | 'intermediate' | 'advanced', {
  title: string;
  description: string;
  timeLimit: number;
  maliciousIPs: number;
  features: string[];
  color: string;
}> = {
  beginner: {
    title: 'Beginner',
    description: 'Perfect for learning the basics',
    timeLimit: 30, // minutes
    maliciousIPs: 3,
    features: ['3 malicious IPs to find', '30 minutes', 'Helpful hints available', 'Detailed feedback'],
    color: 'bg-green-900/40 text-green-400 border-green-800/60',
  },
  intermediate: {
    title: 'Intermediate',
    description: 'For analysts with some experience',
    timeLimit: 20,
    maliciousIPs: 2,
    features: ['2 malicious IPs to find', '20 minutes', 'Limited hints', 'Basic feedback'],
    color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60',
  },
  advanced: {
    title: 'Advanced',
    description: 'Expert level - find the needle in the haystack',
    timeLimit: 15,
    maliciousIPs: 1,
    features: ['1 malicious IP to find', '15 minutes', 'No hints', 'No feedback'],
    color: 'bg-red-900/40 text-red-400 border-red-800/60',
  },
};

export default function DifficultySelector({ onSelectDifficulty }: Props) {
  const [selected, setSelected] = useState<DifficultyLevel | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#c9d1d9]">Threat Hunt Challenge</h1>
          <p className="text-lg text-[#8b949e]">
            Your organization has been compromised. Find the malicious IPs before ransomware deploys.
          </p>
          <p className="text-sm text-[#484f58]">
            Select your difficulty level to begin
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(['beginner', 'intermediate', 'advanced'] as const).map((difficulty) => {
            const info = DIFFICULTY_INFO[difficulty];
            return (
              <button
                key={difficulty}
                onClick={() => {
                  setSelected(difficulty);
                  setTimeout(() => onSelectDifficulty(difficulty), 300);
                }}
                className={`siem-card text-left transition-all hover:scale-105 ${
                  selected === difficulty ? 'ring-2 ring-[#58a6ff]' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-[#c9d1d9]">{info.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded border ${info.color}`}>
                      {info.timeLimit} min
                    </span>
                  </div>
                  <p className="text-sm text-[#8b949e]">{info.description}</p>
                  <div className="space-y-2 pt-2 border-t border-[#30363d]">
                    {info.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#8b949e]">
                        <span className="text-[#3fb950]">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

