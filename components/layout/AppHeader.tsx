'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import ProfileDropdown from '@/components/auth/ProfileDropdown';
import AuthModal from '@/components/auth/AuthModal';

export default function AppHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [navOpen, setNavOpen] = useState(false);

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
      <header className="sticky top-0 z-header border-b border-[#30363d] bg-[#161b22]">
        <div className="flex w-full items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
              <span className="text-sm text-[#8b949e]">Threat Hunt Lab</span>
            </Link>
            <span className="text-xs text-[#484f58]">|</span>
            <span className="text-xs text-[#8b949e] hidden sm:inline">Professional SIEM Training</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link 
              href="/simulation" 
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === '/simulation' 
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff]' 
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/learn" 
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === '/learn' 
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff]' 
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Learn <span className="text-[#3fb950] text-xs">New</span>
            </Link>
            <Link 
              href="/achievements" 
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === '/achievements' 
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff]' 
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Achievements <span className="text-[#3fb950] text-xs">New</span>
            </Link>
            <Link 
              href="/dashboard" 
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === '/dashboard' 
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff]' 
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Progress <span className="text-[#3fb950] text-xs">New</span>
            </Link>
            <Link 
              href="/leaderboard" 
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === '/leaderboard' 
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff]' 
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              href="/docs" 
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === '/docs' 
                  ? 'bg-[#58a6ff]/20 text-[#58a6ff]' 
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Docs
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden text-[#8b949e] hover:text-[#c9d1d9] p-2"
            aria-label="Toggle navigation menu"
          >
            {navOpen ? '✕' : '☰'}
          </button>

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

        {/* Mobile Navigation Menu */}
        {navOpen && (
          <nav className="md:hidden border-t border-[#30363d] bg-[#161b22] px-6 py-4 space-y-2">
            <Link 
              href="/simulation" 
              onClick={() => setNavOpen(false)}
              className="block px-3 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
            >
              Dashboard
            </Link>
            <Link 
              href="/learn" 
              onClick={() => setNavOpen(false)}
              className="block px-3 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
            >
              Learn <span className="text-[#3fb950] text-xs">New</span>
            </Link>
            <Link 
              href="/achievements" 
              onClick={() => setNavOpen(false)}
              className="block px-3 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
            >
              Achievements <span className="text-[#3fb950] text-xs">New</span>
            </Link>
            <Link 
              href="/dashboard" 
              onClick={() => setNavOpen(false)}
              className="block px-3 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
            >
              Progress <span className="text-[#3fb950] text-xs">New</span>
            </Link>
            <Link 
              href="/leaderboard" 
              onClick={() => setNavOpen(false)}
              className="block px-3 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
            >
              Leaderboard
            </Link>
            <Link 
              href="/docs" 
              onClick={() => setNavOpen(false)}
              className="block px-3 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded"
            >
              Docs
            </Link>
          </nav>
        )}
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

