import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';
import { getRequestMeta } from '@/lib/requestMeta';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!['PENDING', 'PROCESSING'].includes(order.status)) {
    return NextResponse.json({ error: 'Order can no longer be cancelled.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } }),
    ...order.items.map((item) =>
      prisma.productSize.update({
        where: { id: item.productSizeId },
        data: { stock: { increment: item.quantity } },
      })
    ),
  ]);

  const meta = getRequestMeta(req);
  await auditLog({
    action: 'ORDER_CANCEL',
    actorUserId: session.user.id,
    targetType: 'Order',
    targetId: id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ message: 'Order cancelled.' });
}
