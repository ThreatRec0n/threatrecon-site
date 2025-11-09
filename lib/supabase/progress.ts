import { supabase, isSupabaseConfigured } from './client';
import type { UserProgress } from './types';

/**
 * Save user progress to Supabase
 */
export async function saveUserProgress(userId: string, progress: Partial<UserProgress>) {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Progress will only be saved locally.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        ...progress,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error saving progress:', error);
    // Don't throw - allow local-only mode
    return null;
  }
}

/**
 * Load user progress from Supabase
 */
export async function loadUserProgress(userId: string): Promise<UserProgress | null> {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No progress found, return null
        return null;
      }
      throw error;
    }

    return data as UserProgress;
  } catch (error: any) {
    console.error('Error loading progress:', error);
    return null;
  }
}

/**
 * Merge local progress with server progress
 */
export function mergeProgress(
  local: Partial<UserProgress>,
  server: UserProgress | null
): Partial<UserProgress> {
  if (!server) return local;

  // Merge completed scenarios
  const completedScenarios = new Set([
    ...(local.completed_scenarios || []),
    ...(server.completed_scenarios || []),
  ]);

  // Merge scores (keep most recent)
  const scoresMap = new Map<string, any>();
  [...(server.scores || []), ...(local.scores || [])].forEach(score => {
    const key = `${score.scenario}-${score.timestamp}`;
    if (!scoresMap.has(key) || new Date(score.timestamp) > new Date(scoresMap.get(key).timestamp)) {
      scoresMap.set(key, score);
    }
  });

  // Merge leaderboard entries (keep top scores)
  const leaderboardMap = new Map<string, any>();
  [...(server.leaderboard_entries || []), ...(local.leaderboard_entries || [])].forEach(entry => {
    const key = `${entry.scenario}-${entry.score}`;
    if (!leaderboardMap.has(key) || entry.time < leaderboardMap.get(key).time) {
      leaderboardMap.set(key, entry);
    }
  });

  return {
    completed_scenarios: Array.from(completedScenarios),
    scores: Array.from(scoresMap.values()),
    leaderboard_entries: Array.from(leaderboardMap.values()),
  };
}

