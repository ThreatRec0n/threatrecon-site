import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const enabled = isSupabaseEnabled();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const result = {
      enabled,
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length || 0,
      keyLength: key?.length || 0,
      urlPreview: url ? `${url.substring(0, 20)}...` : null,
      clientAvailable: false,
      connectionTest: null as any,
    };

    if (enabled) {
      const client = getSupabaseClient();
      result.clientAvailable = !!client;

      if (client) {
        try {
          // Test connection by getting auth session (doesn't require auth)
          const { data, error } = await client.auth.getSession();
          result.connectionTest = {
            success: !error,
            error: error?.message || null,
            hasSession: !!data?.session,
          };
        } catch (err: any) {
          result.connectionTest = {
            success: false,
            error: err.message,
          };
        }
      }
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        enabled: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

