import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

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
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        console.error('Payment failed:', event.data.object);
        break;
      }
      default:
        // Unhandled event type — log and acknowledge
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.warn('Checkout completed without userId in metadata');
    return;
  }

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`Order webhook: user ${userId} not found`);
    return;
  }

  const total = (session.amount_total ?? 0) / 100;
  const shipping = (session.shipping_cost?.amount_total ?? 0) / 100;
  const subtotal = total - shipping;

  // Retrieve line items from Stripe to create OrderItems
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });

  const order = await prisma.order.create({
    data: {
      userId,
      status: 'PROCESSING',
      total,
      tax: 0,
      shipping,
      items: {
        create: lineItems.data
          .map((li) => {
            const product = li.price?.product as Stripe.Product | null;
            const sizeId = product?.metadata?.sizeId;
            if (!sizeId) return null;
            return {
              quantity: li.quantity ?? 1,
              priceAtTime: (li.price?.unit_amount ?? 0) / 100,
              productSize: { connect: { id: sizeId } }
            };
          })
          .filter((item): item is { quantity: number; priceAtTime: number; productSize: { connect: { id: string } } } => item !== null),
      },
    },
  });

  console.log(`Order ${order.id} created for user ${userId} — total: $${total}`);
}
