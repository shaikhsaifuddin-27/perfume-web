import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getRequestMeta } from '@/lib/requestMeta';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { consentType, status } = await req.json();
    if (!consentType || !status) {
      return NextResponse.json({ error: 'Missing consent details' }, { status: 400 });
    }

    const meta = getRequestMeta(req);

    const record = await prisma.consentRecord.create({
      data: {
        userId: session.user.id,
        consentType,
        status,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    logger.error('Log consent error', error);
    return NextResponse.json({ error: 'Failed to record consent.' }, { status: 500 });
  }
}
