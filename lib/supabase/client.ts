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
    console.warn('⚠️ Supabase is not enabled - check environment variables');
    return null;
  }
  
  // Double-check env vars at runtime with better validation
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  
  // Better validation - check for undefined string and empty values
  if (!url || url === 'undefined' || url === '') {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    return null;
  }
  
  if (!key || key === 'undefined' || key === '') {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid');
    return null;
  }
  
  // Validate URL format
  try {
    new URL(url);
  } catch {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    return null;
  }
  
  if (!client) {
    try {
      client = createClient(url, key, {
        auth: {
          persistSession: true,
          storageKey: 'threatrecon-auth',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      });
    } catch (error: any) {
      console.warn('⚠️ Failed to create Supabase client:', error?.message || 'Unknown error');
      return null;
    }
  }
  return client;
}

// Hard deprecate any legacy direct client usage
// (kept only to avoid import crashes if it still exists somewhere)
export const supabase = null as unknown as SupabaseClient;
