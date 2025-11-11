'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const RESERVED_USERNAMES = ['admin', 'support', 'api', 'vercel', 'root', 'system', 'test', 'demo', 'guest', 'null', 'undefined'];

export default function UsernameOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      router.push('/auth');
      return;
    }

    const checkAuth = async () => {
      const supa = getSupabaseClient();
      if (!supa) {
        router.push('/auth');
        return;
      }

      const { data: { user } } = await supa.auth.getUser();
      if (!user) {
        router.push('/auth?next=/onboarding/username');
        return;
      }

      setUser(user);

      // Check if username already set
      const { data: profile } = await supa
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username && !profile.username.startsWith('user_')) {
        // Username already set, redirect
        router.push('/profile');
      }
    };

    checkAuth();
  }, [router]);

  const validateUsername = (name: string): string[] => {
    const errors: string[] = [];
    
    if (name.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    if (name.length > 20) {
      errors.push('Username must be no more than 20 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    if (RESERVED_USERNAMES.includes(name.toLowerCase())) {
      errors.push('This username is reserved');
    }
    if (name.startsWith('user_')) {
      errors.push('Username cannot start with "user_"');
    }
    
    return errors;
  };

  const checkAvailability = async (name: string) => {
    if (!name || name.length < 3) {
      setAvailable(null);
      return;
    }

    const errors = validateUsername(name);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setAvailable(false);
      return;
    }

    setValidationErrors([]);
    setChecking(true);

    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(name.toLowerCase())}`);
      const data = await response.json();
      
      setAvailable(data.available);
      if (!data.available) {
        setError('This username is already taken');
      } else {
        setError('');
      }
    } catch (err) {
      setError('Failed to check username availability');
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkAvailability(username);
      } else {
        setAvailable(null);
        setError('');
        setValidationErrors([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth');
      return;
    }

    const errors = validateUsername(username);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (available !== true) {
      setError('Please choose an available username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supa = getSupabaseClient();
      if (!supa) {
        setError('Authentication is not available');
        setLoading(false);
        return;
      }

      // Update profile with username
      const { error: updateError } = await supa
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') { // Unique constraint violation
          setError('This username is already taken');
        } else {
          setError(updateError.message || 'Failed to set username');
        }
        setLoading(false);
        return;
      }

      // Log audit event
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'username_set',
          user_id: user.id,
          metadata: { username: username.trim() },
        }),
      });

      // Redirect to profile
      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#c9d1d9]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
            <span className="text-lg font-semibold text-[#c9d1d9]">Threat Hunt Lab</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#c9d1d9] mb-2">
            Choose Your Username
          </h1>
          <p className="text-[#8b949e]">
            Pick a unique username to identify yourself on the platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-[#161b22] border border-[#30363d] rounded-md text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
                placeholder="username"
                disabled={loading}
                autoFocus
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
              />
              {checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {available === true && !checking && (
              <p className="mt-2 text-sm text-[#3fb950]">✓ Username available</p>
            )}
            {available === false && !checking && (
              <p className="mt-2 text-sm text-red-400">✗ Username unavailable</p>
            )}

            {validationErrors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i} className="text-sm text-red-400">{err}</li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-xs text-[#8b949e]">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || available !== true || checking}
            className="w-full px-4 py-2 bg-[#58a6ff] text-white rounded-md hover:bg-[#4493f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/profile" className="text-[#58a6ff] hover:text-[#4493f8] text-sm">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}

