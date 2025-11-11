'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import AuthModal from '@/components/auth/AuthModal';

export const dynamic = 'force-dynamic';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authOpen, setAuthOpen] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    
    const supa = getSupabaseClient();
    if (!supa) return;

    supa.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        // Redirect if already logged in
        const next = searchParams.get('next') || '/simulation';
        router.push(next);
      }
    });
    
    const { data: { subscription } } = supa.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user);
        const next = searchParams.get('next') || '/simulation';
        router.push(next);
      } else {
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [router, searchParams]);

  // Set initial mode from URL or default to login
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const handleSuccess = () => {
    // Check if user needs username onboarding
    const checkProfile = async () => {
      const supa = getSupabaseClient();
      if (!supa) return;
      
      const { data: { user } } = await supa.auth.getUser();
      if (!user) return;

      // Check if profile exists and has username
      const { data: profile } = await supa
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.username || profile.username.startsWith('user_')) {
        // Redirect to username onboarding
        router.push('/onboarding/username');
      } else {
        // Redirect to intended destination or default
        const next = searchParams.get('next') || '/simulation';
        router.push(next);
      }
    };

    checkProfile();
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#c9d1d9]">You are already signed in.</p>
          <Link href="/simulation" className="text-[#58a6ff] hover:underline mt-4 inline-block">
            Go to Dashboard
          </Link>
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
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-[#8b949e]">
            {mode === 'login' 
              ? 'Sign in to save your progress and unlock achievements'
              : 'Create an account to start your threat hunting journey'
            }
          </p>
        </div>

        <AuthModal
          isOpen={authOpen}
          onClose={() => {
            // Don't allow closing - redirect to home instead
            router.push('/');
          }}
          onSuccess={handleSuccess}
          initialMode={mode}
          mode={mode}
        />

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[#58a6ff] hover:text-[#4493f8] text-sm"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

