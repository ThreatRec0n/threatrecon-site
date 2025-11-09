'use client';

import { useState, useEffect } from 'react';

interface ScenarioProgress {
  'apt29-cozy-bear': boolean;
  'ransomware-lockbit': boolean;
  'insider-threat': boolean;
  'credential-harvesting': boolean;
  'ransomware-deployment': boolean;
}

const SCENARIO_NAMES: Record<keyof ScenarioProgress, string> = {
  'apt29-cozy-bear': 'APT29 – Advanced Threat',
  'ransomware-lockbit': 'LockBit – Ransomware',
  'insider-threat': 'Insider Threat',
  'credential-harvesting': 'Credential Harvesting',
  'ransomware-deployment': 'Ransomware Deployment',
};

export default function ProgressTracker() {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<ScenarioProgress>({
    'apt29-cozy-bear': false,
    'ransomware-lockbit': false,
    'insider-threat': false,
    'credential-harvesting': false,
    'ransomware-deployment': false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('threatrecon_scenario_progress');
      if (stored) {
        try {
          setProgress(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse progress:', e);
        }
      }
    }
  }, []);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = Object.keys(progress).length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const handleReset = () => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      const reset: ScenarioProgress = {
        'apt29-cozy-bear': false,
        'ransomware-lockbit': false,
        'insider-threat': false,
        'credential-harvesting': false,
        'ransomware-deployment': false,
      };
      setProgress(reset);
      if (typeof window !== 'undefined') {
        localStorage.setItem('threatrecon_scenario_progress', JSON.stringify(reset));
      }
    }
  };

  return (
    <>
      {/* Progress Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
        aria-label="View Progress"
      >
        📊 Progress
        {completedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#58a6ff] text-white text-xs rounded-full flex items-center justify-center">
            {completedCount}
          </span>
        )}
      </button>

      {/* Progress Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-title"
          >
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-md w-full shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
                <h2 id="progress-title" className="text-xl font-bold text-[#c9d1d9]">
                  Scenario Progress
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#8b949e] hover:text-[#c9d1d9] text-xl focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded p-1"
                  aria-label="Close Progress"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Summary */}
                <div className="text-center p-4 bg-[#0d1117] rounded border border-[#30363d]">
                  <div className="text-3xl font-bold text-[#58a6ff] mb-1">
                    {completedCount} / {totalCount}
                  </div>
                  <div className="text-sm text-[#8b949e]">
                    Scenarios Completed
                  </div>
                  <div className="mt-3 w-full bg-[#161b22] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#58a6ff] transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-[#8b949e] mt-2">{percentage}% Complete</div>
                </div>

                {/* Scenario List */}
                <div className="space-y-2">
                  {Object.entries(SCENARIO_NAMES).map(([key, name]) => {
                    const isCompleted = progress[key as keyof ScenarioProgress];
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3 rounded border ${
                          isCompleted
                            ? 'bg-green-900/20 border-green-800/40'
                            : 'bg-[#0d1117] border-[#30363d]'
                        }`}
                      >
                        <span className={`text-sm ${isCompleted ? 'text-green-400' : 'text-[#8b949e]'}`}>
                          {name}
                        </span>
                        <span className="text-lg">
                          {isCompleted ? '✓' : '○'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Reset Button */}
                {completedCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="w-full px-4 py-2 rounded border text-sm transition-colors bg-red-900/20 text-red-400 border-red-800/40 hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Reset Progress
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Helper function to mark scenario as completed
export function markScenarioCompleted(scenarioType: string) {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem('threatrecon_scenario_progress');
    const progress: ScenarioProgress = stored
      ? JSON.parse(stored)
      : {
          'apt29-cozy-bear': false,
          'ransomware-lockbit': false,
          'insider-threat': false,
          'credential-harvesting': false,
          'ransomware-deployment': false,
        };

    // Map scenario types to progress keys
    const keyMap: Record<string, keyof ScenarioProgress> = {
      'apt29-cozy-bear': 'apt29-cozy-bear',
      'ransomware-lockbit': 'ransomware-lockbit',
      'insider-threat': 'insider-threat',
      'credential-harvesting': 'credential-harvesting',
      'ransomware-deployment': 'ransomware-deployment',
    };

    const key = keyMap[scenarioType];
    if (key) {
      progress[key] = true;
      localStorage.setItem('threatrecon_scenario_progress', JSON.stringify(progress));
    }
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

