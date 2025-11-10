import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';
import { generateBackupCodes } from '@/lib/auth/backup-codes';

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
    
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `ThreatRecon (${user.email})`,
      issuer: 'ThreatRecon',
      length: 32
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    
    // Generate 10 backup codes
    const backupCodes = generateBackupCodes(10);
    
    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}

