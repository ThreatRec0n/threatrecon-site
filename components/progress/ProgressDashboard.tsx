'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getUserLevel } from '@/lib/user/leveling-system';

interface InvestigationHistory {
  date: string;
  score: number;
  difficulty: string;
  timeTaken: number;
  scenario: string;
}

interface Props {
  onClose?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProgressDashboard({ onClose }: Props) {
  const [userLevel, setUserLevel] = useState(getUserLevel());
  const [history, setHistory] = useState<InvestigationHistory[]>([]);
  const [stats, setStats] = useState({
    totalInvestigations: 0,
    averageScore: 0,
    perfectScores: 0,
    currentStreak: 0,
    totalPlaytime: 0,
    favoriteDifficulty: 'Intermediate',
  });

  useEffect(() => {
    // Load investigation history from localStorage
    const scores = JSON.parse(localStorage.getItem('threatrecon_scores') || '[]');
    const leaderboard = JSON.parse(localStorage.getItem('threatrecon_leaderboard') || '[]');
    
    setHistory(scores.map((s: any) => ({
      date: new Date(s.timestamp).toLocaleDateString(),
      score: s.score,
      difficulty: s.difficulty || 'Intermediate',
      timeTaken: s.time || 0,
      scenario: s.scenario || 'Unknown',
    })));

    // Calculate stats
    const total = scores.length;
    const avgScore = total > 0 ? scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / total : 0;
    const perfect = scores.filter((s: any) => s.score === 100).length;
    
    // Calculate streak (simplified)
    const streak = calculateStreak(scores);
    
    // Calculate total playtime
    const playtime = leaderboard.reduce((sum: number, l: any) => sum + (l.time || 0), 0);
    
    // Most common difficulty
    const difficulties = scores.map((s: any) => s.difficulty || 'Intermediate');
    const difficultyCounts = difficulties.reduce((acc: Record<string, number>, d: string) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const favorite = Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Intermediate';

    setStats({
      totalInvestigations: total,
      averageScore: Math.round(avgScore * 10) / 10,
      perfectScores: perfect,
      currentStreak: streak,
      totalPlaytime: Math.floor(playtime / 60), // minutes
      favoriteDifficulty: favorite,
    });

    setUserLevel(getUserLevel());
  }, []);

  const calculateStreak = (scores: any[]): number => {
    if (scores.length === 0) return 0;
    
    // Sort by date descending
    const sorted = [...scores].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    let streak = 0;
    let lastDate = new Date();
    lastDate.setHours(0, 0, 0, 0);
    
    for (const score of sorted) {
      const scoreDate = new Date(score.timestamp);
      scoreDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((lastDate.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) continue; // Same day
      if (daysDiff === 1) {
        streak++;
        lastDate = scoreDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Prepare chart data
  const scoreTrendData = history.slice(-20).map((h, i) => ({
    name: `#${history.length - 20 + i + 1}`,
    score: h.score,
  }));

  const difficultyData = Object.entries(
    history.reduce((acc: Record<string, number>, h) => {
      acc[h.difficulty] = (acc[h.difficulty] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-6xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}

        <h1 className="text-3xl font-bold text-white mb-8">Progress Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Level</div>
            <div className="text-2xl font-bold text-white">
              {userLevel.level} - {userLevel.title}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {userLevel.xp} / {userLevel.xpToNextLevel} XP to next level
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Investigations</div>
            <div className="text-2xl font-bold text-white">{stats.totalInvestigations}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Average Score</div>
            <div className="text-2xl font-bold text-white">{stats.averageScore}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Perfect Scores</div>
            <div className="text-2xl font-bold text-green-400">{stats.perfectScores}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Current Streak</div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats.currentStreak} {stats.currentStreak > 0 && '🔥'}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Playtime</div>
            <div className="text-2xl font-bold text-white">{formatPlaytime(stats.totalPlaytime)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Score Trend</h3>
            {scoreTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center py-8">No data yet</div>
            )}
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Investigations by Difficulty</h3>
            {difficultyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-center py-8">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Investigations</h3>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.slice(0, 10).map((investigation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-24">{investigation.date}</span>
                    <span className="text-sm text-white">{investigation.scenario}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      investigation.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      investigation.difficulty === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
                      investigation.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {investigation.difficulty}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{investigation.score}/100</div>
                    {investigation.timeTaken > 0 && (
                      <div className="text-xs text-gray-400">
                        {Math.floor(investigation.timeTaken / 60)}m {investigation.timeTaken % 60}s
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">No investigations yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

