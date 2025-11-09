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
        // Store IOC tags if provided
        if (config?.ioc_tags) {
          // In a real implementation, we'd store this in the session
          // For now, we'll just complete the session
          // The evaluation happens on the client side
        }
        engine.completeSession();
        const completedSession = engine.getSession();
        return NextResponse.json({ 
          success: true,
          session: completedSession,
        });

      case 'execute_attack':
        // Execute an Atomic Red Team technique
        const techniqueId = config?.technique_id;
        if (!techniqueId) {
          return NextResponse.json(
            { success: false, error: 'technique_id required' },
            { status: 400 }
          );
        }
        // In a real implementation, this would execute the technique and generate events
        // For now, we'll simulate it by adding events to the session
        const attackEvents = engine.executeAtomicTechnique(techniqueId, config?.session_id);
        return NextResponse.json({
          success: true,
          events: attackEvents,
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

