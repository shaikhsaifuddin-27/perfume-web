import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/account');

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, returns: true, refunds: true },
  });
  if (!order) notFound();

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <main style={{ minHeight: '70vh', padding: '120px 8vw', background: '#050505', color: '#F5F0E8' }}>
        <Link href="/account" style={{ color: '#C9A84C', fontSize: 12, textDecoration: 'none' }}>Back to account</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 42, fontWeight: 300 }}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <p style={{ color: '#888' }}>Status: {order.status}</p>
        <p style={{ color: '#888' }}>Total: ${order.total.toFixed(2)}</p>
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16 }}>Items</h2>
          {order.items.map((item) => (
            <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #1a1a1a', color: '#ccc' }}>
              {item.quantity} x {item.productName || 'Product'} {item.sizeMl ? `${item.sizeMl}ml` : ''} - ${item.priceAtTime.toFixed(2)}
            </div>
          ))}
        </section>
        <section style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          {['PENDING', 'PROCESSING'].includes(order.status) && <OrderActionButton orderId={order.id} action="cancel" label="Cancel Order" />}
          {order.status === 'DELIVERED' && <OrderActionButton orderId={order.id} action="return" label="Request Return" />}
          {['DELIVERED', 'CANCELLED', 'RETURN_APPROVED'].includes(order.status) && <OrderActionButton orderId={order.id} action="refund" label="Request Refund" />}
        </section>
      </main>
      <Footer />
    </>
  );
}

function OrderActionButton({ orderId, action, label }: { orderId: string; action: 'cancel' | 'return' | 'refund'; label: string }) {
  return (
    <form action={`/api/orders/${orderId}/${action}`} method="post">
      <button type="submit" className="btn-gold">{label}</button>
    </form>
  );
}
