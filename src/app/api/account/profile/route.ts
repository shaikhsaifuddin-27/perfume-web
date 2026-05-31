import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';
import { getRequestMeta } from '@/lib/requestMeta';

const schema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(30).optional().default(''),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name, phone: data.phone },
      select: { id: true, email: true, name: true, phone: true },
    });

    const meta = getRequestMeta(req);
    await auditLog({
      action: 'PROFILE_UPDATE',
      actorUserId: session.user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
