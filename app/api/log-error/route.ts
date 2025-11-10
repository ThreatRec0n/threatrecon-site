import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { error, stack, componentStack, url, userAgent } = await request.json();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', {
        error,
        stack,
        componentStack,
        url,
        userAgent
      });
    }
    
    // In production, you would log to an external service like Sentry
    // For now, we'll just acknowledge receipt
    // TODO: Integrate with Sentry or similar service
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}

