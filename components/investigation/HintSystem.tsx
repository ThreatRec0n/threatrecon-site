'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import type { Difficulty } from '@/components/simulation/DifficultySelector';

interface Hint {
  id: string;
  text: string;
  cost: number; // Points deducted for using hint
}

interface Props {
  difficulty: Difficulty;
  alertTitle?: string;
  alertType?: string;
  onHintUsed?: (cost: number) => void;
}

const BEGINNER_HINTS: Record<string, Hint[]> = {
  default: [
    {
      id: 'hint-1',
      text: 'PowerShell with -EncodedCommand is almost always suspicious',
      cost: 0,
    },
    {
      id: 'hint-2',
      text: 'Check if this IP is in your country - foreign IPs may be suspicious',
      cost: 0,
    },
    {
      id: 'hint-3',
      text: 'Multiple failed login attempts = potential brute force attack',
      cost: 0,
    },
  ],
  powershell: [
    {
      id: 'hint-powershell-1',
      text: 'Check the parent process - Excel or Word spawning PowerShell is suspicious',
      cost: 0,
    },
    {
      id: 'hint-powershell-2',
      text: 'Base64 encoded commands are commonly used to obfuscate malicious code',
      cost: 0,
    },
  ],
  credential_dump: [
    {
      id: 'hint-creds-1',
      text: 'LSASS memory access from non-system processes is a red flag',
      cost: 0,
    },
  ],
};

const INTERMEDIATE_HINTS: Record<string, Hint[]> = {
  default: [
    {
      id: 'hint-1',
      text: 'Look at the parent process of this execution',
      cost: 5,
    },
    {
      id: 'hint-2',
      text: 'Check network connections made within 5 minutes of this event',
      cost: 5,
    },
    {
      id: 'hint-3',
      text: 'Review the user account - is this behavior expected?',
      cost: 5,
    },
  ],
};

export function HintSystem({ difficulty, alertTitle, alertType, onHintUsed }: Props) {
  const [showHints, setShowHints] = useState(false);
  const [usedHints, setUsedHints] = useState<Set<string>>(new Set());
  const [hintCount, setHintCount] = useState(0);

  const maxHints = difficulty === 'beginner' ? 5 : difficulty === 'intermediate' ? 3 : 0;
  const hintsAvailable = maxHints - hintCount;

  const getHints = (): Hint[] => {
    if (difficulty === 'beginner') {
      return BEGINNER_HINTS[alertType || 'default'] || BEGINNER_HINTS.default;
    } else if (difficulty === 'intermediate') {
      return INTERMEDIATE_HINTS[alertType || 'default'] || INTERMEDIATE_HINTS.default;
    }
    return [];
  };

  const hints = getHints();
  const availableHints = hints.filter(h => !usedHints.has(h.id));

  const handleUseHint = (hint: Hint) => {
    if (hintCount >= maxHints) return;
    
    setUsedHints(prev => new Set(prev).add(hint.id));
    setHintCount(prev => prev + 1);
    
    if (onHintUsed && hint.cost > 0) {
      onHintUsed(hint.cost);
    }
  };

  if (difficulty === 'advanced' || difficulty === 'expert') {
    return null; // No hints for advanced/expert
  }

  if (hintsAvailable <= 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <span>No hints remaining</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">Hints Available</h3>
          <span className="text-sm text-gray-400">({hintsAvailable} remaining)</span>
        </div>
        <button
          onClick={() => setShowHints(!showHints)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showHints ? <X className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
        </button>
      </div>

      {showHints && (
        <div className="space-y-2">
          {availableHints.length === 0 ? (
            <p className="text-sm text-gray-400">All hints used</p>
          ) : (
            availableHints.map((hint) => (
              <button
                key={hint.id}
                onClick={() => handleUseHint(hint)}
                className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded border border-gray-700 hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-gray-300 flex-1">{hint.text}</span>
                  {hint.cost > 0 && (
                    <span className="text-xs text-yellow-400 font-semibold">
                      -{hint.cost} pts
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

