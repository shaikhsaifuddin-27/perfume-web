import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateChallenge } from '@/lib/webauthn';
import { logger } from '@/lib/logger';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challenge = generateChallenge();

    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', `webauthn:register-challenge:${session.user.id}`, challenge, 'EX', '300']),
      });
    }

    return NextResponse.json({
      challenge,
      rp: { name: 'Maison Élara', id: 'localhost' },
      user: {
        id: session.user.id,
        name: session.user.email ?? '',
        displayName: session.user.name ?? '',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
    });
  } catch (error) {
    logger.error('WebAuthn register options error', error);
    return NextResponse.json({ error: 'Failed to generate options.' }, { status: 500 });
  }
}
