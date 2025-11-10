import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto/encryption';
import { hashBackupCode } from '@/lib/auth/backup-codes';

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
    
    const { secret, token, backupCodes } = await request.json();
    
    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }
    
    // Encrypt secret and hash backup codes
    const encryptedSecret = encrypt(secret);
    const hashedBackupCodes = backupCodes.map((code: string) => hashBackupCode(code));
    
    // Save to database - using user_2fa table from our schema
    const { error: updateError } = await supabase
      .from('user_2fa')
      .upsert({
        user_id: user.id,
        two_factor_enabled: true,
        two_factor_secret: encryptedSecret,
        two_factor_backup_codes: hashedBackupCodes,
        two_factor_verified_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (updateError) {
      console.error('2FA enable database error:', updateError);
      throw updateError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}

