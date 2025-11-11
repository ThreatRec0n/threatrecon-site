'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const AchievementCard = dynamic(() => import('@/components/achievements/AchievementCard'), {
  loading: () => <div className="animate-pulse bg-[#161b22] h-24 rounded"></div>,
});

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Achievement {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string | null;
  progress?: number;
  [key: string]: any; // Allow additional properties from API
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled()) {
      router.push('/auth');
      return;
    }

    const loadProfile = async () => {
      const supa = getSupabaseClient();
      if (!supa) {
        router.push('/auth');
        return;
      }

      const { data: { user } } = await supa.auth.getUser();
      if (!user) {
        router.push('/auth?next=/profile');
        return;
      }

      setUser(user);

      // Load profile
      const { data: profileData, error: profileError } = await supa
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        // Redirect to onboarding if profile doesn't exist
        if (profileError.code === 'PGRST116') {
          router.push('/onboarding/username');
          return;
        }
      } else if (profileData) {
        setProfile(profileData);
        setNewUsername(profileData.username);
      }

      // Load achievements
      try {
        const achievementsRes = await fetch('/api/achievements');
        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json();
          setAchievements(achievementsData.achievements || []);
        }
      } catch (err) {
        console.error('Error loading achievements:', err);
      }

      // Load recent results
      const { data: resultsData } = await supa
        .from('simulation_results')
        .select('id, scenario_name, score, skill_level, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (resultsData) {
        setRecentResults(resultsData);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameError('');
      return false;
    }

    setUsernameChecking(true);
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username.toLowerCase())}`);
      const data = await response.json();
      
      if (!data.available) {
        setUsernameError('This username is already taken');
        setUsernameChecking(false);
        return false;
      }
      
      setUsernameError('');
      setUsernameChecking(false);
      return true;
    } catch (err) {
      setUsernameError('Failed to check username availability');
      setUsernameChecking(false);
      return false;
    }
  };

  const handleUsernameUpdate = async () => {
    if (!user || !profile) return;

    const trimmed = newUsername.trim();
    if (trimmed === profile.username) {
      setEditingUsername(false);
      return;
    }

    // Validate
    if (trimmed.length < 3 || trimmed.length > 20) {
      setUsernameError('Username must be 3-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    // Check availability
    const available = await checkUsernameAvailability(trimmed);
    if (!available) return;

    // Check rate limit
    try {
      const rateLimitRes = await fetch('/api/auth/check-username-rate-limit');
      const rateLimitData = await rateLimitRes.json();
      
      if (!rateLimitData.allowed) {
        setUsernameError(`You can only change your username 3 times per 24 hours. Try again in ${rateLimitData.retryAfter || 'a few hours'}.`);
        return;
      }
    } catch (err) {
      console.error('Error checking rate limit:', err);
    }

    // Update username
    const supa = getSupabaseClient();
    if (!supa) return;

    const { error: updateError } = await supa
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', user.id);

    if (updateError) {
      setUsernameError(updateError.message || 'Failed to update username');
      return;
    }

    // Log audit event
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'username_changed',
        user_id: user.id,
        metadata: { old_username: profile.username, new_username: trimmed },
      }),
    });

    setProfile({ ...profile, username: trimmed });
    setEditingUsername(false);
    setUsernameError('');
  };

  const handleSignOut = async () => {
    const supa = getSupabaseClient();
    if (!supa) return;

    // Log audit event
    if (user) {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'sign_out',
          user_id: user.id,
        }),
      });
    }

    await supa.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#c9d1d9]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + (a.points || 0), 0);

  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/simulation" className="text-[#58a6ff] hover:text-[#4493f8] text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-[#58a6ff] rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                {editingUsername ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] text-center"
                      disabled={usernameChecking}
                    />
                    {usernameError && (
                      <p className="text-sm text-red-400">{usernameError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleUsernameUpdate}
                        disabled={usernameChecking}
                        className="flex-1 px-3 py-1 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] text-sm disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingUsername(false);
                          setNewUsername(profile.username);
                          setUsernameError('');
                        }}
                        className="flex-1 px-3 py-1 bg-[#21262d] text-[#c9d1d9] rounded hover:bg-[#30363d] text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-[#c9d1d9] mb-1">
                      {profile.display_name || profile.username}
                    </h2>
                    <p className="text-[#8b949e] text-sm mb-4">@{profile.username}</p>
                    <button
                      onClick={() => setEditingUsername(true)}
                      className="text-[#58a6ff] hover:text-[#4493f8] text-sm"
                    >
                      Edit username
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-4 border-t border-[#30363d] pt-4">
                <div>
                  <p className="text-xs text-[#8b949e] mb-1">Email</p>
                  <p className="text-sm text-[#c9d1d9]">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8b949e] mb-1">Member since</p>
                  <p className="text-sm text-[#c9d1d9]">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#8b949e] mb-1">Achievements</p>
                  <p className="text-sm text-[#c9d1d9]">
                    {unlockedAchievements.length} unlocked • {totalPoints} points
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full mt-6 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Achievements and Recent Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Achievements */}
            <div>
              <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4">Achievements</h2>
              {unlockedAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unlockedAchievements.map((achievement) => (
                    <AchievementCard 
                      key={achievement.slug} 
                      achievement={achievement as any} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
                  <p className="text-[#8b949e]">No achievements unlocked yet. Complete simulations to earn achievements!</p>
                </div>
              )}
            </div>

            {/* Recent Results */}
            <div>
              <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4">Recent Results</h2>
              {recentResults.length > 0 ? (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#0d1117] border-b border-[#30363d]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#8b949e]">Scenario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#8b949e]">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#8b949e]">Skill Level</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#8b949e]">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-[#8b949e]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.map((result) => (
                        <tr key={result.id} className="border-b border-[#30363d] hover:bg-[#0d1117]">
                          <td className="px-4 py-3 text-sm text-[#c9d1d9]">{result.scenario_name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-[#c9d1d9]">{result.score}%</td>
                          <td className="px-4 py-3 text-sm text-[#c9d1d9]">{result.skill_level || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-[#8b949e]">
                            {new Date(result.completed_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/simulation/feedback/${result.id}`}
                              className="text-[#58a6ff] hover:text-[#4493f8] text-sm"
                            >
                              View Feedback
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
                  <p className="text-[#8b949e]">No results yet. Complete a simulation to see your results here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

