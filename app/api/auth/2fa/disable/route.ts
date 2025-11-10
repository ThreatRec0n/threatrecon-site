import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ error: 'Authentication not available' }, { status: 503 });
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Authentication not available' }, { status: 503 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Disable 2FA
    const { error: updateError } = await supabase
      .from('user_2fa')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
        two_factor_verified_at: null
      })
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('2FA disable database error:', updateError);
      throw updateError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

