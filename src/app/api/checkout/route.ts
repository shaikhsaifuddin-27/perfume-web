import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, email, userId } = checkoutSchema.parse(body);

    // Fix N+1: fetch all products in one query
    const productIds = [...new Set(items.map((i) => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { sizes: true },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const lineItems: Stripe.Checkout.SessionCreateParams['line_items'] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) continue;

      const size = dbProduct.sizes.find((s) => s.ml === item.size);
      if (!size) continue;

      // Validate stock
      if (size.stock <= 0) continue;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${dbProduct.name} — ${size.ml}ml`,
            images: [`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${dbProduct.image}`],
            metadata: { productId: dbProduct.id, sizeId: size.id, sizeML: String(size.ml) },
          },
          unit_amount: Math.round(size.price * 100),
        },
        quantity: item.quantity,
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid items in cart' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: { userId: userId ?? '', email },
      success_url: `${baseUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
      shipping_address_collection: { allowed_countries: ['US', 'GB', 'FR', 'AE', 'DE', 'AU', 'IN'] },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
  }
}
