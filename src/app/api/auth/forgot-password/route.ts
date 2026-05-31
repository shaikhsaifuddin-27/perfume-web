import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { getRequestMeta } from '@/lib/requestMeta';
import { createResetToken, hashResetToken } from '@/lib/passwordReset';
import { sendEmail } from '@/lib/email';

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const meta = getRequestMeta(req);

  try {
    const { email } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = createResetToken();
      const tokenHash = hashResetToken(token);
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      await sendEmail({
        to: user.email,
        subject: 'Reset your Maison Elara password',
        text: `Reset your password: ${baseUrl}/reset-password?token=${token}`,
      });

      await auditLog({
        action: 'PASSWORD_RESET_REQUEST',
        actorUserId: user.id,
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
    }

    return NextResponse.json({ message: 'If an account exists, a password reset link has been sent.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Unable to process password reset.' }, { status: 500 });
  }
}
