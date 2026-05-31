import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createMfaSecret } from '@/lib/mfa';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { secret, otpauthUrl } = createMfaSecret(session.user.email ?? session.user.id);
  await prisma.user.update({ where: { id: session.user.id }, data: { mfaSecret: secret } });
  return NextResponse.json({ otpauthUrl });
}
