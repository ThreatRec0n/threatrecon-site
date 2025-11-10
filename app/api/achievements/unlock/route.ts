// API route to check and unlock achievements

import { NextResponse } from 'next/server';
import { checkAndUnlockAchievements, updateStatsForEvent } from '@/lib/achievements/checker';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, eventData } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // Get user session
    let userId: string | null = null;
    
    if (isSupabaseEnabled()) {
      const supabase = await getSupabaseClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }
    }

    // Update stats for the event
    updateStatsForEvent(eventType, eventData);

    // Check and unlock achievements
    const unlockedAchievements = await checkAndUnlockAchievements(
      userId,
      eventType,
      eventData
    );

    return NextResponse.json({
      unlocked: unlockedAchievements,
      count: unlockedAchievements.length,
    });
  } catch (error) {
    console.error('Error unlocking achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}

