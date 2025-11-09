// lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Primary flag used across the app
export const isSupabaseEnabled =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Compatibility alias for legacy imports
export const isSupabaseConfigured = isSupabaseEnabled;

// Always access via this function; returns null when disabled or on server
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseEnabled) return null;
  if (typeof window === 'undefined') return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: true, autoRefreshToken: true } }
    );
  }
  return client;
}

// Hard deprecate any legacy direct client usage
// (kept only to avoid import crashes if it still exists somewhere)
export const supabase = null as unknown as SupabaseClient;
