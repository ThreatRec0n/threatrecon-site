'use client';

import { useState, useEffect } from 'react';
import { Trophy, Clock } from 'lucide-react';
import { ATTACK_SCENARIOS } from '@/lib/scenarios/scenario-engine';

export default function WeeklyChallengeCard() {
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [participants, setParticipants] = useState(1247);
  const [userBest, setUserBest] = useState<number | null>(null);

  useEffect(() => {
    // Calculate time until next Monday
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
    nextMonday.setHours(0, 0, 0, 0);

    const updateTime = () => {
      const diff = nextMonday.getTime() - Date.now();
      setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get weekly challenge scenario (first one for now)
  const weeklyScenario = ATTACK_SCENARIOS[0];

  return (
    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-2 border-yellow-600/50 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Weekly Challenge</h3>
            <p className="text-sm text-gray-400">{weeklyScenario?.name || 'APT28 Phishing Campaign'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Ends in</div>
          <div className="text-sm font-bold text-yellow-400">
            {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Difficulty</div>
          <div className="text-sm font-semibold text-white">{weeklyScenario?.difficulty || 'Intermediate'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Participants</div>
          <div className="text-sm font-semibold text-white">{participants.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Your Best</div>
          <div className="text-sm font-semibold text-blue-400">
            {userBest ? `${userBest}/100` : 'Not attempted'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Reward</div>
          <div className="text-sm font-semibold text-yellow-400">2x XP</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-semibold transition-colors">
          Attempt Challenge
        </button>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors">
          View Leaderboard
        </button>
      </div>
    </div>
  );
}

