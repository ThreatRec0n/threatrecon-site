'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  score: number;
  time: number;
  scenario: string;
  timestamp: string;
  skillLevel: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'combined'>('combined');
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('threatrecon_leaderboard');
      const entries: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];
      setLeaderboard(entries);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the leaderboard? This cannot be undone.')) {
      localStorage.removeItem('threatrecon_leaderboard');
      setLeaderboard([]);
      setShowReset(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSkillEmoji = (level: string) => {
    if (level.includes('Commander')) return '🔥';
    if (level.includes('Hunter')) return '🕵️‍♂️';
    if (level.includes('Analyst')) return '🛡️';
    return '📚';
  };

  const getSkillColor = (level: string) => {
    if (level.includes('Commander')) return 'text-red-400';
    if (level.includes('Hunter')) return 'text-purple-400';
    if (level.includes('Analyst')) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else if (sortBy === 'time') {
      return a.time - b.time;
    } else {
      // Combined: score first, then time
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    }
  });

  const scenarioNames: Record<string, string> = {
    'apt29-cozy-bear': 'APT29',
    'ransomware-lockbit': 'LockBit',
    'insider-threat': 'Insider Threat',
    'credential-harvesting': 'Credential Harvesting',
    'ransomware-deployment': 'Ransomware',
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">🏆 Leaderboard</h1>
            <p className="text-[#8b949e]">Top performances in timed challenge mode</p>
          </div>
          <div className="flex items-center gap-2">
            {leaderboard.length > 0 && (
              <button
                onClick={() => setShowReset(!showReset)}
                className="px-4 py-2 text-sm rounded border border-red-800/40 text-red-400 hover:bg-red-900/20 transition-colors"
              >
                Reset Leaderboard
              </button>
            )}
            <button
              onClick={() => router.push('/simulation')}
              className="px-4 py-2 text-sm rounded border border-[#30363d] text-[#c9d1d9] hover:bg-[#161b22] transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Reset Confirmation */}
        {showReset && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/40 rounded">
            <p className="text-red-400 mb-2">Are you sure you want to reset the leaderboard?</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-900/40 text-red-400 rounded hover:bg-red-900/60 transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="px-4 py-2 bg-[#161b22] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#0d1117] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-[#8b949e]">Sort by:</span>
          <button
            onClick={() => setSortBy('combined')}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              sortBy === 'combined'
                ? 'bg-[#58a6ff] text-white border-[#58a6ff]'
                : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
            }`}
          >
            Score + Time
          </button>
          <button
            onClick={() => setSortBy('score')}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              sortBy === 'score'
                ? 'bg-[#58a6ff] text-white border-[#58a6ff]'
                : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
            }`}
          >
            Score
          </button>
          <button
            onClick={() => setSortBy('time')}
            className={`px-3 py-1 text-sm rounded border transition-colors ${
              sortBy === 'time'
                ? 'bg-[#58a6ff] text-white border-[#58a6ff]'
                : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
            }`}
          >
            Time
          </button>
        </div>

        {/* Leaderboard Table */}
        {leaderboard.length > 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0d1117] border-b border-[#30363d]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Scenario</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Skill Level</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((entry, index) => (
                    <tr
                      key={index}
                      className={`border-b border-[#30363d] ${
                        index < 3 ? 'bg-[#0d1117]' : 'hover:bg-[#0d1117]/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-400' :
                            'text-[#c9d1d9]'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${
                          entry.score >= 90 ? 'text-green-400' :
                          entry.score >= 70 ? 'text-yellow-400' :
                          entry.score >= 50 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          {entry.score}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[#c9d1d9]">
                        {formatTime(entry.time)}
                      </td>
                      <td className="px-6 py-4 text-[#c9d1d9]">
                        {scenarioNames[entry.scenario] || entry.scenario}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 ${getSkillColor(entry.skillLevel)}`}>
                          <span>{getSkillEmoji(entry.skillLevel)}</span>
                          <span className="text-sm">{entry.skillLevel}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#8b949e]">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-[#c9d1d9] mb-2">No Leaderboard Entries Yet</h2>
            <p className="text-[#8b949e] mb-6">
              Complete investigations in timed mode to appear on the leaderboard!
            </p>
            <button
              onClick={() => router.push('/simulation')}
              className="px-6 py-3 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
            >
              Start Timed Challenge
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
          <p className="text-sm text-[#c9d1d9]">
            <strong className="text-blue-400">💡 How to appear on the leaderboard:</strong> Enable "Timed Mode" 
            in the simulation dashboard, complete an investigation, and your score and completion time will be 
            automatically recorded. Leaderboard entries are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}

