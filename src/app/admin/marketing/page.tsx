import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Marketing | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  const [couponsCount, activeCoupons] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.findMany({
      where: { isActive: true },
      take: 5,
    }),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
            Marketing Campaigns
          </h1>
          <p style={{ color: '#444', fontSize: 13, marginTop: 4, margin: 0 }}>
            Configure discounts, email newsletter marketing, and incentives
          </p>
        </div>
        <Link href="/admin/coupons" style={{ background: '#C9A84C', color: '#050505', textDecoration: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
          Manage Coupons
        </Link>
      </div>

      {/* KPI metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Subscribers Count', value: '48 Subscribers', color: '#C084FC' },
          { label: 'Active Discount Codes', value: `${couponsCount} Total (${activeCoupons.length} Active)`, color: '#C9A84C' },
          { label: 'Campaign Conversion Rate', value: '3.8%', color: '#3399FF' },
          { label: 'Sales via Promotions', value: '$12,480.00', color: '#33CC66' },
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

      {/* Active Promotion Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Active Codes */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '0 0 16px' }}>Active Discount Codes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeCoupons.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid #1A1A1A', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', fontFamily: 'monospace' }}>{c.code}</span>
                  <p style={{ fontSize: 10, color: '#444', margin: '2px 0 0' }}>
                    Type: {c.isFixed ? 'Fixed Value' : 'Percentage'}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#33CC66' }}>
                  {c.isFixed ? `$${c.discount}` : `${c.discount}%`} Off
                </span>
              </div>
            ))}
            {activeCoupons.length === 0 && (
              <p style={{ color: '#444', fontSize: 12, textAlign: 'center', margin: '20px 0' }}>No active coupon codes</p>
            )}
          </div>
        </div>

        {/* Campaign Info */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '0 0 16px' }}>Newsletter Marketing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid #1A1A1A', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#ccc', margin: 0, fontWeight: 600 }}>Welcome Club Offer</p>
              <p style={{ fontSize: 10, color: '#444', margin: '4px 0 0' }}>Sent automatically to users upon newsletter subscription. Includes a 10% coupon.</p>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid #1A1A1A', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: '#ccc', margin: 0, fontWeight: 600 }}>Summer Élixir Launch Promo</p>
              <p style={{ fontSize: 10, color: '#444', margin: '4px 0 0' }}>Emailed to subscribers regarding new arrivals. Yielded 8.4% conversion rate.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
