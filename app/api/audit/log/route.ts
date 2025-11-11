import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ success: false, error: 'Not configured' }, { status: 503 });
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, metadata } = body;

    if (!event_type) {
      return NextResponse.json({ success: false, error: 'event_type is required' }, { status: 400 });
    }

    // Get IP address from headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Insert audit log
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        event_type,
        metadata: metadata || {},
        ip_address: ip,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting audit log:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to log event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in audit log:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

