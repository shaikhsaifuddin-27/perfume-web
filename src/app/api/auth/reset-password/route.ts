import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { getRequestMeta } from '@/lib/requestMeta';
import { hashResetToken } from '@/lib/passwordReset';

const schema = z.object({
  token: z.string().min(20),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);

  try {
    const { token, password } = schema.parse(await req.json());
    const tokenHash = hashResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Reset token is invalid or expired.' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: await bcrypt.hash(password, 12) },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await auditLog({
      action: 'PASSWORD_RESET_COMPLETE',
      actorUserId: resetToken.userId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ message: 'Password reset complete.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((i) => i.message).join(', ') }, { status: 400 });
    }
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Unable to reset password.' }, { status: 500 });
  }
}
