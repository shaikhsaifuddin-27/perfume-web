import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Reports | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [totalProducts, totalOrders, totalUsers] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'USER' } }),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Business Reports
        </h1>
        <p style={{ color: '#444', fontSize: 13, marginTop: 4, margin: 0 }}>
          Generate, view, and export catalog and operational statements
        </p>
      </div>

      {/* KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Orders', value: totalOrders.toString(), desc: 'Order transaction report' },
          { label: 'Total Products', value: totalProducts.toString(), desc: 'Stock inventory report' },
          { label: 'Registered Clients', value: totalUsers.toString(), desc: 'Customer account directory' },
          { label: 'System status', value: 'Healthy (100%)', desc: 'Server & database analytics' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 10, padding: 20 }}>
            <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.08em' }}>
              {kpi.label}
            </span>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C', margin: '6px 0 0', fontFamily: 'monospace' }}>
              {kpi.value}
            </p>
            <span style={{ fontSize: 10, color: '#555', marginTop: 4, display: 'block' }}>{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* Export modules */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '0 0 16px' }}>Export Data</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[
            { title: 'Sales Ledger (CSV)', desc: 'Transaction ledgers for accounting & reconciliation.' },
            { title: 'Customer Profile Directory', desc: 'Email addresses, tiers, LTVs, and locations.' },
            { title: 'Inventory Log', desc: 'Product size variant stock levels and pricing structures.' },
          ].map((item) => (
            <div key={item.title} style={{ padding: 16, background: 'rgba(255,255,255,0.01)', border: '1px solid #1A1A1A', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontSize: 13, color: '#ccc', margin: 0, fontWeight: 600 }}>{item.title}</p>
                <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>{item.desc}</p>
              </div>
              <button style={{ alignSelf: 'flex-start', background: '#1a1a1a', border: '1px solid #C9A84C44', color: '#C9A84C', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                Download Statement
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
