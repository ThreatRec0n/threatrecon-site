// lib/supabase/progress.ts
import { getSupabaseClient, isSupabaseEnabled } from './client';
import type { UserProgress } from './types';

const LS_KEY = 'tr_progress_v1';

export function loadLocal(): Partial<UserProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Partial<UserProgress>) : {};
  } catch {
    return {};
  }
}

export function saveLocal(progress: Partial<UserProgress>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving local progress:', error);
  }
}

export async function syncToCloud(userId: string): Promise<{ ok: boolean; merged?: Partial<UserProgress>; error?: string }> {
  if (!isSupabaseEnabled()) return { ok: false, error: 'Supabase not configured' };
  const supa = getSupabaseClient();
  if (!supa) return { ok: false, error: 'Supabase client not available' };

  const entries = loadLocal();
  
  try {
    // Try RPC function first
    const { data, error } = await supa.rpc('merge_progress', { 
      p_user_id: userId,
      p_entries: entries 
    });
    
    if (error) {
      // Fallback to direct upsert
      const result = await saveUserProgress(userId, entries);
      if (result) {
        saveLocal(entries);
        return { ok: true, merged: entries };
      }
      return { ok: false, error: error.message };
    }
    
    const merged = (data as Partial<UserProgress>) ?? entries;
    saveLocal(merged);
    return { ok: true, merged };
  } catch (error: any) {
    return { ok: false, error: error.message || 'sync-failed' };
  }
}

export async function fetchCloudIntoLocal(userId: string): Promise<{ ok: boolean; merged?: Partial<UserProgress>; error?: string }> {
  if (!isSupabaseEnabled()) return { ok: false, error: 'Supabase not configured' };
  const supa = getSupabaseClient();
  if (!supa) return { ok: false, error: 'Supabase client not available' };

  try {
    const { data, error } = await supa
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { ok: true, merged: {} };
      }
      return { ok: false, error: error.message };
    }

    const merged = (data as Partial<UserProgress>) ?? {};
    saveLocal(merged);
    return { ok: true, merged };
  } catch (error: any) {
    return { ok: false, error: error.message || 'fetch-failed' };
  }
}

// Legacy functions for backward compatibility
export async function saveUserProgress(userId: string, progress: Partial<UserProgress>) {
  if (!isSupabaseEnabled()) {
    console.warn('Supabase not configured. Progress will only be saved locally.');
    return null;
  }

  const supa = getSupabaseClient();
  if (!supa) return null;

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
    return data;
  } catch (error: any) {
    console.error('Error saving progress:', error);
    return null;
  }
}

export async function loadUserProgress(userId: string): Promise<UserProgress | null> {
  if (!isSupabaseEnabled()) return null;

  const supa = getSupabaseClient();
  if (!supa) return null;

  try {
    const { data, error } = await supa
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
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

export function mergeProgress(
  local: Partial<UserProgress>,
  server: UserProgress | null
): Partial<UserProgress> {
  if (!server) return local;

  const completedScenarios = new Set([
    ...(local.completed_scenarios || []),
    ...(server.completed_scenarios || []),
  ]);

  const scoresMap = new Map<string, any>();
  [...(server.scores || []), ...(local.scores || [])].forEach(score => {
    const key = `${score.scenario}-${score.timestamp}`;
    if (!scoresMap.has(key) || new Date(score.timestamp) > new Date(scoresMap.get(key).timestamp)) {
      scoresMap.set(key, score);
    }
  });

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
