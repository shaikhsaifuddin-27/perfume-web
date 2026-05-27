'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OrderStatus } from '@prisma/client';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    await requireAdmin();

    if (!orderId) {
      return { error: 'Invalid order ID' };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return { error: 'Failed to update order status' };
  }
}

export async function updateOrderStatusForm(orderId: string, status: OrderStatus, formData: FormData) {
  await updateOrderStatus(orderId, status);
}
