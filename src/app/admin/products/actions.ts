'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { saveProductImage } from '@/lib/productImageUpload';
import { auditLog } from '@/lib/audit';

/** Reusable auth guard for all admin server actions */
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

const productSchema = z.object({
  name: z.string().min(2, 'Name too short').max(200),
  description: z.string().min(10, 'Description too short').max(5000),
  tagline: z.string().max(200).default(''),
  price: z.coerce.number().positive().max(100000),
  categoryId: z.string().min(1, 'Category required'),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  badge: z.string().max(50).optional(),
});

export async function createProduct(formData: FormData) {
  try {
    const session = await requireAdmin();

    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      tagline: formData.get('tagline') ?? '',
      price: formData.get('price'),
      categoryId: formData.get('categoryId'),
      isBestSeller: formData.get('isBestSeller') === 'on',
      isNew: formData.get('isNew') === 'on',
      badge: formData.get('badge') ?? undefined,
    };

    const data = productSchema.parse(raw);
    const image = await saveProductImage(formData.get('image'));

    if (!image) {
      return { error: 'Product image is required' };
    }

    await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        tagline: data.tagline,
        image,
        categoryId: data.categoryId,
        isBestSeller: data.isBestSeller,
        isNew: data.isNew,
        badge: data.badge,
        sizes: {
          create: [
            { ml: 50, price: data.price },
            { ml: 100, price: Math.round(data.price * 1.55 * 100) / 100 },
          ],
        },
      },
    });
    await auditLog({ action: 'PRODUCT_CREATE', actorUserId: session.user.id, targetType: 'Product', metadata: { name: data.name } });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    console.error('createProduct error:', error);
    return { error: 'Failed to create product' };
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { error: 'Invalid product ID' };
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false, archivedAt: new Date(), deletedAt: new Date() },
    });
    await auditLog({ action: 'PRODUCT_ARCHIVE', actorUserId: session.user.id, targetType: 'Product', targetId: id });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('deleteProduct error:', error);
    return { error: 'Failed to delete product' };
  }
}

/** Form Action wrapper for deleting products to keep TypeScript happy with bound forms */
export async function deleteProductForm(id: string, formData: FormData) {
  await deleteProduct(id);
}

export async function updateInventory(productId: string, sizeId: string, stock: number) {
  try {
    const session = await requireAdmin();

    if (!productId || !sizeId) return { error: 'Invalid IDs' };
    if (typeof stock !== 'number' || stock < 0 || stock > 99999) {
      return { error: 'Invalid stock value' };
    }

    await prisma.productSize.update({
      where: { id: sizeId },
      data: { stock },
    });
    await auditLog({
      action: 'INVENTORY_UPDATE',
      actorUserId: session.user.id,
      targetType: 'ProductSize',
      targetId: sizeId,
      metadata: { productId, stock },
    });

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error('updateInventory error:', error);
    return { error: 'Failed to update inventory' };
  }
}
