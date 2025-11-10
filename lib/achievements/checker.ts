// Achievement checking logic

import { ACHIEVEMENT_DEFINITIONS, type AchievementDefinition } from './definitions';
import { getUserAchievements, unlockAchievement, updateAchievementProgress, getUserStats, updateLocalStats, type UserStats } from './storage';

export interface AchievementUnlockEvent {
  type: string;
  data?: any;
}

/**
 * Check and unlock achievements based on an event
 */
export async function checkAndUnlockAchievements(
  userId: string | null,
  eventType: string,
  eventData?: any
): Promise<AchievementDefinition[]> {
  const unlockedAchievements: AchievementDefinition[] = [];

  // Get user's current achievements
  const userAchievements = await getUserAchievements(userId || undefined);
  const unlockedSlugs = new Set(userAchievements.map(a => a.slug));

  // Get user stats
  const userStats = await getUserStats(userId || undefined);

  // Check each achievement
  for (const achievement of ACHIEVEMENT_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedSlugs.has(achievement.slug)) continue;

    // Check if user meets requirements
    const { meetsRequirement, progress } = await checkRequirement(
      achievement,
      eventType,
      eventData,
      userStats
    );

    if (meetsRequirement) {
      // Unlock achievement
      const unlocked = await unlockAchievement(userId, achievement.slug);
      if (unlocked) {
        unlockedAchievements.push(achievement);
        unlockedSlugs.add(achievement.slug);
      }
    } else if (progress !== undefined && progress > 0) {
      // Update progress for partial completion
      await updateAchievementProgress(userId, achievement.slug, progress);
    }
  }

  return unlockedAchievements;
}

/**
 * Check if a requirement is met and return progress
 */
async function checkRequirement(
  achievement: AchievementDefinition,
  eventType: string,
  eventData: any,
  userStats: UserStats
): Promise<{ meetsRequirement: boolean; progress?: number }> {
  const { requirement_type, requirement_value, requirement_meta } = achievement;

  switch (requirement_type) {
    case 'simulation_count':
      return {
        meetsRequirement: userStats.simulation_count >= requirement_value,
        progress: userStats.simulation_count,
      };

    case 'perfect_score':
      return {
        meetsRequirement: userStats.perfect_score_count >= requirement_value,
        progress: userStats.perfect_score_count,
      };

    case 'scenario_type':
      const scenarioType = requirement_meta?.scenario_type;
      if (scenarioType) {
        const count = userStats.scenario_type_counts[scenarioType] || 0;
        return {
          meetsRequirement: count >= requirement_value,
          progress: count,
        };
      }
      // Also check difficulty-based scenario types
      const difficulty = requirement_meta?.difficulty;
      if (difficulty) {
        const count = userStats.difficulty_counts[difficulty] || 0;
        return {
          meetsRequirement: count >= requirement_value,
          progress: count,
        };
      }
      return { meetsRequirement: false };

    case 'speed_perfect':
      if (eventType === 'simulation_complete' && eventData) {
        const isPerfect = eventData.score === 100;
        const timeSeconds = eventData.time || 0;
        return {
          meetsRequirement: isPerfect && timeSeconds <= requirement_value,
        };
      }
      return { meetsRequirement: false };

    case 'streak':
      return {
        meetsRequirement: userStats.streak >= requirement_value,
        progress: userStats.streak,
      };

    case 'difficulty_complete':
      if (eventType === 'simulation_complete' && eventData) {
        const matchesDifficulty = eventData.difficulty === requirement_meta?.difficulty;
        return { meetsRequirement: matchesDifficulty };
      }
      return { meetsRequirement: false };

    case 'tutorial_completed':
      if (eventType === 'tutorial_complete') {
        return { meetsRequirement: true };
      }
      return {
        meetsRequirement: userStats.tutorial_completed,
      };

    case 'login_count':
      return {
        meetsRequirement: userStats.login_count >= requirement_value,
        progress: userStats.login_count,
      };

    case 'help_opened':
      return {
        meetsRequirement: userStats.help_opened_count >= requirement_value,
        progress: userStats.help_opened_count,
      };

    case 'time_of_day':
      if (eventType === 'simulation_complete') {
        const hour = new Date().getHours();
        if (requirement_meta?.time_range === 'early_morning') {
          return { meetsRequirement: hour >= 5 && hour < 8 };
        }
        // Default: night owl (midnight to 4 AM)
        return { meetsRequirement: hour >= 0 && hour < 4 };
      }
      return { meetsRequirement: false };

    case 'daily_simulations':
      // Check if user completed simulations today
      const today = new Date().toDateString();
      const lastSimulationDate = userStats.last_simulation_date
        ? new Date(userStats.last_simulation_date).toDateString()
        : null;
      
      if (lastSimulationDate === today && eventType === 'simulation_complete') {
        // Count today's simulations (simplified - would need proper tracking)
        const todayCount = (userStats.scenario_type_counts['_today'] || 0) + 1;
        updateLocalStats({ scenario_type_counts: { ...userStats.scenario_type_counts, '_today': todayCount } });
        return {
          meetsRequirement: todayCount >= requirement_value,
          progress: todayCount,
        };
      }
      return { meetsRequirement: false };

    default:
      return { meetsRequirement: false };
  }
}

/**
 * Update user stats after an event
 */
export function updateStatsForEvent(eventType: string, eventData?: any): void {
  const updates: Partial<UserStats> = {};

  switch (eventType) {
    case 'simulation_complete':
      const currentCount = parseInt(localStorage.getItem('simulation_count') || '0');
      updates.simulation_count = currentCount + 1;
      
      if (eventData?.score === 100) {
        const perfectCount = parseInt(localStorage.getItem('perfect_score_count') || '0');
        updates.perfect_score_count = perfectCount + 1;
      }

      if (eventData?.scenario) {
        const scenarioCounts = JSON.parse(localStorage.getItem('scenario_type_counts') || '{}');
        scenarioCounts[eventData.scenario] = (scenarioCounts[eventData.scenario] || 0) + 1;
        updates.scenario_type_counts = scenarioCounts;
      }

      if (eventData?.difficulty) {
        const difficultyCounts = JSON.parse(localStorage.getItem('difficulty_counts') || '{}');
        difficultyCounts[eventData.difficulty] = (difficultyCounts[eventData.difficulty] || 0) + 1;
        updates.difficulty_counts = difficultyCounts;
      }

      updates.last_simulation_date = new Date().toISOString();
      break;

    case 'tutorial_complete':
      updates.tutorial_completed = true;
      break;

    case 'login':
      const loginCount = parseInt(localStorage.getItem('login_count') || '0');
      updates.login_count = loginCount + 1;
      break;

    case 'help_opened':
      const helpCount = parseInt(localStorage.getItem('help_opened_count') || '0');
      updates.help_opened_count = helpCount + 1;
      break;
  }

  updateLocalStats(updates);
}

