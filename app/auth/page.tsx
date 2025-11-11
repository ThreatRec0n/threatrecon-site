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
  const [initError, setInitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    // Wrap everything in try-catch to prevent errors from bubbling up
    const initAuth = async () => {
      try {
        // Check if Supabase is enabled
        let enabled = false;
        try {
          enabled = isSupabaseEnabled();
        } catch (err: any) {
          console.error('Error checking Supabase enabled:', err);
          if (mounted) {
            setInitError('Error checking Supabase configuration.');
            setIsLoading(false);
          }
          return;
        }

        if (!enabled) {
          if (mounted) {
            setInitError('Supabase is not configured. Please add environment variables to Vercel.');
            setIsLoading(false);
          }
          return;
        }
        
        const supa = getSupabaseClient();
        if (!supa) {
          if (mounted) {
            setInitError('Failed to initialize Supabase client. Environment variables may be missing.');
            setIsLoading(false);
          }
          return;
        }

        try {
          const { data, error } = await supa.auth.getUser();
          if (error) {
            console.error('Error getting user:', error);
          }
          if (mounted && data?.user) {
            setUser(data.user);
            // Redirect if already logged in
            const next = searchParams.get('next') || '/simulation';
            router.push(next);
            return;
          }
        } catch (err) {
          console.error('Error checking auth state:', err);
          // Don't set error for auth check failures - user might just not be logged in
        }
        
        const { data: { subscription } } = supa.auth.onAuthStateChange((_e, session) => {
          if (!mounted) return;
          if (session?.user) {
            setUser(session.user);
            const next = searchParams.get('next') || '/simulation';
            router.push(next);
          } else {
            setUser(null);
          }
        });

        if (mounted) {
          setIsLoading(false);
        }

        return () => {
          mounted = false;
          subscription?.unsubscribe();
        };
      } catch (err: any) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setInitError(err.message || 'Failed to initialize authentication.');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  // Set initial mode from URL or default to login
  useEffect(() => {
    try {
      const tab = searchParams.get('tab');
      if (tab === 'signup') {
        setMode('signup');
      }
    } catch (err) {
      console.error('Error reading search params:', err);
    }
  }, [searchParams]);

  const handleSuccess = () => {
    // Check if user needs username onboarding
    const checkProfile = async () => {
      if (!isSupabaseEnabled()) {
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#c9d1d9]">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Show message if Supabase is not enabled or there's an init error
  let supabaseEnabled = false;
  try {
    supabaseEnabled = isSupabaseEnabled();
  } catch (err) {
    console.error('Error checking Supabase enabled:', err);
  }

  if (!supabaseEnabled || initError) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
              <span className="text-lg font-semibold text-[#c9d1d9]">Threat Hunt Lab</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#c9d1d9] mb-4">Authentication Unavailable</h1>
            <p className="text-[#8b949e] mb-4">
              {initError || 'Authentication is currently being configured. You can still use the platform without an account.'}
            </p>
            {initError && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-[#8b949e] mb-2">To fix this:</p>
                <ol className="text-sm text-[#8b949e] list-decimal list-inside space-y-1">
                  <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
                  <li>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  <li>Redeploy your site (new build required)</li>
                </ol>
              </div>
            )}
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

// Safe wrapper to prevent any render-time errors
function SafeAuthPageContent() {
  try {
    return <AuthPageContent />;
  } catch (error: any) {
    console.error('Error rendering AuthPageContent:', error);
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Render Error</h2>
          <p className="text-[#8b949e] mb-4">{error?.message || 'Unknown error'}</p>
          <pre className="text-xs text-red-400 bg-[#0d1117] p-4 rounded overflow-auto mb-4">
            {error?.stack}
          </pre>
          <Link
            href="/simulation"
            className="inline-block px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors"
          >
            Continue to Simulation
          </Link>
        </div>
      </div>
    );
  }
}

export default function AuthPage() {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Authentication Error</h2>
          <p className="text-[#8b949e] mb-6">
            There was an error loading the authentication page. Check the error details below.
          </p>
          <div className="mb-4">
            <Link
              href="/debug-auth"
              className="text-[#58a6ff] hover:underline text-sm"
            >
              View Debug Information →
            </Link>
          </div>
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
        <SafeAuthPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
