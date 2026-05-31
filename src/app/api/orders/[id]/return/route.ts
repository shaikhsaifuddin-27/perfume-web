import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';
import { getRequestMeta } from '@/lib/requestMeta';

const schema = z.object({ reason: z.string().min(5).max(1000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { reason } = schema.parse(await req.json());
  const order = await prisma.order.findFirst({ where: { id, userId: session.user.id } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'DELIVERED') {
    return NextResponse.json({ error: 'Only delivered orders can be returned.' }, { status: 400 });
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.returnRequest.create({ data: { orderId: id, userId: session.user.id, reason } });
    await tx.order.update({ where: { id }, data: { status: 'RETURN_REQUESTED' } });
    return created;
  });

  const meta = getRequestMeta(req);
  await auditLog({
    action: 'RETURN_REQUEST',
    actorUserId: session.user.id,
    targetType: 'ReturnRequest',
    targetId: request.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ request });
}
