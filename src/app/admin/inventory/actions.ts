'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auditLog } from '@/lib/audit';

export async function adjustStock(formData: FormData) {
  const sizeId = formData.get('sizeId') as string;
  const newStock = parseInt(formData.get('stock') as string, 10);

  if (!sizeId || isNaN(newStock) || newStock < 0) return;

  await prisma.productSize.update({
    where: { id: sizeId },
    data: { stock: newStock },
  });
  await auditLog({
    action: 'INVENTORY_UPDATE',
    targetType: 'ProductSize',
    targetId: sizeId,
    metadata: { stock: newStock },
  });

  revalidatePath('/admin/inventory');
  revalidatePath('/admin');
}
