'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  username: string;
  level: number;
  totalScore: number;
  investigations: number;
  achievements: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = () => {
    // Load from localStorage (in production, this would be from API)
    const scores = JSON.parse(localStorage.getItem('threatrecon_scores') || '[]');
    const achievements = JSON.parse(localStorage.getItem('threatrecon_achievements') || '[]');
    
    // Aggregate user data
    const userData: Record<string, LeaderboardEntry> = {};
    
    scores.forEach((score: any) => {
      const username = score.username || 'Anonymous';
      if (!userData[username]) {
        userData[username] = {
          username,
          level: 1,
          totalScore: 0,
          investigations: 0,
          achievements: 0,
          rank: 0,
        };
      }
      userData[username].totalScore += score.score || 0;
      userData[username].investigations += 1;
    });

    // Count achievements
    achievements.forEach((ach: any) => {
      const username = ach.username || 'Anonymous';
      if (userData[username]) {
        userData[username].achievements += 1;
      }
    });

    // Calculate levels (simplified)
    Object.values(userData).forEach(entry => {
      entry.level = Math.floor(entry.investigations / 5) + 1;
    });

    // Sort by total score
    const sorted = Object.values(userData).sort((a, b) => b.totalScore - a.totalScore);
    
    // Add ranks
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(sorted);
    
    // Find user's rank (simplified - would use actual user ID in production)
    const userEntry = sorted.find(e => e.username === 'You' || e.username === 'Anonymous');
    setUserRank(userEntry ? userEntry.rank : null);
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400 mb-8">Compete with other analysts</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {(['global', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* User Rank Banner */}
        {userRank && (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Your Rank</div>
                <div className="text-2xl font-bold text-white">#{userRank}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Score</div>
                <div className="text-xl font-bold text-white">
                  {leaderboard.find(e => e.rank === userRank)?.totalScore || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Level</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total Score</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Investigations</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Achievements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No entries yet. Be the first!
                    </td>
                  </tr>
                ) : (
                  leaderboard.slice(0, 100).map((entry) => (
                    <tr
                      key={entry.username}
                      className={`hover:bg-gray-800/50 transition-colors ${
                        entry.rank === userRank ? 'bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getMedalIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{entry.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300">Level {entry.level}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">{entry.totalScore.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-300">{entry.investigations}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-300">{entry.achievements}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
