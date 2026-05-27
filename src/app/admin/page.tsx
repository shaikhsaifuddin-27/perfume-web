import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const getAdminStats = unstable_cache(
  async () => {
    const [totalProducts, totalOrders, totalRevenue, totalUsers] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);
    return {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalUsers,
    };
  },
  ['admin-stats'],
  { revalidate: 300, tags: ['admin'] }
);

const getRecentOrders = unstable_cache(
  async () => {
    return prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    });
  },
  ['admin-recent-orders'],
  { revalidate: 60, tags: ['orders'] }
);

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([getAdminStats(), getRecentOrders()]);

  const statCards = [
    { label: 'Total Products', value: stats.totalProducts, icon: 'fa-box', color: '#C9A84C' },
    { label: 'Total Orders', value: stats.totalOrders, icon: 'fa-receipt', color: '#7EB8B0' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: 'fa-dollar-sign', color: '#A8D5A2' },
    { label: 'Customers', value: stats.totalUsers, icon: 'fa-users', color: '#D5A2C8' },
  ];

  const statusColors: Record<string, string> = {
    PENDING: '#C9A84C',
    PROCESSING: '#7EB8B0',
    SHIPPED: '#A8D5A2',
    DELIVERED: '#6BCB77',
    CANCELLED: '#D94F4F',
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-serif, Cormorant Garamond)', fontSize: 36, fontWeight: 300, marginBottom: 8, color: '#F5F0E8' }}>
        Dashboard
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 40 }}>Welcome back. Here's what's happening.</p>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 48 }}>
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{ background: '#141414', border: '1px solid #222', borderRadius: 12, padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i>
            </div>
            <p style={{ fontSize: 32, fontWeight: 600, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 24, color: '#F5F0E8' }}>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>No orders yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #222' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '14px 12px', fontSize: 12, color: '#C9A84C', fontFamily: 'monospace' }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: 13, color: '#ccc' }}>{order.user?.name ?? order.user?.email ?? 'Guest'}</td>
                  <td style={{ padding: '14px 12px', fontSize: 13, color: '#888' }}>{order._count.items}</td>
                  <td style={{ padding: '14px 12px', fontSize: 13, color: '#F5F0E8', fontWeight: 500 }}>${order.total.toFixed(2)}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: `${statusColors[order.status] ?? '#555'}22`, color: statusColors[order.status] ?? '#888', letterSpacing: '0.05em' }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: 12, color: '#666' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
