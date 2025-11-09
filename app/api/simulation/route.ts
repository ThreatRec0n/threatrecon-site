// API route for simulation engine

import { NextRequest, NextResponse } from 'next/server';
import { getSimulationEngine } from '@/lib/simulation-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    const engine = getSimulationEngine();

    switch (action) {
      case 'initialize':
        const session = engine.initializeSession(config || {});
        
        // Add benign events for noise
        if (config?.add_noise !== false) {
          engine.addBenignEvents(config?.noise_count || 50);
        }

        return NextResponse.json({ 
          success: true, 
          session,
        });

      case 'get_events':
        const events = engine.getEvents(config?.filters);
        return NextResponse.json({ 
          success: true, 
          events,
        });

      case 'get_related_events':
        const relatedEvents = engine.getRelatedEvents(config?.event_id);
        return NextResponse.json({ 
          success: true, 
          events: relatedEvents,
        });

      case 'get_session':
        const currentSession = engine.getSession();
        return NextResponse.json({ 
          success: true, 
          session: currentSession,
        });

      case 'complete':
        engine.completeSession();
        const completedSession = engine.getSession();
        return NextResponse.json({ 
          success: true,
          session: completedSession,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Simulation API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

