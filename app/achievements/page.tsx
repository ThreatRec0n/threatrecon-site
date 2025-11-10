'use client';

import { useEffect, useState } from 'react';
import AchievementCard from '@/components/achievements/AchievementCard';
import type { AchievementDefinition } from '@/lib/achievements/definitions';
import { getAchievementsByCategory } from '@/lib/achievements/definitions';

interface AchievementWithStatus extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt?: string | null;
  progress?: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unlocked: 0,
    totalPoints: 0,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();
      setAchievements(data.achievements || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories: Array<{ id: string; name: string; icon: string }> = [
    { id: 'milestone', name: 'Milestones', icon: '🎯' },
    { id: 'skill', name: 'Skills', icon: '⭐' },
    { id: 'speed', name: 'Speed', icon: '⚡' },
    { id: 'consistency', name: 'Consistency', icon: '📅' },
    { id: 'special', name: 'Special', icon: '🎁' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-[#161b22] rounded w-1/3"></div>
            <div className="h-24 bg-[#161b22] rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-[#161b22] rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-4">🏆 Achievements</h1>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#58a6ff]">{stats.unlocked}</div>
              <div className="text-sm text-[#8b949e]">Unlocked</div>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#58a6ff]">{stats.total}</div>
              <div className="text-sm text-[#8b949e]">Total</div>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#58a6ff]">{stats.totalPoints}</div>
              <div className="text-sm text-[#8b949e]">Points</div>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#58a6ff]">{stats.progress}%</div>
              <div className="text-sm text-[#8b949e]">Complete</div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.map(category => {
          const categoryAchievements = achievements.filter(
            a => a.category === category.id
          );
          
          if (categoryAchievements.length === 0) return null;

          return (
            <div key={category.id} className="mb-8">
              <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4 flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-sm text-[#8b949e] font-normal">
                  ({categoryAchievements.filter(a => a.unlocked).length}/{categoryAchievements.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryAchievements.map(achievement => (
                  <AchievementCard
                    key={achievement.slug}
                    achievement={achievement}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

