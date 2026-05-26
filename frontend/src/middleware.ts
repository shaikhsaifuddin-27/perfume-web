import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting (works for single-instance dev/staging)
// For production multi-instance deployments, replace with Upstash Redis:
// import { Ratelimit } from '@upstash/ratelimit';
// import { Redis } from '@upstash/redis';
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 100;
const WINDOW = 60 * 1000; // 1 minute

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const data = rateLimit.get(ip) ?? { count: 0, lastReset: now };
  if (now - data.lastReset > WINDOW) {
    data.count = 0;
    data.lastReset = now;
  }
  data.count += 1;
  rateLimit.set(ip, data);
  return data.count <= LIMIT;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Rate limiting on API and admin routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin/')) {
    if (!checkRateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const response = NextResponse.next();

  // Security headers on every response
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.stripe.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
      "frame-src https://checkout.stripe.com https://js.stripe.com",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
