// API route for achievements

import { NextResponse } from 'next/server';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/definitions';
import { getUserAchievements } from '@/lib/achievements/storage';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Get user session (optional - works without auth)
    let userId: string | null = null;
    
    if (isSupabaseEnabled()) {
      const supabase = await getSupabaseClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }
    }

    // Get user's unlocked achievements
    const userAchievements = await getUserAchievements(userId || undefined);
    const unlockedSlugs = new Set(userAchievements.map(a => a.slug));

    // Combine definitions with unlock status
    const achievementsWithStatus = ACHIEVEMENT_DEFINITIONS.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.slug === achievement.slug);
      return {
        ...achievement,
        unlocked: unlockedSlugs.has(achievement.slug),
        unlockedAt: userAchievement?.unlocked_at || null,
        progress: userAchievement?.progress || 0,
      };
    });

    // Calculate totals
    const unlockedAchievements = achievementsWithStatus.filter(a => a.unlocked);
    const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

    return NextResponse.json({
      achievements: achievementsWithStatus,
      stats: {
        total: ACHIEVEMENT_DEFINITIONS.length,
        unlocked: unlockedAchievements.length,
        totalPoints,
        progress: Math.round((unlockedAchievements.length / ACHIEVEMENT_DEFINITIONS.length) * 100),
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

