'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export async function updateOrderStatusForm(orderId: string, status: OrderStatus, _formData: FormData) {
  const session = await getServerSession(authOptions);
  const allowed = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];
  if (!session || !allowed.includes(session.user.role)) throw new Error('Unauthorized');

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
  const allowed = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];
  if (!session || !allowed.includes(session.user.role)) throw new Error('Unauthorized');

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
  const allowed = ['ADMIN', 'SUPER_ADMIN'];
  if (!session || !allowed.includes(session.user.role)) throw new Error('Unauthorized');

  const refundRequest = await prisma.refundRequest.findUnique({
    where: { id: requestId },
    include: { order: true },
  });

  if (!refundRequest) throw new Error('Refund request not found');

  if (status === 'APPROVED') {
    const isHighValue = refundRequest.amount > 500;
    
    if (isHighValue) {
      if (!refundRequest.approvedById) {
        // First approval
        await prisma.refundRequest.update({
          where: { id: requestId },
          data: { approvedById: session.user.id },
        });
      } else if (refundRequest.approvedById === session.user.id) {
        throw new Error('Dual approval required: A different administrator must approve.');
      } else {
        // Second approval matches
        await prisma.refundRequest.update({
          where: { id: requestId },
          data: { secondApprovedById: session.user.id, status: 'APPROVED' },
        });
      }
    } else {
      // Single approval sufficient
      await prisma.refundRequest.update({
        where: { id: requestId },
        data: { approvedById: session.user.id, status: 'APPROVED' },
      });
    }
  } else if (status === 'PROCESSED') {
    // Verify approvals are met
    if (refundRequest.amount > 500 && (!refundRequest.approvedById || !refundRequest.secondApprovedById)) {
      throw new Error('Cannot process refund: Dual approval criteria not satisfied.');
    }

    // Call Stripe Refund API
    if (refundRequest.order.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: refundRequest.order.paymentIntentId,
          amount: Math.round(refundRequest.amount * 100),
        });
      } catch (err: unknown) {
        throw new Error(`Stripe Refund failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await prisma.refundRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSED' },
    });

    await prisma.order.update({
      where: { id: refundRequest.orderId },
      data: { status: 'REFUNDED' },
    });
  } else {
    // REJECTED
    await prisma.refundRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  await auditLog({
    action: 'REFUND_STATUS_UPDATE',
    actorUserId: session.user.id,
    targetType: 'RefundRequest',
    targetId: requestId,
    metadata: { status, amount: refundRequest.amount },
  });
  revalidatePath('/admin/orders');
}

