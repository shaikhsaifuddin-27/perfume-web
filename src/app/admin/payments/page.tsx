import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Payments | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const [totalRevenue, ordersCount, recentOrders] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const rev = totalRevenue._sum.total ?? 0;
  const aov = ordersCount > 0 ? rev / ordersCount : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Payments & Transactions
        </h1>
        <p style={{ color: '#444', fontSize: 13, marginTop: 4, margin: 0 }}>
          Monitor transaction logs, refund status, and gateways
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Gross Volume', value: `$${rev.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#33CC66' },
          { label: 'Average Order Value (AOV)', value: `$${aov.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#3399FF' },
          { label: 'Payment Gateway Status', value: 'Active (Stripe/Razorpay)', color: '#C9A84C' },
          { label: 'Refund rate', value: '0.0%', color: '#FF3333' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 10, padding: 20 }}>
            <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.08em' }}>
              {kpi.label}
            </span>
            <p style={{ fontSize: 18, fontWeight: 700, color: kpi.color, margin: '8px 0 0', fontFamily: 'monospace' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Transaction History</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Transaction ID', 'Customer', 'Processor', 'Status', 'Gross Total', 'Date'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, borderBottom: '1px solid #1a1a1a' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #151515' }}>
                <td style={{ padding: '14px 20px', fontSize: 12, color: '#C9A84C', fontFamily: 'monospace' }}>
                  ch_{o.id.slice(0, 12).toLowerCase()}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <p style={{ fontSize: 12, color: '#ccc', margin: 0 }}>{o.user?.name ?? 'Guest User'}</p>
                  <p style={{ fontSize: 10, color: '#444', margin: '2px 0 0' }}>{o.user?.email}</p>
                </td>
                <td style={{ padding: '14px 20px', fontSize: 12, color: '#666' }}>Stripe</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: o.status === 'CANCELLED' ? '#FF333322' : '#33CC6622', color: o.status === 'CANCELLED' ? '#FF3333' : '#33CC66' }}>
                    {o.status === 'CANCELLED' ? 'REFUNDED' : 'SUCCEEDED'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#F5F0E8', fontFamily: 'monospace' }}>
                  ${o.total.toFixed(2)}
                </td>
                <td style={{ padding: '14px 20px', fontSize: 11, color: '#444' }}>
                  {o.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#444', fontSize: 12 }}>
                  No transaction records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
