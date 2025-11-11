import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ allowed: false, error: 'Authentication not configured' }, { status: 503 });
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ allowed: false, error: 'Database unavailable' }, { status: 503 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ allowed: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Check username changes in last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: recentChanges, error } = await supabase
      .from('audit_logs')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('event_type', 'username_changed')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (error) {
      console.error('Error checking rate limit:', error);
      return NextResponse.json({ allowed: false, error: 'Failed to check rate limit' }, { status: 500 });
    }

    const changeCount = recentChanges?.length || 0;
    const maxChanges = 3;

    if (changeCount >= maxChanges) {
      // Calculate retry after time
      const oldestChange = recentChanges?.[0];
      if (oldestChange) {
        const retryAfter = new Date(new Date(oldestChange.created_at).getTime() + 24 * 60 * 60 * 1000);
        const hoursUntil = Math.ceil((retryAfter.getTime() - Date.now()) / (1000 * 60 * 60));
        return NextResponse.json({
          allowed: false,
          changeCount,
          maxChanges,
          retryAfter: hoursUntil > 0 ? `${hoursUntil} hours` : 'soon',
        });
      }
    }

    return NextResponse.json({
      allowed: true,
      changeCount,
      maxChanges,
      remaining: maxChanges - changeCount,
    });
  } catch (error: any) {
    console.error('Error in check-username-rate-limit:', error);
    return NextResponse.json({ allowed: false, error: 'Internal server error' }, { status: 500 });
  }
}

