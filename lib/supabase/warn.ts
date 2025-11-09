export function logSupabaseOptionalWarning() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
  console.warn('Optional accounts: Supabase env is not set. Auth UI will be hidden.');
}

