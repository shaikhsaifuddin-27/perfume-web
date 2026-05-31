'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';

export async function updateOrderStatusForm(orderId: string, status: OrderStatus, _formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  await auditLog({
    action: 'ORDER_STATUS_UPDATE',
    actorUserId: session.user.id,
    targetType: 'Order',
    targetId: orderId,
    metadata: { status },
  });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function updateReturnRequestForm(requestId: string, status: 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED', _formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const request = await prisma.returnRequest.update({ where: { id: requestId }, data: { status } });
  if (status === 'APPROVED') {
    await prisma.order.update({ where: { id: request.orderId }, data: { status: 'RETURN_APPROVED' } });
  }
  await auditLog({
    action: 'RETURN_STATUS_UPDATE',
    actorUserId: session.user.id,
    targetType: 'ReturnRequest',
    targetId: requestId,
    metadata: { status },
  });
  revalidatePath('/admin/orders');
}

export async function updateRefundRequestForm(requestId: string, status: 'APPROVED' | 'REJECTED' | 'PROCESSED', _formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const request = await prisma.refundRequest.update({ where: { id: requestId }, data: { status } });
  if (status === 'PROCESSED') {
    await prisma.order.update({ where: { id: request.orderId }, data: { status: 'REFUNDED' } });
  }
  await auditLog({
    action: 'REFUND_STATUS_UPDATE',
    actorUserId: session.user.id,
    targetType: 'RefundRequest',
    targetId: requestId,
    metadata: { status },
  });
  revalidatePath('/admin/orders');
}
