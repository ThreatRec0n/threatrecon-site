'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

interface Props {
  onProgressSync?: () => void;
}

export default function ProfileDropdown({ onProgressSync }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && onProgressSync) {
        // Auto-sync on login
        handleSync();
      }
    });

    return () => subscription.unsubscribe();
  }, [onProgressSync]);

  const handleSync = async () => {
    if (!user) return;

    // Check if Supabase is configured
    if (typeof window !== 'undefined' && 
        (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
         !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url')) {
      setError('Supabase not configured');
      return;
    }

    setSyncing(true);
    setSyncStatus('syncing');

    try {
      // Load local progress
      const localProgressRaw = {
        completed_scenarios: JSON.parse(
          localStorage.getItem('threatrecon_scenario_progress') || '{}'
        ),
        scores: JSON.parse(localStorage.getItem('threatrecon_scores') || '[]'),
        leaderboard_entries: JSON.parse(
          localStorage.getItem('threatrecon_leaderboard') || '[]'
        ),
      };

      // Load server progress and merge
      const { loadUserProgress, mergeProgress } = await import('@/lib/supabase/progress');
      const serverProgress = await loadUserProgress(user.id);
      const merged = mergeProgress(localProgressRaw, serverProgress);

      // Save merged progress to Supabase
      const { saveUserProgress } = await import('@/lib/supabase/progress');
      await saveUserProgress(user.id, merged);

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);

      if (onProgressSync) {
        onProgressSync();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  const handleLoadProgress = async () => {
    if (!user) return;

    // Check if Supabase is configured
    if (typeof window !== 'undefined' && 
        (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
         !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
         process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url')) {
      setError('Supabase not configured');
      return;
    }

    setSyncing(true);
    setSyncStatus('syncing');

    try {
      const { loadUserProgress, mergeProgress } = await import('@/lib/supabase/progress');
      const serverProgress = await loadUserProgress(user.id);

      if (serverProgress) {
        // Load local progress
        const localProgress = {
          completed_scenarios: JSON.parse(
            localStorage.getItem('threatrecon_scenario_progress') || '{}'
          ),
          scores: JSON.parse(localStorage.getItem('threatrecon_scores') || '[]'),
          leaderboard_entries: JSON.parse(
            localStorage.getItem('threatrecon_leaderboard') || '[]'
          ),
        };

        // Merge progress
        const merged = mergeProgress(localProgress, serverProgress);

        // Save merged progress back to localStorage
        if (merged.completed_scenarios) {
          const completedScenariosObj: Record<string, boolean> = {};
          (merged.completed_scenarios || []).forEach((scenario: string) => {
            completedScenariosObj[scenario] = true;
          });
          localStorage.setItem(
            'threatrecon_scenario_progress',
            JSON.stringify(completedScenariosObj)
          );
        }
        if (merged.scores) {
          localStorage.setItem('threatrecon_scores', JSON.stringify(merged.scores));
        }
        if (merged.leaderboard_entries) {
          localStorage.setItem(
            'threatrecon_leaderboard',
            JSON.stringify(merged.leaderboard_entries)
          );
        }

        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);

        // Reload page to reflect changes
        window.location.reload();
      } else {
        setSyncStatus('idle');
      }
    } catch (error: any) {
      console.error('Load error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          aria-label="User Profile"
          aria-expanded={isOpen}
        >
          {user ? (
            <>
              <span className="text-lg">👤</span>
              <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
            </>
          ) : (
            <>
              <span className="text-lg">🔓</span>
              <span className="hidden sm:inline">Sign In</span>
            </>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded shadow-lg z-50">
              {user ? (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 border-b border-[#30363d]">
                    <div className="text-sm font-semibold text-[#c9d1d9]">{user.email}</div>
                    <div className="text-xs text-[#8b949e] mt-1">Signed in</div>
                  </div>

                  {error && (
                    <div className="px-3 py-2 text-xs text-red-400 bg-red-900/20 rounded mb-1">
                      {error}
                    </div>
                  )}
                  
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full text-left px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {syncStatus === 'syncing' && <span className="animate-spin">⏳</span>}
                    {syncStatus === 'success' && <span>✓</span>}
                    {syncStatus === 'error' && <span>✗</span>}
                    <span>Sync Progress to Cloud</span>
                  </button>

                  <button
                    onClick={handleLoadProgress}
                    disabled={syncing}
                    className="w-full text-left px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] rounded transition-colors disabled:opacity-50"
                  >
                    Load Progress from Cloud
                  </button>

                  <div className="border-t border-[#30363d] pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] rounded transition-colors"
                  >
                    Sign In / Create Account
                  </button>
                  <div className="px-3 py-2 text-xs text-[#8b949e] mt-2">
                    Optional: Sign in to sync your progress across devices
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          if (onProgressSync) {
            setTimeout(() => handleSync(), 1000);
          }
        }}
      />
    </>
  );
}

