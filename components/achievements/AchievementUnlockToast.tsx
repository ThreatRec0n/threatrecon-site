'use client';

import { useEffect, useState } from 'react';
import type { AchievementDefinition } from '@/lib/achievements/definitions';

interface Props {
  achievement: AchievementDefinition;
  onClose: () => void;
}

export default function AchievementUnlockToast({ achievement, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const tierColors = {
    bronze: 'border-amber-800/60 bg-amber-900/20',
    silver: 'border-gray-500/60 bg-gray-400/20',
    gold: 'border-yellow-700/60 bg-yellow-600/20',
    platinum: 'border-purple-700/60 bg-purple-600/20',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[10000] min-w-[320px] max-w-md p-4 rounded-lg border-2 shadow-2xl transition-all duration-300 ${
        tierColors[achievement.tier]
      } ${
        isVisible
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-5xl animate-bounce">{achievement.icon}</div>

        {/* Content */}
        <div className="flex-1">
          <div className="text-sm font-bold text-green-400 mb-1">
            🎉 Achievement Unlocked!
          </div>
          <h4 className="font-semibold text-[#c9d1d9] mb-1">
            {achievement.name}
          </h4>
          <p className="text-xs text-[#8b949e] mb-2">
            {achievement.description}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${
              tierColors[achievement.tier]
            }`}>
              {achievement.tier}
            </span>
            <span className="text-xs font-semibold text-[#58a6ff]">
              +{achievement.points} points
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-[#8b949e] hover:text-[#c9d1d9] text-lg"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

