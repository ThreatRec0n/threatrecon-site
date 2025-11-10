// Server-side Supabase client
// This file provides server-side Supabase utilities

import { createClient } from '@supabase/supabase-js';
import { isSupabaseEnabled as checkEnabled } from './client';

export function isSupabaseEnabled(): boolean {
  return checkEnabled;
}

export async function getSupabaseClient() {
  if (!isSupabaseEnabled()) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

