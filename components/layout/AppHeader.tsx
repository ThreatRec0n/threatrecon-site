'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import ProfileDropdown from '@/components/auth/ProfileDropdown';
import AuthModal from '@/components/auth/AuthModal';

export default function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    
    const supa = getSupabaseClient();
    if (!supa) return;

    supa.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    
    const { data: { subscription } } = supa.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-header h-14 border-b border-[#30363d] bg-[#161b22] flex items-center px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
            <span className="text-sm text-[#8b949e]">Threat Hunt Lab</span>
            <span className="text-xs text-[#484f58]">|</span>
            <span className="text-xs text-[#8b949e]">Professional SIEM Training</span>
          </div>

          <div className="flex items-center gap-2">
            {isSupabaseEnabled ? (
              user ? (
                <ProfileDropdown user={user} />
              ) : (
                <>
                  <button
                    className="rounded-md px-3 py-1.5 text-sm text-[#c9d1d9] hover:bg-[#21262d] transition-colors border border-[#30363d] hover:border-[#58a6ff]"
                    onClick={() => {
                      if (!isSupabaseEnabled) return;
                      setMode('login');
                      setAuthOpen(true);
                    }}
                    aria-label="Sign In to your account"
                  >
                    Sign In
                  </button>
                  <button
                    className="rounded-md bg-[#58a6ff] px-3 py-1.5 text-sm text-white hover:bg-[#4493f8] transition-colors"
                    onClick={() => {
                      if (!isSupabaseEnabled) return;
                      setMode('signup');
                      setAuthOpen(true);
                    }}
                    aria-label="Sign Up for a new account"
                  >
                    Sign Up
                  </button>
                </>
              )
            ) : null}
          </div>
        </div>
      </header>

      {isSupabaseEnabled && (
        <AuthModal 
          isOpen={authOpen} 
          mode={mode === 'login' ? 'login' : 'signup'}
          onClose={() => setAuthOpen(false)} 
          onSuccess={() => {
            setAuthOpen(false);
            // Redirect handled in AuthModal
          }}
          initialMode={mode}
        />
      )}
    </>
  );
}

