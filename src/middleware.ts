import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; lastReset: number }>();
const WINDOW_SECONDS = 60;

const POLICIES: { matcher: (path: string) => boolean; limit: number; name: string }[] = [
  { name: 'auth', limit: 10, matcher: (path) => path.startsWith('/api/auth/') },
  { name: 'checkout', limit: 20, matcher: (path) => path.startsWith('/api/checkout') },
  { name: 'admin', limit: 80, matcher: (path) => path.startsWith('/api/admin') || path.startsWith('/admin') },
  { name: 'api', limit: 120, matcher: (path) => path.startsWith('/api/') },
];

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
}

async function checkUpstashRateLimit(key: string, limit: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redisKey = `rl:${key}:${Math.floor(Date.now() / (WINDOW_SECONDS * 1000))}`;
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(WINDOW_SECONDS)],
    ]),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const count = Number(data?.[0]?.result ?? 0);
  return count <= limit;
}

function checkLocalRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const data = rateLimit.get(key) ?? { count: 0, lastReset: now };
  if (now - data.lastReset > WINDOW_SECONDS * 1000) {
    data.count = 0;
    data.lastReset = now;
  }
  data.count += 1;
  rateLimit.set(key, data);
  return data.count <= limit;
}

function isStateChanging(method: string) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function isAllowedOrigin(request: NextRequest) {
  if (!isStateChanging(request.method)) return true;
  if (request.nextUrl.pathname === '/api/checkout/webhook') return true;

  const origin = request.headers.get('origin');
  if (!origin) return true;

  const allowed = new Set([
    request.nextUrl.origin,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ].filter(Boolean));

  return allowed.has(origin);
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const policy = POLICIES.find((item) => item.matcher(pathname));
  if (policy) {
    const key = `${policy.name}:${ip}`;
    const distributed = await checkUpstashRateLimit(key, policy.limit);
    const allowed = distributed ?? checkLocalRateLimit(key, policy.limit);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' https://checkout.stripe.com https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://api.resend.com",
      "frame-src https://checkout.stripe.com https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
