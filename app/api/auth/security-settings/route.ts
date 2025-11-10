import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ 
        twoFactorEnabled: false,
        twoFactorVerifiedAt: null,
        trustedDevices: []
      });
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ 
        twoFactorEnabled: false,
        twoFactorVerifiedAt: null,
        trustedDevices: []
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's 2FA status
    const { data: user2FA, error } = await supabase
      .from('user_2fa')
      .select('two_factor_enabled, two_factor_verified_at')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Security settings error:', error);
      throw error;
    }
    
    // Get trusted devices
    const { data: devices } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('last_used', { ascending: false });
    
    return NextResponse.json({
      twoFactorEnabled: user2FA?.two_factor_enabled || false,
      twoFactorVerifiedAt: user2FA?.two_factor_verified_at || null,
      trustedDevices: devices || []
    });
  } catch (error) {
    console.error('Security settings error:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

