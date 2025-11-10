'use client';

import Link from 'next/link';

import { useState, useEffect, useMemo } from 'react';
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
  const [timeFilter, setTimeFilter] = useState<'all-time' | 'monthly'>('all-time');
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<'score' | 'time' | 'scenario' | 'skill' | 'date'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const scenarioNames: Record<string, string> = {
    'apt29-cozy-bear': 'APT29',
    'ransomware-lockbit': 'LockBit',
    'insider-threat': 'Insider Threat',
    'credential-harvesting': 'Credential Harvesting',
    'ransomware-deployment': 'Ransomware',
    'bec-compromise': 'BEC',
    'phishing-malware-dropper': 'Phishing Dropper',
    'insider-sabotage': 'Insider Sabotage',
    'cloud-misconfiguration': 'Cloud Breach',
    'supply-chain-compromise': 'Supply Chain',
  };

  const allScenarios = Array.from(new Set(leaderboard.map(e => e.scenario)));

  // Filter and sort leaderboard
  const filteredAndSorted = useMemo(() => {
    let filtered = [...leaderboard];

    // Time filter (monthly vs all-time)
    if (timeFilter === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= oneMonthAgo);
    }

    // Scenario filter
    if (scenarioFilter !== 'all') {
      filtered = filtered.filter(entry => entry.scenario === scenarioFilter);
    }

    // Skill filter
    if (skillFilter !== 'all') {
      filtered = filtered.filter(entry => {
        if (skillFilter === 'commander') return entry.skillLevel.includes('Commander');
        if (skillFilter === 'hunter') return entry.skillLevel.includes('Hunter');
        if (skillFilter === 'analyst') return entry.skillLevel.includes('Analyst');
        if (skillFilter === 'training') return entry.skillLevel.includes('Training');
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'time':
          comparison = a.time - b.time;
          break;
        case 'scenario':
          comparison = (scenarioNames[a.scenario] || a.scenario).localeCompare(scenarioNames[b.scenario] || b.scenario);
          break;
        case 'skill':
          comparison = a.skillLevel.localeCompare(b.skillLevel);
          break;
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [leaderboard, timeFilter, scenarioFilter, skillFilter, sortColumn, sortDirection]);

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleViewInvestigation = (entry: LeaderboardEntry) => {
    // Placeholder - could link to investigation details or replay
    alert(`Investigation details for ${scenarioNames[entry.scenario] || entry.scenario} - Score: ${entry.score}/100 - Time: ${formatTime(entry.time)}\n\nThis feature will show full investigation replay in a future update.`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">🏆 Leaderboard</h1>
            <p className="text-[#8b949e]">Top performances in timed challenge mode</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {leaderboard.length > 0 && (
              <button
                onClick={() => setShowReset(!showReset)}
                className="px-4 py-2 text-sm rounded border border-red-800/40 text-red-400 hover:bg-red-900/20 transition-colors"
                aria-label="Reset Leaderboard"
              >
                Reset Leaderboard
              </button>
            )}
            <button
              onClick={() => router.push('/simulation')}
              className="px-4 py-2 text-sm rounded border border-[#30363d] text-[#c9d1d9] hover:bg-[#161b22] transition-colors"
              aria-label="Return to Dashboard"
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

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Time Period
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter('all-time')}
                className={`flex-1 px-3 py-2 text-sm rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] ${
                  timeFilter === 'all-time'
                    ? 'bg-[#58a6ff] text-white border-[#58a6ff]'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
                }`}
                aria-label="Filter leaderboard to show all-time results"
                title="Show all-time leaderboard entries"
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter('monthly')}
                className={`flex-1 px-3 py-2 text-sm rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] ${
                  timeFilter === 'monthly'
                    ? 'bg-[#58a6ff] text-white border-[#58a6ff]'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
                }`}
                aria-label="Filter leaderboard to show monthly results"
                title="Show leaderboard entries from this month only"
              >
                This Month
              </button>
            </div>
          </div>

          {/* Scenario Filter */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Scenario Type
            </label>
            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
            >
              <option value="all">All Scenarios</option>
              {allScenarios.map(scenario => (
                <option key={scenario} value={scenario}>
                  {scenarioNames[scenario] || scenario}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Filter */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Skill Badge
            </label>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
            >
              <option value="all">All Levels</option>
              <option value="commander">🔥 Incident Commander</option>
              <option value="hunter">🕵️‍♂️ Threat Hunter</option>
              <option value="analyst">🛡️ SOC Analyst</option>
              <option value="training">📚 Analyst in Training</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'time' | 'combined')}
              className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
            >
              <option value="combined">Score + Time</option>
              <option value="score">Score</option>
              <option value="time">Time</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        {filteredAndSorted.length > 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0d1117] border-b border-[#30363d]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Rank</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-[#58a6ff] transition-colors"
                      onClick={() => handleSort('score')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('score')}
                      aria-label="Sort by Score"
                    >
                      Score {sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-[#58a6ff] transition-colors"
                      onClick={() => handleSort('time')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('time')}
                      aria-label="Sort by Time"
                    >
                      Time {sortColumn === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-[#58a6ff] transition-colors"
                      onClick={() => handleSort('scenario')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('scenario')}
                      aria-label="Sort by Scenario"
                    >
                      Scenario {sortColumn === 'scenario' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-[#58a6ff] transition-colors"
                      onClick={() => handleSort('skill')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('skill')}
                      aria-label="Sort by Skill Level"
                    >
                      Skill Level {sortColumn === 'skill' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase cursor-pointer hover:text-[#58a6ff] transition-colors"
                      onClick={() => handleSort('date')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSort('date')}
                      aria-label="Sort by Date"
                    >
                      Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((entry, index) => (
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
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewInvestigation(entry)}
                          className="px-3 py-1.5 text-xs rounded border border-[#30363d] text-[#58a6ff] hover:bg-[#58a6ff]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                          aria-label={`View investigation for ${scenarioNames[entry.scenario] || entry.scenario}`}
                        >
                          View Details
                        </button>
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
              {timeFilter === 'monthly' 
                ? 'No entries found for this month. Complete investigations in timed mode to appear on the leaderboard!'
                : 'Complete investigations in timed mode to appear on the leaderboard!'}
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
