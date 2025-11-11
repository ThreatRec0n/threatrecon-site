// API route for health checks and Supabase connection testing

import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Basic health check
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'threatrecon-api',
      version: '1.0.0',
    };

    // Check Supabase configuration
    const supabaseEnabled = isSupabaseEnabled();
    health.supabase = {
      configured: supabaseEnabled,
    };

    // Check database connectivity if Supabase is enabled
    if (supabaseEnabled) {
      const supabase = await getSupabaseClient();
      if (supabase) {
        try {
          // Test basic connection
          const { error: connectionError } = await supabase.from('user_progress').select('id').limit(1);
          
          if (connectionError) {
            if (connectionError.code === 'PGRST116') {
              health.database = {
                connected: true,
                status: 'connected',
                tables: 'missing',
                message: 'Connected to Supabase, but tables not found. Run supabase-schema-complete.sql',
                error_code: connectionError.code,
              };
            } else {
              health.database = {
                connected: false,
                status: 'error',
                error: connectionError.message,
                error_code: connectionError.code,
              };
            }
          } else {
            // Test all required tables
            const tables = [
              'user_progress',
              'simulation_results',
              'simulation_completions',
              'achievements',
              'user_achievements',
              'user_2fa',
              'trusted_devices',
              'user_sessions',
              'audit_logs',
            ];

            const tableStatus: Record<string, boolean> = {};
            let tablesFound = 0;

            for (const table of tables) {
              const { error } = await supabase.from(table).select('id').limit(1);
              const exists = !error || error.code !== 'PGRST116';
              tableStatus[table] = exists;
              if (exists) tablesFound++;
            }

            health.database = {
              connected: true,
              status: 'fully_connected',
              tables: {
                total: tables.length,
                found: tablesFound,
                missing: tables.length - tablesFound,
                status: tableStatus,
              },
            };

            // Test authentication endpoint
            try {
              const { data: authData, error: authError } = await supabase.auth.getSession();
              health.authentication = {
                accessible: !authError,
                has_session: !!authData?.session,
                error: authError?.message,
              };
            } catch (authErr: any) {
              health.authentication = {
                accessible: false,
                error: authErr.message,
              };
            }

            // Test RLS (should deny access without auth)
            const { error: rlsError } = await supabase.from('user_progress').select('*');
            health.rls = {
              enabled: rlsError && (rlsError.code === '42501' || rlsError.message.includes('permission')),
              status: rlsError && (rlsError.code === '42501' || rlsError.message.includes('permission')) 
                ? 'working' 
                : 'check_needed',
            };
          }
        } catch (dbError: any) {
          health.database = {
            connected: false,
            status: 'error',
            error: dbError.message,
          };
        }
      } else {
        health.database = {
          connected: false,
          status: 'client_unavailable',
          error: 'Supabase client not available',
        };
      }
    } else {
      health.database = {
        connected: false,
        status: 'not_configured',
        reason: 'Supabase not configured (missing environment variables)',
      };
    }

    // Determine overall status
    const isHealthy = health.status === 'healthy' && 
                   (health.database?.connected || !supabaseEnabled);

    return NextResponse.json(health, { 
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
