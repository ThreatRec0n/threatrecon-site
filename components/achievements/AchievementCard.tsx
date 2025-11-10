'use client';

import type { AchievementDefinition } from '@/lib/achievements/definitions';

// Simple date formatting helper (avoiding date-fns dependency issues)
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

interface Props {
  achievement: AchievementDefinition & {
    unlocked: boolean;
    unlockedAt?: string | null;
    progress?: number;
  };
}

export default function AchievementCard({ achievement }: Props) {
  const { unlocked, unlockedAt, progress, requirement_value } = achievement;
  const progressPercent = progress && requirement_value
    ? Math.min((progress / requirement_value) * 100, 100)
    : 0;

  const tierColors = {
    bronze: 'bg-amber-900/40 text-amber-400 border-amber-800/60',
    silver: 'bg-gray-400/40 text-gray-300 border-gray-500/60',
    gold: 'bg-yellow-600/40 text-yellow-400 border-yellow-700/60',
    platinum: 'bg-purple-600/40 text-purple-400 border-purple-700/60',
  };

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all ${
        unlocked
          ? 'bg-[#161b22] border-green-800/60 shadow-lg shadow-green-900/20'
          : 'bg-[#0d1117] border-[#30363d] opacity-60'
      }`}
    >
      {/* Icon */}
      <div className="text-4xl mb-3 text-center filter grayscale-0">
        {unlocked ? achievement.icon : '🔒'}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div>
          <h3 className={`font-semibold text-sm mb-1 ${
            unlocked ? 'text-[#c9d1d9]' : 'text-[#8b949e]'
          }`}>
            {unlocked ? achievement.name : '???'}
          </h3>
          <p className={`text-xs ${
            unlocked ? 'text-[#8b949e]' : 'text-[#6e7681]'
          }`}>
            {unlocked ? achievement.description : 'Complete requirements to unlock'}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded border ${tierColors[achievement.tier]}`}>
            {achievement.tier}
          </span>
          <span className="text-[#58a6ff] font-semibold">
            +{achievement.points} pts
          </span>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && progress > 0 && !unlocked && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
              <span>Progress</span>
              <span>{progress}/{requirement_value}</span>
            </div>
            <div className="h-1.5 bg-[#30363d] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#58a6ff] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Unlock Date */}
        {unlocked && unlockedAt && (
          <p className="text-xs text-[#6e7681] mt-2">
            Unlocked {formatDistanceToNow(new Date(unlockedAt))}
          </p>
        )}
      </div>

      {/* Unlocked Badge */}
      {unlocked && (
        <div className="absolute top-2 right-2">
          <span className="text-green-400 text-lg">✓</span>
        </div>
      )}
    </div>
  );
}

