import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limiting storage (in-memory, for production use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or a combination of IP + user agent
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  return `${ip}-${userAgent.slice(0, 50)}`;
}

function checkRateLimit(key: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/onboarding'];
const protectedApiRoutes = ['/api/simulation/submit', '/api/achievements/unlock'];

async function getSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  // Get session from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Security headers (additional to next.config.mjs)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    if (!checkRateLimit(key, 60, 60000)) { // 60 requests per minute
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute || isProtectedApiRoute) {
    const user = await getSession(request);
    
    if (!user) {
      // Redirect to auth page with return URL
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // For onboarding, check if username is set
    if (pathname.startsWith('/onboarding/username')) {
      // Allow access to onboarding
      return response;
    }

    // For other protected routes, verify profile exists
    if (pathname !== '/onboarding/username') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
          },
        });

        const accessToken = request.cookies.get('sb-access-token')?.value;
        if (accessToken) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();

            // If no profile or username starts with 'user_', redirect to onboarding
            if (!profile || !profile.username || profile.username.startsWith('user_')) {
              if (pathname !== '/onboarding/username') {
                return NextResponse.redirect(new URL('/onboarding/username', request.url));
              }
            }
          } catch {
            // If profile check fails, allow through (will be handled by page)
          }
        }
      }
    }
  }

  // Validate request headers
  const userAgent = request.headers.get('user-agent');
  if (userAgent && userAgent.length > 500) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

