import type { NextRequest } from 'next/server';

export function getRequestMeta(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  return {
    ip: forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null,
    userAgent: req.headers.get('user-agent'),
  };
}
