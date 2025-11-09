'use client';

import { useState, useEffect } from 'react';
import { loadProgress, type UserProgress } from '@/lib/progress-tracking';

export default function ProgressTracker() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  const totalExperience = progress.experience;
  const currentLevel = progress.level;
  const experienceForNextLevel = currentLevel * 1000;
  const experienceInCurrentLevel = totalExperience % 1000;
  const progressPercent = (experienceInCurrentLevel / 1000) * 100;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-[#58a6ff] text-white rounded-full shadow-lg hover:bg-[#4493f8] transition-colors flex items-center justify-center text-2xl z-40"
        title="View Progress"
      >
        📊
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#c9d1d9]">Your Progress</h3>
              <button onClick={() => setIsOpen(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Level and Experience */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#8b949e]">Level {currentLevel}</span>
                  <span className="text-sm text-[#8b949e]">
                    {experienceInCurrentLevel} / {experienceForNextLevel} XP
                  </span>
                </div>
                <div className="w-full bg-[#0d1117] rounded-full h-3">
                  <div 
                    className="bg-[#58a6ff] h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                  <div className="text-xs text-[#8b949e] mb-1">Scenarios Completed</div>
                  <div className="text-2xl font-bold text-[#c9d1d9]">{progress.totalScenariosCompleted}</div>
                </div>
                <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                  <div className="text-xs text-[#8b949e] mb-1">Current Streak</div>
                  <div className="text-2xl font-bold text-[#c9d1d9]">{progress.currentStreak}</div>
                </div>
                <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                  <div className="text-xs text-[#8b949e] mb-1">Best Streak</div>
                  <div className="text-2xl font-bold text-[#c9d1d9]">{progress.longestStreak}</div>
                </div>
                <div className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                  <div className="text-xs text-[#8b949e] mb-1">Total Experience</div>
                  <div className="text-2xl font-bold text-[#c9d1d9]">{totalExperience}</div>
                </div>
              </div>

              {/* Skills by Difficulty */}
              {Object.keys(progress.skills).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3">Skills by Difficulty</h4>
                  <div className="space-y-3">
                    {Object.values(progress.skills).map((skill) => (
                      <div key={skill.difficulty} className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[#c9d1d9] capitalize">{skill.difficulty}</span>
                          <span className="text-xs text-[#8b949e]">{skill.scenariosCompleted} completed</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-[#8b949e]">Avg Score</div>
                            <div className="text-[#c9d1d9] font-semibold">{skill.averageScore}%</div>
                          </div>
                          <div>
                            <div className="text-[#8b949e]">Best Score</div>
                            <div className="text-[#c9d1d9] font-semibold">{skill.bestScore}%</div>
                          </div>
                          <div>
                            <div className="text-[#8b949e]">IPs Found</div>
                            <div className="text-[#c9d1d9] font-semibold">{skill.totalIPsFound}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {progress.badges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3">Achievements & Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {progress.badges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30 rounded"
                      >
                        {badge.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

