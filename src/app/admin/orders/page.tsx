import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { updateOrderStatusForm } from './actions';
import { OrderStatus } from '@prisma/client';
import Image from 'next/image';

export const metadata: Metadata = { title: 'Orders | Admin' };
export const dynamic = 'force-dynamic'; // always fresh for admin

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          productSize: {
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#FF990022', color: '#FF9900' };
      case 'PROCESSING':
        return { bg: '#C9A84C22', color: '#C9A84C' };
      case 'SHIPPED':
        return { bg: '#3399FF22', color: '#3399FF' };
      case 'DELIVERED':
        return { bg: '#33CC6622', color: '#33CC66' };
      case 'CANCELLED':
        return { bg: '#FF333322', color: '#FF3333' };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif, Cormorant Garamond)', fontSize: 32, fontWeight: 300, color: '#fff', margin: 0 }}>
          Manage Orders
        </h1>
        <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
          Monitor sales activity, package dispatches, and update delivery status
        </p>
      </div>

      <div style={{ background: '#0D0D0D', borderRadius: 8, border: '1px solid #151515', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #151515', background: '#0a0a0a' }}>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Order</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Customer</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Items</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Date</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Total</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusColor = getStatusColor(order.status);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #111', transition: 'background 0.2s' }}>
                  <td style={{ padding: '24px', fontSize: 13, fontWeight: 'bold', color: '#fff' }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '24px' }}>
                    <p style={{ fontSize: 14, margin: 0, color: '#fff' }}>{order.user.name || 'N/A'}</p>
                    <p style={{ fontSize: 12, margin: 0, color: '#555' }}>{order.user.email}</p>
                  </td>
                  <td style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {order.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid #222' }}>
                            <Image
                              src={item.productSize.product.image}
                              alt={item.productSize.product.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, margin: 0, color: '#fff' }}>
                              {item.productSize.product.name}
                            </p>
                            <p style={{ fontSize: 11, margin: 0, color: '#666' }}>
                              {item.productSize.ml}ml × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '24px', fontSize: 13, color: '#aaa' }}>
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '24px', fontSize: 14, fontWeight: 'bold', color: '#C9A84C' }}>
                    ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '24px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        background: statusColor.bg,
                        color: statusColor.color,
                        display: 'inline-block',
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '24px' }}>
                    <form style={{ display: 'flex', gap: 6 }}>
                      <select
                        defaultValue={order.status}
                        onChange={async (e) => {
                          const action = updateOrderStatusForm.bind(null, order.id, e.target.value as OrderStatus);
                          const fd = new FormData();
                          await action(fd);
                        }}
                        style={{
                          background: '#0F0F0F',
                          border: '1px solid #222',
                          color: '#aaa',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p style={{ textAlign: 'center', padding: '64px 0', color: '#555', fontSize: 14 }}>
            No orders found in the database.
          </p>
        )}
      </div>
    </div>
  );
}
