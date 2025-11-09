import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const isSupabaseEnabled =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key';

// Temporary backward compatibility alias:
export const isSupabaseConfigured = isSupabaseEnabled;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseEnabled || typeof window === 'undefined') return null;
  
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        auth: { 
          persistSession: true, 
          autoRefreshToken: true,
          detectSessionInUrl: true,
        } 
      }
    );
  }
  
  return client;
}

// Legacy export for backward compatibility
export const supabase = {
  auth: {
    getSession: async () => {
      const c = getSupabaseClient();
      return c ? c.auth.getSession() : { data: { session: null }, error: null };
    },
    getUser: async () => {
      const c = getSupabaseClient();
      return c ? c.auth.getUser() : { data: { user: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const c = getSupabaseClient();
      if (!c) {
        return { data: { subscription: null }, unsubscribe: () => {} };
      }
      return c.auth.onAuthStateChange(callback);
    },
    signOut: async () => {
      const c = getSupabaseClient();
      return c ? c.auth.signOut() : { error: null };
    },
    signInWithPassword: async (credentials: any) => {
      const c = getSupabaseClient();
      return c ? c.auth.signInWithPassword(credentials) : { data: null, error: { message: 'Supabase not configured' } };
    },
    signUp: async (credentials: any) => {
      const c = getSupabaseClient();
      return c ? c.auth.signUp(credentials) : { data: null, error: { message: 'Supabase not configured' } };
    },
  },
};

