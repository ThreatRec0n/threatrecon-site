// Achievement storage - works with or without Supabase
// Uses localStorage as fallback when Supabase is not configured

import { isSupabaseEnabled, getSupabaseClient } from '@/lib/supabase/client';
import type { AchievementDefinition } from './definitions';

// Client-side only - check if we're in browser
const isClient = typeof window !== 'undefined';

export interface UserAchievement {
  slug: string;
  unlocked_at: string;
  progress?: number;
}

export interface AchievementProgress {
  slug: string;
  progress: number;
  requirement_value: number;
}

/**
 * Get all unlocked achievements for a user
 */
export async function getUserAchievements(userId?: string): Promise<UserAchievement[]> {
  if (!isClient) return [];
  
  if (!isSupabaseEnabled || !userId) {
    // Fallback to localStorage
    const stored = localStorage.getItem('user_achievements');
    return stored ? JSON.parse(stored) : [];
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('user_achievements')
      .select('slug, unlocked_at, progress')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserAchievements:', error);
    return [];
  }
}

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(
  userId: string | null,
  achievementSlug: string
): Promise<boolean> {
  if (!isClient) return false;
  
  const now = new Date().toISOString();

  if (!isSupabaseEnabled || !userId) {
    // Fallback to localStorage
    const stored = localStorage.getItem('user_achievements') || '[]';
    const achievements: UserAchievement[] = JSON.parse(stored);
    
    if (!achievements.find(a => a.slug === achievementSlug)) {
      achievements.push({
        slug: achievementSlug,
        unlocked_at: now,
      });
      localStorage.setItem('user_achievements', JSON.stringify(achievements));
    }
    return true;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        slug: achievementSlug,
        unlocked_at: now,
      })
      .select()
      .single();

    if (error && !error.message.includes('duplicate')) {
      console.error('Error unlocking achievement:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in unlockAchievement:', error);
    return false;
  }
}

/**
 * Update achievement progress (for partial completion tracking)
 */
export async function updateAchievementProgress(
  userId: string | null,
  achievementSlug: string,
  progress: number
): Promise<boolean> {
  if (!isClient) return false;
  
  if (!isSupabaseEnabled || !userId) {
    // Store progress in localStorage
    const key = `achievement_progress_${achievementSlug}`;
    localStorage.setItem(key, progress.toString());
    return true;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        slug: achievementSlug,
        progress,
        unlocked_at: null, // Not unlocked yet
      }, {
        onConflict: 'user_id,slug',
      });

    if (error) {
      console.error('Error updating achievement progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateAchievementProgress:', error);
    return false;
  }
}

/**
 * Get user statistics for achievement checking
 */
export interface UserStats {
  simulation_count: number;
  perfect_score_count: number;
  scenario_type_counts: Record<string, number>;
  difficulty_counts: Record<string, number>;
  streak: number;
  last_simulation_date?: string;
  help_opened_count: number;
  login_count: number;
  tutorial_completed: boolean;
}

export async function getUserStats(userId?: string): Promise<UserStats> {
  if (!isClient) {
    return {
      simulation_count: 0,
      perfect_score_count: 0,
      scenario_type_counts: {},
      difficulty_counts: {},
      streak: 0,
      help_opened_count: 0,
      login_count: 0,
      tutorial_completed: false,
    };
  }
  
  if (!isSupabaseEnabled || !userId) {
    // Fallback to localStorage
    const stats: UserStats = {
      simulation_count: parseInt(localStorage.getItem('simulation_count') || '0'),
      perfect_score_count: parseInt(localStorage.getItem('perfect_score_count') || '0'),
      scenario_type_counts: JSON.parse(localStorage.getItem('scenario_type_counts') || '{}'),
      difficulty_counts: JSON.parse(localStorage.getItem('difficulty_counts') || '{}'),
      streak: parseInt(localStorage.getItem('streak') || '0'),
      last_simulation_date: localStorage.getItem('last_simulation_date') || undefined,
      help_opened_count: parseInt(localStorage.getItem('help_opened_count') || '0'),
      login_count: parseInt(localStorage.getItem('login_count') || '0'),
      tutorial_completed: localStorage.getItem('tutorial_completed') === 'true',
    };
    return stats;
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return getUserStats(); // Fallback
    }

    // Fetch user progress data
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch simulation completions
    const { data: completions } = await supabase
      .from('simulation_completions')
      .select('scenario, score, difficulty, completed_at')
      .eq('user_id', userId);

    const stats: UserStats = {
      simulation_count: completions?.length || 0,
      perfect_score_count: completions?.filter(c => c.score === 100).length || 0,
      scenario_type_counts: {},
      difficulty_counts: {},
      streak: progressData?.streak || 0,
      last_simulation_date: completions?.[0]?.completed_at,
      help_opened_count: progressData?.help_opened_count || 0,
      login_count: progressData?.login_count || 0,
      tutorial_completed: progressData?.tutorial_completed || false,
    };

    // Count scenario types
    completions?.forEach(c => {
      if (c.scenario) {
        stats.scenario_type_counts[c.scenario] = (stats.scenario_type_counts[c.scenario] || 0) + 1;
      }
      if (c.difficulty) {
        stats.difficulty_counts[c.difficulty] = (stats.difficulty_counts[c.difficulty] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return getUserStats(); // Fallback
  }
}

/**
 * Update user stats (localStorage fallback)
 */
export function updateLocalStats(updates: Partial<UserStats>): void {
  if (!isClient) return;
  
  Object.entries(updates).forEach(([key, value]) => {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value?.toString() || '0');
    }
  });
}

