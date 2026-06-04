import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const schema = z.object({
  couponCode: z.string().trim().min(1).max(50).toUpperCase(),
  subtotal: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });
    }

    const { couponCode, subtotal } = schema.parse(await req.json());

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        archivedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { usages: { where: { userId: session.user.id } }, _count: { select: { usages: true } } },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Coupon is invalid or expired.' });
    }

    if (coupon.usageLimit !== null && coupon._count.usages >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Coupon usage limit has been reached.' });
    }

    if (coupon.perUserLimit !== null && coupon.usages.length >= coupon.perUserLimit) {
      return NextResponse.json({ valid: false, error: 'You have already used this coupon.' });
    }

    const discountAmount = coupon.isFixed
      ? Math.min(coupon.discount, subtotal)
      : (subtotal * coupon.discount) / 100;

    return NextResponse.json({
      valid: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountLabel: coupon.isFixed
        ? `$${coupon.discount.toFixed(2)} off`
        : `${coupon.discount}% off`,
      couponId: coupon.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code.' }, { status: 400 });
    }
    console.error('Coupon validate error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon.' }, { status: 500 });
  }
}
