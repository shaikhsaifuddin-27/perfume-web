import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { auditLog } from '@/lib/audit';
import { getRequestMeta } from '@/lib/requestMeta';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.number().positive(),
        quantity: z.number().int().positive().max(99),
      })
    )
    .min(1)
    .max(50),
  email: z.string().email(),
  couponCode: z.string().trim().max(50).optional(),
  shipping: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional().default(''),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    zip: z.string().min(1),
    phone: z.string().optional().default(''),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });
    }

    const body = await req.json();
    const { items, email, couponCode, shipping } = checkoutSchema.parse(body);
    const productIds = [...new Set(items.map((i) => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, deletedAt: null },
      include: { sizes: true },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const lineItems: Stripe.Checkout.SessionCreateParams['line_items'] = [];
    let subtotal = 0;

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ error: 'One or more products are unavailable.' }, { status: 400 });
      }

      const size = dbProduct.sizes.find((s) => s.ml === item.size);
      if (!size) {
        return NextResponse.json({ error: 'One or more product sizes are unavailable.' }, { status: 400 });
      }

      if (item.quantity > size.stock) {
        return NextResponse.json(
          { error: `${dbProduct.name} ${size.ml}ml has only ${size.stock} unit(s) available.` },
          { status: 409 }
        );
      }

      subtotal += size.price * item.quantity;
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${dbProduct.name} - ${size.ml}ml`,
            images: [`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${dbProduct.image}`],
            metadata: {
              productId: dbProduct.id,
              sizeId: size.id,
              sizeML: String(size.ml),
              productImage: dbProduct.image,
            },
          },
          unit_amount: Math.round(size.price * 100),
        },
        quantity: item.quantity,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    let couponMeta: { id: string; code: string; discount: number; isFixed: boolean } | null = null;
    let discounts: { coupon: string }[] | undefined;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          archivedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { usages: true },
      });

      if (!coupon) {
        return NextResponse.json({ error: 'Coupon is invalid or expired.' }, { status: 400 });
      }

      const totalUsage = coupon.usages.length;
      const userUsage = coupon.usages.filter((u) => u.userId === authSession.user.id).length;
      if (coupon.usageLimit !== null && totalUsage >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit reached.' }, { status: 400 });
      }
      if (coupon.perUserLimit !== null && userUsage >= coupon.perUserLimit) {
        return NextResponse.json({ error: 'You have already used this coupon.' }, { status: 400 });
      }

      const stripeCoupon = await stripe.coupons.create(
        coupon.isFixed
          ? {
              amount_off: Math.min(Math.round(coupon.discount * 100), Math.round(subtotal * 100)),
              currency: 'usd',
              duration: 'once',
              name: coupon.code,
            }
          : {
              percent_off: Math.min(coupon.discount, 100),
              duration: 'once',
              name: coupon.code,
            }
      );
      discounts = [{ coupon: stripeCoupon.id }];
      couponMeta = { id: coupon.id, code: coupon.code, discount: coupon.discount, isFixed: coupon.isFixed };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: {
        userId: authSession.user.id,
        email,
        shippingName: `${shipping.firstName} ${shipping.lastName}`.trim(),
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingCountry: shipping.country,
        shippingZip: shipping.zip,
        shippingPhone: shipping.phone,
        couponId: couponMeta?.id ?? '',
        couponCode: couponMeta?.code ?? '',
      },
      discounts,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
      shipping_address_collection: { allowed_countries: ['US', 'GB', 'FR', 'AE', 'DE', 'AU', 'IN'] },
    });

    const meta = getRequestMeta(req);
    await auditLog({
      action: 'CHECKOUT_CREATE',
      actorUserId: authSession.user.id,
      targetType: 'StripeCheckoutSession',
      targetId: stripeSession.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { subtotal, itemCount: items.length, couponCode: couponMeta?.code },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
  }
}
