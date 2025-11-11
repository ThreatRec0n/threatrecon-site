'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import AuthModal from '@/components/auth/AuthModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AuthPageContent() {
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
    }).catch((err) => {
      console.error('Error checking auth state:', err);
      // Don't crash if there's an error
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
      if (!isSupabaseEnabled) {
        router.push('/simulation');
        return;
      }
      
      const supa = getSupabaseClient();
      if (!supa) {
        router.push('/simulation');
        return;
      }
      
      try {
        const { data: { user } } = await supa.auth.getUser();
        if (!user) {
          router.push('/simulation');
          return;
        }

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
      } catch (err) {
        console.error('Error checking profile:', err);
        // On error, just redirect to simulation
        router.push('/simulation');
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

  // Show message if Supabase is not enabled
  if (!isSupabaseEnabled) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
              <span className="text-lg font-semibold text-[#c9d1d9]">Threat Hunt Lab</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#c9d1d9] mb-4">Authentication Unavailable</h1>
            <p className="text-[#8b949e] mb-6">
              Authentication is currently being configured. You can still use the platform without an account.
            </p>
            <Link
              href="/simulation"
              className="inline-block px-6 py-3 bg-[#58a6ff] text-white rounded-md hover:bg-[#4493f8] transition-colors"
            >
              Continue to Simulation
            </Link>
          </div>
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

export default function AuthPage() {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Authentication Error</h2>
          <p className="text-[#8b949e] mb-6">
            There was an error loading the authentication page. This might be because Supabase environment variables need to be configured in Vercel.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/simulation"
              className="px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors"
            >
              Continue to Simulation
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#21262d] text-[#c9d1d9] rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d]"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    }>
      <Suspense fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#c9d1d9]">Loading...</p>
          </div>
        </div>
      }>
        <AuthPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
