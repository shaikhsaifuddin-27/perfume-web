import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

type OrderItemDraft = {
  quantity: number;
  priceAtTime: number;
  productSizeId: string;
  productName: string;
  productImage: string;
  sizeMl: number;
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    // Webhook Idempotency Check
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existingEvent) {
      logger.info('Stripe webhook event already processed (idempotency check)', { eventId: event.id });
      return NextResponse.json({ received: true });
    }

    // Save event to DB to prevent duplicate processing
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
        processed: true,
      },
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session, event.id);
    }

    if (event.type === 'payment_intent.payment_failed') {
      await auditLog({
        action: 'STRIPE_WEBHOOK',
        targetType: 'StripeEvent',
        targetId: event.id,
        metadata: { type: event.type },
      });
    }
  } catch (err) {
    logger.error('Webhook handler error', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, eventId: string) {
  const userId = session.metadata?.userId;
  if (!userId) {
    throw new Error('Checkout completed without authenticated user metadata');
  }

  if (session.payment_status !== 'paid') {
    throw new Error(`Checkout session ${session.id} is not paid`);
  }

  const existingOrder = await prisma.order.findUnique({ where: { stripeSessionId: session.id } });
  if (existingOrder) {
    await auditLog({
      action: 'STRIPE_WEBHOOK',
      actorUserId: userId,
      targetType: 'Order',
      targetId: existingOrder.id,
      metadata: { eventId, stripeSessionId: session.id, idempotent: true },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`Order webhook user ${userId} not found`);
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });
  const completedSession = session as Stripe.Checkout.Session & {
    shipping_details?: {
      name?: string | null;
      address?: {
        line1?: string | null;
        line2?: string | null;
        city?: string | null;
        country?: string | null;
        postal_code?: string | null;
      } | null;
    } | null;
  };

  const orderItems: OrderItemDraft[] = lineItems.data
    .map((li) => {
      const stripeProduct = li.price?.product as Stripe.Product | null;
      const productSizeId = stripeProduct?.metadata?.sizeId;
      if (!productSizeId) return null;
      return {
        quantity: li.quantity ?? 1,
        priceAtTime: (li.price?.unit_amount ?? 0) / 100,
        productSizeId,
        productName: stripeProduct.name ?? 'Product',
        productImage: stripeProduct.metadata?.productImage ?? '',
        sizeMl: Number(stripeProduct.metadata?.sizeML ?? 0),
      };
    })
    .filter((item): item is OrderItemDraft => item !== null);

  if (orderItems.length === 0) {
    throw new Error(`Checkout session ${session.id} has no valid order items`);
  }

  const order = await prisma.$transaction(
    async (tx) => {
      for (const item of orderItems) {
        const updated = await tx.productSize.updateMany({
          where: { id: item.productSizeId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count !== 1) {
          throw new Error(`Insufficient stock for product size ${item.productSizeId}`);
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          status: 'PROCESSING',
          total: (session.amount_total ?? 0) / 100,
          subtotal: (session.amount_subtotal ?? session.amount_total ?? 0) / 100,
          discountTotal: (session.total_details?.amount_discount ?? 0) / 100,
          tax: (session.total_details?.amount_tax ?? 0) / 100,
          shipping: (session.shipping_cost?.amount_total ?? 0) / 100,
          email: session.customer_details?.email ?? session.metadata?.email ?? user.email,
          shippingName: completedSession.shipping_details?.name ?? session.metadata?.shippingName,
          shippingAddress: completedSession.shipping_details?.address
            ? [
                completedSession.shipping_details.address.line1,
                completedSession.shipping_details.address.line2,
              ].filter(Boolean).join(', ')
            : session.metadata?.shippingAddress,
          shippingCity: completedSession.shipping_details?.address?.city ?? session.metadata?.shippingCity,
          shippingCountry: completedSession.shipping_details?.address?.country ?? session.metadata?.shippingCountry,
          shippingZip: completedSession.shipping_details?.address?.postal_code ?? session.metadata?.shippingZip,
          shippingPhone: session.customer_details?.phone ?? session.metadata?.shippingPhone,
          stripeSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
          paymentStatus: session.payment_status,
          couponId: session.metadata?.couponId || null,
          couponCode: session.metadata?.couponCode || null,
          items: {
            create: orderItems.map((item) => ({
              quantity: item.quantity,
              priceAtTime: item.priceAtTime,
              productName: item.productName,
              productImage: item.productImage,
              sizeMl: item.sizeMl,
              productSize: { connect: { id: item.productSizeId } },
            })),
          },
        },
      });

      if (session.metadata?.couponId) {
        await tx.couponUsage.create({
          data: {
            couponId: session.metadata.couponId,
            userId,
            orderId: created.id,
          },
        });
      }

      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  await auditLog({
    action: 'ORDER_CREATE',
    actorUserId: userId,
    targetType: 'Order',
    targetId: order.id,
    metadata: { eventId, stripeSessionId: session.id, total: order.total },
  });
}
