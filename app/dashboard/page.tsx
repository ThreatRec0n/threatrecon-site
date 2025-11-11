'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EvaluationResult } from '@/lib/evaluation-engine';

interface SimulationResult {
  scenario: string;
  score: number;
  timestamp: string;
  skill_level: string;
  time?: number;
}

interface ProgressStats {
  totalSimulations: number;
  averageScore: number;
  totalTime: number;
  completedScenarios: string[];
  scoresByScenario: Record<string, number[]>;
  skillLevelDistribution: Record<string, number>;
  recentResults: SimulationResult[];
  strengths: string[];
  weaknesses: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressStats();
  }, []);

  const loadProgressStats = () => {
    try {
      // Load scores
      const scores: SimulationResult[] = JSON.parse(
        localStorage.getItem('threatrecon_scores') || '[]'
      );

      // Load leaderboard entries (for timed mode results)
      const leaderboard: SimulationResult[] = JSON.parse(
        localStorage.getItem('threatrecon_leaderboard') || '[]'
      );

      // Load scenario progress
      const progress = JSON.parse(
        localStorage.getItem('threatrecon_scenario_progress') || '{}'
      );

      // Combine and process data
      const allResults = [...scores, ...leaderboard];
      const completedScenarios = Object.keys(progress).filter(
        key => progress[key] === true
      );

      // Calculate statistics
      const totalSimulations = allResults.length;
      const averageScore =
        totalSimulations > 0
          ? Math.round(
              allResults.reduce((sum, r) => sum + r.score, 0) / totalSimulations
            )
          : 0;
      const totalTime = allResults.reduce((sum, r) => sum + (r.time || 0), 0);

      // Scores by scenario
      const scoresByScenario: Record<string, number[]> = {};
      allResults.forEach(result => {
        if (!scoresByScenario[result.scenario]) {
          scoresByScenario[result.scenario] = [];
        }
        scoresByScenario[result.scenario].push(result.score);
      });

      // Skill level distribution
      const skillLevelDistribution: Record<string, number> = {};
      allResults.forEach(result => {
        const level = result.skill_level || 'Unknown';
        skillLevelDistribution[level] = (skillLevelDistribution[level] || 0) + 1;
      });

      // Recent results (last 10)
      const recentResults = allResults
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map((result: any) => ({
          ...result,
          // Try to find feedback ID from localStorage
          feedbackId: (() => {
            if (typeof window !== 'undefined') {
              const feedbackResults = JSON.parse(
                localStorage.getItem('threatrecon_feedback_results') || '[]'
              );
              // Find feedback by scenario and timestamp
              const feedback = feedbackResults.find((f: any) => 
                f.scenario_type === result.scenario &&
                Math.abs(new Date(f.completed_at).getTime() - new Date(result.timestamp).getTime()) < 60000
              );
              return feedback?.id || null;
            }
            return null;
          })(),
        }));

      // Calculate strengths and weaknesses (simplified)
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      Object.entries(scoresByScenario).forEach(([scenario, scenarioScores]) => {
        const avgScore = scenarioScores.reduce((a, b) => a + b, 0) / scenarioScores.length;
        if (avgScore >= 80 && scenarioScores.length >= 2) {
          strengths.push(scenario);
        } else if (avgScore < 50 && scenarioScores.length >= 2) {
          weaknesses.push(scenario);
        }
      });

      setStats({
        totalSimulations,
        averageScore,
        totalTime,
        completedScenarios,
        scoresByScenario,
        skillLevelDistribution,
        recentResults,
        strengths,
        weaknesses,
      });
    } catch (error) {
      console.error('Error loading progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-[#161b22] rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-[#161b22] rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-[#8b949e] mb-4">No progress data available yet.</p>
            <button
              onClick={() => router.push('/simulation')}
              className="px-4 py-2 bg-[#58a6ff] text-white rounded hover:bg-[#79c0ff] transition-colors"
            >
              Start Your First Simulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link 
            href="/simulation" 
            className="inline-flex items-center gap-2 text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors mb-4"
          >
            ← Back to Simulation
          </Link>
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">📊 Progress Dashboard</h1>
          <p className="text-[#8b949e]">Track your learning journey and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="text-sm text-[#8b949e] mb-2">Total Simulations</div>
            <div className="text-3xl font-bold text-[#58a6ff]">{stats.totalSimulations}</div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="text-sm text-[#8b949e] mb-2">Average Score</div>
            <div className="text-3xl font-bold text-green-400">{stats.averageScore}%</div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="text-sm text-[#8b949e] mb-2">Total Time</div>
            <div className="text-3xl font-bold text-yellow-400">
              {formatTime(stats.totalTime)}
            </div>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="text-sm text-[#8b949e] mb-2">Scenarios Completed</div>
            <div className="text-3xl font-bold text-purple-400">
              {stats.completedScenarios.length}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-900/10 border border-green-800/60 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              💪 Your Strengths
            </h3>
            {stats.strengths.length > 0 ? (
              <ul className="space-y-2">
                {stats.strengths.map(scenario => {
                  const avgScore = stats.scoresByScenario[scenario]
                    ? Math.round(
                        stats.scoresByScenario[scenario].reduce((a, b) => a + b, 0) /
                          stats.scoresByScenario[scenario].length
                      )
                    : 0;
                  return (
                    <li key={scenario} className="flex items-center justify-between">
                      <span className="text-sm text-[#c9d1d9] capitalize">
                        {scenario.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm font-semibold text-green-400">{avgScore}%</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-[#8b949e]">Keep practicing to identify your strengths!</p>
            )}
          </div>

          <div className="bg-red-900/10 border border-red-800/60 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              📚 Areas for Improvement
            </h3>
            {stats.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {stats.weaknesses.map(scenario => {
                  const avgScore = stats.scoresByScenario[scenario]
                    ? Math.round(
                        stats.scoresByScenario[scenario].reduce((a, b) => a + b, 0) /
                          stats.scoresByScenario[scenario].length
                      )
                    : 0;
                  return (
                    <li key={scenario} className="flex items-center justify-between">
                      <span className="text-sm text-[#c9d1d9] capitalize">
                        {scenario.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm font-semibold text-red-400">{avgScore}%</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-[#8b949e]">Great job! No major weaknesses identified.</p>
            )}
          </div>
        </div>

        {/* Skill Level Distribution */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Skill Level Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.skillLevelDistribution).map(([level, count]) => (
              <div key={level} className="text-center">
                <div className="text-2xl font-bold text-[#58a6ff]">{count}</div>
                <div className="text-sm text-[#8b949e]">{level}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Recent Results</h3>
          {stats.recentResults.length > 0 ? (
            <div className="space-y-2">
              {stats.recentResults.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#0d1117] rounded border border-[#30363d]"
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#c9d1d9] capitalize">
                      {result.scenario.replace(/-/g, ' ')}
                    </div>
                    <div className="text-xs text-[#8b949e]">
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {result.time && (
                      <div className="text-sm text-[#8b949e]">
                        ⏱️ {formatTime(result.time)}
                      </div>
                    )}
                    <div
                      className={`text-lg font-bold ${
                        result.score >= 90
                          ? 'text-green-400'
                          : result.score >= 70
                          ? 'text-yellow-400'
                          : result.score >= 50
                          ? 'text-orange-400'
                          : 'text-red-400'
                      }`}
                    >
                      {result.score}%
                    </div>
                    <div className="text-xs px-2 py-1 bg-[#0d1117] rounded border border-[#30363d] text-[#8b949e]">
                      {result.skill_level}
                    </div>
                    {result.feedbackId && (
                      <Link
                        href={`/simulation/feedback/${result.feedbackId}`}
                        className="px-3 py-1 text-xs bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
                      >
                        View Feedback
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8b949e] text-center py-8">No results yet. Start a simulation!</p>
          )}
        </div>

        {/* Scenario Progress */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Scenario Completion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.scoresByScenario).map(([scenario, scores]) => {
              const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              const isCompleted = stats.completedScenarios.includes(scenario);
              return (
                <div
                  key={scenario}
                  className={`p-4 rounded border ${
                    isCompleted
                      ? 'bg-green-900/10 border-green-800/60'
                      : 'bg-[#0d1117] border-[#30363d]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-[#c9d1d9] capitalize">
                      {scenario.replace(/-/g, ' ')}
                    </div>
                    {isCompleted && <span className="text-green-400">✓</span>}
                  </div>
                  <div className="text-xs text-[#8b949e] mb-2">
                    Attempts: {scores.length} | Avg: {avgScore}%
                  </div>
                  <div className="w-full bg-[#161b22] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#58a6ff] transition-all"
                      style={{ width: `${Math.min(avgScore, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => router.push('/simulation')}
            className="px-6 py-3 bg-[#58a6ff] text-white rounded hover:bg-[#79c0ff] transition-colors font-semibold"
          >
            Start New Simulation
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="px-6 py-3 bg-[#161b22] text-[#c9d1d9] rounded border border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors font-semibold"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

