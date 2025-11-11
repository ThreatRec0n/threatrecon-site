import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ANALYTICS_DIR = path.join(process.cwd(), 'data');
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, 'analytics.json');

// Initialize analytics file if it doesn't exist
async function ensureAnalyticsFile() {
  if (!existsSync(ANALYTICS_DIR)) {
    await mkdir(ANALYTICS_DIR, { recursive: true });
  }
  
  if (!existsSync(ANALYTICS_FILE)) {
    await writeFile(ANALYTICS_FILE, JSON.stringify({
      events: [],
      admin_visits: 0,
      admin_attempts: 0,
      admin_successes: 0,
      simulation_visits: 0,
      unique_ips: new Set(),
      ip_attempts: {},
    }, null, 2));
  }
}

// Get client IP from request
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // For Vercel/serverless, file system might not be available
    // Use in-memory storage or just log for now
    const body = await request.json();
    const ip = getClientIP(request);
    const timestamp = body.timestamp || new Date().toISOString();
    
    // Log analytics event (can integrate with external service later)
    console.log('Analytics event:', {
      event: body.event,
      ip,
      timestamp,
      ...body,
    });
    
    // Try to write to file if possible, but don't fail if it doesn't work
    try {
      await ensureAnalyticsFile();
      const fileContent = await readFile(ANALYTICS_FILE, 'utf-8');
      const analytics = JSON.parse(fileContent);
      
      // Initialize sets and objects if they don't exist
      if (!analytics.unique_ips) analytics.unique_ips = [];
      if (!analytics.ip_attempts) analytics.ip_attempts = {};
      
      // Convert unique_ips array to Set for processing, then back to array
      const uniqueIPsSet = new Set(analytics.unique_ips);
      uniqueIPsSet.add(ip);
      analytics.unique_ips = Array.from(uniqueIPsSet);
      
      // Track event
      const event = {
        ...body,
        ip,
        timestamp,
      };
      
      analytics.events.push(event);
      
      // Update counters
      if (body.event === 'admin_page_visit') {
        analytics.admin_visits = (analytics.admin_visits || 0) + 1;
      } else if (body.event === 'admin_failed_attempt') {
        analytics.admin_attempts = (analytics.admin_attempts || 0) + 1;
        analytics.ip_attempts[ip] = (analytics.ip_attempts[ip] || 0) + 1;
      } else if (body.event === 'admin_compromise') {
        analytics.admin_successes = (analytics.admin_successes || 0) + 1;
        analytics.ip_attempts[ip] = (analytics.ip_attempts[ip] || 0) + 1;
      } else if (body.event === 'simulation_visit') {
        analytics.simulation_visits = (analytics.simulation_visits || 0) + 1;
      }
      
      // Keep only last 1000 events to prevent file from growing too large
      if (analytics.events.length > 1000) {
        analytics.events = analytics.events.slice(-1000);
      }
      
      // Write back to file
      await writeFile(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
    } catch (fileError: any) {
      // File system not available (e.g., Vercel serverless) - that's okay
      console.warn('Could not write analytics to file (serverless environment):', fileError.message);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics error:', error);
    // Don't fail the request if analytics fails
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureAnalyticsFile();
    
    // Check for access token (simple protection)
    const token = request.nextUrl.searchParams.get('token');
    const validToken = process.env.ANALYTICS_TOKEN || 'threatrecon-analytics-2024';
    
    if (token !== validToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const fileContent = await readFile(ANALYTICS_FILE, 'utf-8');
    const analytics = JSON.parse(fileContent);
    
    // Calculate top IPs by attempts
    const topIPs = Object.entries(analytics.ip_attempts || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([ip, count]: [string, any]) => ({ ip, count }));
    
    return NextResponse.json({
      ...analytics,
      top_ips: topIPs,
    });
  } catch (error: any) {
    console.error('Analytics read error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

