import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import styles from '../checkout.module.css';
import ClearCartOnSuccess from './ClearCartOnSuccess';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/account');

  const { session_id: stripeSessionId } = await searchParams;
  if (!stripeSessionId) redirect('/checkout');

  const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
  if (stripeSession.payment_status !== 'paid' || stripeSession.metadata?.userId !== session.user.id) {
    redirect('/checkout');
  }

  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: { items: true },
  });

  if (!order || order.userId !== session.user.id || order.paymentStatus !== 'paid') {
    return (
      <>
        <Navbar /><CartDrawer /><SearchOverlay />
        <div className={styles.success}>
          <p className="overline" style={{ marginBottom: 16 }}>Payment Received</p>
          <h1 className={styles.successTitle}>Finalizing Your Order</h1>
          <div className="divider-gold"></div>
          <p className={styles.successSub}>
            Your payment has been verified. We are finalizing your order record; refresh this page in a moment.
          </p>
          <Link href="/account" className="btn-gold">View Account</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <ClearCartOnSuccess />
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.success}>
        <div className={styles.successIcon}><i className="fa-solid fa-check"></i></div>
        <p className="overline" style={{ marginBottom: 16 }}>Order Confirmed</p>
        <h1 className={styles.successTitle}>Thank You For Your Order</h1>
        <div className="divider-gold"></div>
        <p className={styles.successSub}>
          Your payment was verified and order ownership was confirmed. A confirmation has been sent to {order.email}.
        </p>
        <p className={styles.orderNum}>Order #{order.id.slice(0, 8).toUpperCase()}</p>
        <Link href="/account" className="btn-gold">View Order History</Link>
      </div>
      <Footer />
    </>
  );
}
