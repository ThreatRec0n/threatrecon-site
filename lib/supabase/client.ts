// lib/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Primary flag used across the app
// Check at runtime to ensure env vars are available
export const isSupabaseEnabled = (() => {
  if (typeof window === 'undefined') {
    // Server-side: check process.env directly
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  // Client-side: env vars are embedded at build time
  // Use a try-catch to handle any edge cases
  try {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } catch {
    return false;
  }
})();

// Compatibility alias for legacy imports
export const isSupabaseConfigured = isSupabaseEnabled;

// Always access via this function; returns null when disabled or on server
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  
  // Double-check env vars at runtime
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase environment variables not found:', {
        hasUrl: !!url,
        hasKey: !!key,
      });
    }
    return null;
  }
  
  if (!client) {
    try {
      client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
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
