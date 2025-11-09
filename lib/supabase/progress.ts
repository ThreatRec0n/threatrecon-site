import { getSupabaseClient, isSupabaseEnabled } from './client';
import type { UserProgress } from './types';

const LS_KEY = 'tr_progress_v1';

/**
 * Load local progress from localStorage
 */
function loadLocal(): Partial<UserProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save local progress to localStorage
 */
function saveLocal(progress: Partial<UserProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving local progress:', error);
  }
}

/**
 * Save user progress to Supabase
 */
export async function saveUserProgress(userId: string, progress: Partial<UserProgress>) {
  // Check if Supabase is enabled
  if (!isSupabaseEnabled) {
    console.warn('Supabase not configured. Progress will only be saved locally.');
    saveLocal(progress);
    return null;
  }

  const supa = getSupabaseClient();
  if (!supa) {
    saveLocal(progress);
    return null;
  }

  try {
    const { data, error } = await supa
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
    
    // Also save locally as backup
    saveLocal(progress);
    return data;
  } catch (error: any) {
    console.error('Error saving progress:', error);
    // Save locally as fallback
    saveLocal(progress);
    return null;
  }
}

/**
 * Load user progress from Supabase
 */
export async function loadUserProgress(userId: string): Promise<UserProgress | null> {
  // Check if Supabase is enabled
  if (!isSupabaseEnabled) {
    return null;
  }

  const supa = getSupabaseClient();
  if (!supa) {
    return null;
  }

  try {
    const { data, error } = await supa
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
 * Sync local progress to cloud
 */
export async function syncToCloud(userId: string): Promise<{ ok: boolean; error?: string; merged?: any }> {
  const supa = getSupabaseClient();
  if (!isSupabaseEnabled || !supa) {
    return { ok: false, error: 'supabase-disabled' };
  }

  const entries = loadLocal();
  
  try {
    // Use RPC function if available, otherwise use direct upsert
    const { data, error } = await supa.rpc('merge_progress', { 
      p_user_id: userId,
      p_entries: entries 
    });

    if (error) {
      // Fallback to direct upsert
      return await saveUserProgress(userId, entries).then(
        (data) => ({ ok: !!data, merged: data }),
        () => ({ ok: false, error: error.message })
      );
    }

    if (data) {
      saveLocal(data as any);
    }
    return { ok: true, merged: data as any };
  } catch (error: any) {
    return { ok: false, error: error.message || 'sync-failed' };
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
