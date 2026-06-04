import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credentialId, publicKeyPem } = await req.json();
    if (!credentialId || !publicKeyPem) {
      return NextResponse.json({ error: 'Missing credential credentials' }, { status: 400 });
    }

    let storedChallenge = null;
    if (redisUrl && redisToken) {
      const res = await fetch(`${redisUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', `webauthn:register-challenge:${session.user.id}`]),
      });
      if (res.ok) {
        const data = await res.json();
        storedChallenge = data?.result;
      }
    }

    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Registration challenge expired or missing. Please try again.' },
        { status: 400 }
      );
    }

    // Save Passkey to DB
    await prisma.passkey.create({
      data: {
        credentialId,
        publicKey: publicKeyPem,
        userId: session.user.id,
      },
    });

    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['DEL', `webauthn:register-challenge:${session.user.id}`]),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('WebAuthn register verify error', error);
    return NextResponse.json({ error: 'Failed to verify registration.' }, { status: 500 });
  }
}
