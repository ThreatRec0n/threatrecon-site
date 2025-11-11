// lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Primary flag used across the app
// MUST be a function to check at runtime, not build time
// NEXT_PUBLIC_* vars are embedded at build time, but we need runtime checks
export function isSupabaseEnabled(): boolean {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!(url && key && url.trim() && key.trim());
  } catch {
    return false;
  }
}

// Legacy constant export for backwards compatibility (deprecated)
export const isSupabaseEnabledConst = isSupabaseEnabled();

// Compatibility alias for legacy imports
export const isSupabaseConfigured = isSupabaseEnabled;

// Always access via this function; returns null when disabled or on server
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  
  // Check if enabled first
  if (!isSupabaseEnabled()) {
    return null;
  }
  
  // Double-check env vars at runtime
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  
  if (!url || !key) {
    console.warn('Supabase environment variables not found:', {
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length || 0,
      keyLength: key?.length || 0,
    });
    return null;
  }
  
  if (!client) {
    try {
      client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }
  return client;
}

// Hard deprecate any legacy direct client usage
// (kept only to avoid import crashes if it still exists somewhere)
export const supabase = null as unknown as SupabaseClient;
