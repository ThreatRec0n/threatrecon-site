import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ANALYTICS_DIR = path.join(process.cwd(), 'data');
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, 'analytics.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;
    const validToken = process.env.ANALYTICS_TOKEN || 'threatrecon-analytics-2024';
    
    if (token !== validToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Reset analytics to initial state
    const resetData = {
      events: [],
      admin_visits: 0,
      admin_attempts: 0,
      admin_successes: 0,
      simulation_visits: 0,
      unique_ips: [],
      ip_attempts: {},
    };
    
    if (!existsSync(ANALYTICS_DIR)) {
      await mkdir(ANALYTICS_DIR, { recursive: true });
    }
    
    await writeFile(ANALYTICS_FILE, JSON.stringify(resetData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

