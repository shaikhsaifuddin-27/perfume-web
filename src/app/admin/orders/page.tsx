import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import Image from 'next/image';
import { OrderStatusSelect } from './OrderStatusSelect';

export const metadata: Metadata = { title: 'Orders | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9900',
  PROCESSING: '#C9A84C',
  SHIPPED: '#3399FF',
  DELIVERED: '#33CC66',
  CANCELLED: '#FF3333',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp?.status?.toUpperCase();
  const query = sp?.q ?? '';

  const orders = await prisma.order.findMany({
    where: {
      ...(statusFilter && statusFilter !== 'ALL'
        ? { status: statusFilter as any }
        : {}),
      ...(query
        ? {
            OR: [
              { id: { contains: query, mode: 'insensitive' } },
              { user: { name: { contains: query, mode: 'insensitive' } } },
              { user: { email: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          productSize: {
            include: { product: { select: { name: true, image: true } } },
          },
        },
      },
    },
  });

  // Summary counts
  const counts = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  const countMap: Record<string, number> = {};
  let total = 0;
  for (const c of counts) {
    countMap[c.status] = c._count.id;
    total += c._count.id;
  }

  const tabs = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Orders
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: '6px 0 0' }}>
          {orders.length} order{orders.length !== 1 ? 's' : ''} · Manage dispatches and delivery status
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          background: '#0A0A0A',
          padding: 4,
          borderRadius: 10,
          border: '1px solid #1a1a1a',
          width: 'fit-content',
        }}
      >
        {tabs.map((tab) => {
          const active = !statusFilter ? tab === 'ALL' : statusFilter === tab;
          const count = tab === 'ALL' ? total : (countMap[tab] ?? 0);
          const color = STATUS_COLORS[tab] ?? '#C9A84C';
          return (
            <a
              key={tab}
              href={`/admin/orders${tab === 'ALL' ? '' : `?status=${tab.toLowerCase()}`}`}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                textDecoration: 'none',
                background: active ? (tab === 'ALL' ? '#C9A84C' : `${color}22`) : 'transparent',
                color: active ? (tab === 'ALL' ? '#050505' : color) : '#444',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s',
                letterSpacing: '0.04em',
              }}
            >
              {tab}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  background: active ? 'rgba(0,0,0,0.2)' : '#1a1a1a',
                  padding: '1px 5px',
                  borderRadius: 10,
                }}
              >
                {count}
              </span>
            </a>
          );
        })}
      </div>

      {/* Search */}
      <form style={{ marginBottom: 20 }} method="GET" action="/admin/orders">
        {statusFilter && statusFilter !== 'ALL' && (
          <input type="hidden" name="status" value={statusFilter.toLowerCase()} />
        )}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#444' }}>🔍</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by Order ID, name, email…"
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              background: '#0F0F0F',
              border: '1px solid #1E1E1E',
              color: '#F5F0E8',
              fontSize: 13,
              borderRadius: 8,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </form>

      {/* Orders Table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['Order', 'Customer', 'Items', 'Date', 'Total', 'Status', 'Update'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '14px 16px',
                    fontSize: 10,
                    color: '#444',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusColor = STATUS_COLORS[order.status] ?? '#888';
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '18px 16px', fontSize: 12, color: '#C9A84C', fontFamily: 'monospace', fontWeight: 700 }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <p style={{ fontSize: 13, color: '#ddd', margin: 0, fontWeight: 500 }}>{order.user?.name || '—'}</p>
                    <p style={{ fontSize: 11, color: '#444', margin: '2px 0 0' }}>{order.user?.email}</p>
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {order.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 42, position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid #222', flexShrink: 0 }}>
                            <Image
                              src={item.productSize.product.image}
                              alt={item.productSize.product.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                          <div>
                            <p style={{ fontSize: 12, color: '#ccc', margin: 0 }}>{item.productSize.product.name}</p>
                            <p style={{ fontSize: 10, color: '#444', margin: '1px 0 0' }}>
                              {item.productSize.ml}ml × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '18px 16px', fontSize: 12, color: '#555' }}>
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '18px 16px', fontSize: 14, fontWeight: 700, color: '#F5F0E8' }}>
                    ${order.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        background: `${statusColor}20`,
                        color: statusColor,
                        display: 'inline-block',
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <OrderStatusSelect orderId={order.id} current={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#333' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
            <p style={{ fontSize: 14, color: '#444' }}>No orders match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
