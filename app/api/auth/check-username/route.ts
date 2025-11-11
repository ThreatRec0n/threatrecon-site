import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Normalize to lowercase for uniqueness check
    const normalizedUsername = username.toLowerCase().trim();

    // Validate format
    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return NextResponse.json({ available: false, reason: 'Invalid length' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json({ available: false, reason: 'Invalid format' });
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    // Check if username exists (case-insensitive)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', normalizedUsername)
      .limit(1);

    if (error) {
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !data || data.length === 0,
    });
  } catch (error: any) {
    console.error('Error in check-username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

