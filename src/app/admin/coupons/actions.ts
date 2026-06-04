'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const allowed = ['ADMIN', 'SUPER_ADMIN'];
  if (!session || !allowed.includes(session.user.role)) throw new Error('Unauthorized');
  return session;
}

export async function createCoupon(formData: FormData) {
  const session = await requireAdmin();
  const code = (formData.get('code') as string)?.toUpperCase().trim();
  const discount = parseFloat(formData.get('discount') as string);
  const isFixed = formData.get('isFixed') === 'true';
  const expiryRaw = formData.get('expiresAt') as string;
  const expiresAt = expiryRaw ? new Date(expiryRaw) : null;
  const usageLimitRaw = formData.get('usageLimit') as string;
  const perUserLimitRaw = formData.get('perUserLimit') as string;

  if (!code || isNaN(discount) || discount <= 0) return;

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discount,
      isFixed,
      expiresAt,
      usageLimit: usageLimitRaw ? parseInt(usageLimitRaw, 10) : null,
      perUserLimit: perUserLimitRaw ? parseInt(perUserLimitRaw, 10) : 1,
      isActive: true,
    },
  });
  await auditLog({ action: 'COUPON_CREATE', actorUserId: session.user.id, targetType: 'Coupon', targetId: coupon.id });

  revalidatePath('/admin/coupons');
}

export async function toggleCoupon(id: string, _formData: FormData) {
  const session = await requireAdmin();
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return;
  await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
  await auditLog({ action: 'COUPON_UPDATE', actorUserId: session.user.id, targetType: 'Coupon', targetId: id });
  revalidatePath('/admin/coupons');
}

export async function deleteCoupon(id: string, _formData: FormData) {
  const session = await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { isActive: false, archivedAt: new Date() } });
  await auditLog({ action: 'COUPON_ARCHIVE', actorUserId: session.user.id, targetType: 'Coupon', targetId: id });
  revalidatePath('/admin/coupons');
}
