import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateChallenge } from '@/lib/webauthn';
import { logger } from '@/lib/logger';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { passkeys: true },
    });

    if (!user || user.passkeys.length === 0) {
      return NextResponse.json({ error: 'No passkeys registered for this account.' }, { status: 404 });
    }

    const challenge = generateChallenge();

    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', `webauthn:login-challenge:${normalizedEmail}`, challenge, 'EX', '300']),
      });
    }

    return NextResponse.json({
      challenge,
      allowCredentials: user.passkeys.map((p) => ({
        type: 'public-key',
        id: p.credentialId,
      })),
    });
  } catch (error) {
    logger.error('WebAuthn login options error', error);
    return NextResponse.json({ error: 'Failed to generate options.' }, { status: 500 });
  }
}
