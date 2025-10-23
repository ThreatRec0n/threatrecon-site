import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Basic CSRF token for POSTs from our domain only
  if (req.method === 'POST') {
    const origin = req.headers.get('origin') || '';
    const host = req.headers.get('host') || '';
    if (!origin.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
