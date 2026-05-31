'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { saveProductImage } from '@/lib/productImageUpload';

export async function updateProduct(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') throw new Error('Unauthorized');

  const uploadedImage = await saveProductImage(formData.get('image'));
  const currentImage = (formData.get('currentImage') as string) || '/product_noir.png';

  await prisma.product.update({
    where: { id },
    data: {
      name: formData.get('name') as string,
      tagline: (formData.get('tagline') as string) ?? '',
      description: formData.get('description') as string,
      image: uploadedImage ?? currentImage,
      badge: (formData.get('badge') as string) || null,
      isBestSeller: formData.get('isBestSeller') === 'on',
      isNew: formData.get('isNew') === 'on',
      categoryId: formData.get('categoryId') as string,
    },
  });

  revalidatePath('/admin/products');
  revalidatePath('/shop');
  revalidatePath('/');
  redirect('/admin/products');
}
