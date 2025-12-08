import { NextRequest, NextResponse } from 'next/server';
import { getSimulationEngine } from '@/lib/simulation-engine';

export async function POST(request: NextRequest) {
  try {
    const { action, config } = await request.json();
    const engine = getSimulationEngine();
    
    if (action === 'initialize') {
      const session = engine.createSession({
        difficulty: config?.difficulty || 'Intermediate',
        scenario_type: config?.scenario_type || 'ransomware'
      });
      
      return NextResponse.json({ success: true, session });
    }
    
    if (action === 'get_session') {
      const session = engine.getSession();
      return NextResponse.json({ success: true, session });
    }
    
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Simulation API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
