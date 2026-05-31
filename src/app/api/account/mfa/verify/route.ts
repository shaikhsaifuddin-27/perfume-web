import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createRecoveryCodes, verifyMfaToken } from '@/lib/mfa';
import { auditLog } from '@/lib/audit';

const schema = z.object({ token: z.string().min(6).max(8) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { token } = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.mfaSecret || !verifyMfaToken(token, user.mfaSecret)) {
    return NextResponse.json({ error: 'Invalid MFA code' }, { status: 400 });
  }

  const recovery = await createRecoveryCodes();
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } }),
    prisma.mfaRecoveryCode.deleteMany({ where: { userId: user.id } }),
    prisma.mfaRecoveryCode.createMany({
      data: recovery.hashed.map((codeHash) => ({ userId: user.id, codeHash })),
    }),
  ]);
  await auditLog({ action: 'MFA_ENABLED', actorUserId: user.id });

  return NextResponse.json({ recoveryCodes: recovery.codes });
}
