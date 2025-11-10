import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function GET() {
  try {
    const health: {
      status: string;
      timestamp: string;
      version?: string;
      services: {
        database: string;
      };
    } = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown'
      }
    };

    // Check database connection if Supabase is enabled
    if (isSupabaseEnabled()) {
      try {
        const supabase = await getSupabaseClient();
        if (supabase) {
          // Simple query to test connection
          const { error } = await supabase.from('user_progress').select('id').limit(1);
          health.services.database = error ? 'degraded' : 'healthy';
        } else {
          health.services.database = 'unavailable';
        }
      } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
      }
    } else {
      health.services.database = 'not_configured';
    }

    // If any service is unhealthy, return 503
    if (health.services.database === 'unhealthy') {
      return NextResponse.json(health, { status: 503 });
    }

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Service degraded',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

