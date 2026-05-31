import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { createCoupon, deleteCoupon, toggleCoupon } from './actions';

export const metadata: Metadata = { title: 'Coupons | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#0A0A0A',
  border: '1px solid #2a2a2a',
  color: '#F5F0E8',
  fontSize: 13,
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
};

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    where: { archivedAt: null },
    orderBy: { isActive: 'desc' },
  });

  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Coupons
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: '6px 0 0' }}>
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} · {activeCount} active
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Coupons', value: coupons.length, icon: '🎟️', accent: '#C9A84C' },
          { label: 'Active', value: activeCount, icon: '✅', accent: '#33CC66' },
          { label: 'Inactive', value: coupons.length - activeCount, icon: '⏸️', accent: '#555' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: '#0F0F0F', border: `1px solid ${s.accent}22`, borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: 30, fontWeight: 700, color: s.accent, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <div
        style={{
          background: '#0F0F0F',
          border: '1px solid #1E1E1E',
          borderRadius: 14,
          padding: '28px',
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F5F0E8', margin: '0 0 20px' }}>Create New Coupon</h2>
        <form action={createCoupon}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Coupon Code *
              </label>
              <input name="code" required placeholder="LUXURY20" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Discount Value *
              </label>
              <input name="discount" type="number" required min="0.01" step="0.01" placeholder="20" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Type *
              </label>
              <select name="isFixed" style={inputStyle}>
                <option value="false">Percentage (%)</option>
                <option value="true">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Expiry Date
              </label>
              <input name="expiresAt" type="datetime-local" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Usage Limit
              </label>
              <input name="usageLimit" type="number" min="1" placeholder="100" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Per User
              </label>
              <input name="perUserLimit" type="number" min="1" placeholder="1" style={inputStyle} />
            </div>
          </div>
          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              background: 'linear-gradient(135deg, #9A7A30, #C9A84C)',
              color: '#050505',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            🎟️ Create Coupon
          </button>
        </form>
      </div>

      {/* Coupons Table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['Code', 'Discount', 'Type', 'Expires', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 20px',
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
            {coupons.map((coupon) => {
              const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
              return (
                <tr key={coupon.id} style={{ borderBottom: '1px solid #141414', opacity: !coupon.isActive ? 0.5 : 1 }}>
                  <td style={{ padding: '18px 20px' }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#C9A84C',
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em',
                        background: '#C9A84C12',
                        padding: '4px 12px',
                        borderRadius: 6,
                      }}
                    >
                      {coupon.code}
                    </span>
                  </td>
                  <td style={{ padding: '18px 20px', fontSize: 16, fontWeight: 700, color: '#F5F0E8' }}>
                    {coupon.isFixed ? `$${coupon.discount}` : `${coupon.discount}%`}
                  </td>
                  <td style={{ padding: '18px 20px', fontSize: 12, color: '#666' }}>
                    {coupon.isFixed ? 'Fixed Amount' : 'Percentage'}
                  </td>
                  <td style={{ padding: '18px 20px', fontSize: 12, color: isExpired ? '#FF3333' : '#555' }}>
                    {coupon.expiresAt
                      ? new Date(coupon.expiresAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                        }) + (isExpired ? ' (Expired)' : '')
                      : '—'}
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: 20,
                        letterSpacing: '0.06em',
                        background: coupon.isActive && !isExpired ? '#33CC6620' : '#FF333320',
                        color: coupon.isActive && !isExpired ? '#33CC66' : '#FF3333',
                      }}
                    >
                      {!coupon.isActive ? 'INACTIVE' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {/* Toggle */}
                      <form action={toggleCoupon.bind(null, coupon.id)}>
                        <button
                          type="submit"
                          style={{
                            padding: '6px 14px',
                            background: 'none',
                            border: '1px solid #2a2a2a',
                            color: coupon.isActive ? '#FF9900' : '#33CC66',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            cursor: 'pointer',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {coupon.isActive ? '⏸ Disable' : '▶ Enable'}
                        </button>
                      </form>

                      {/* Delete */}
                      <form action={deleteCoupon.bind(null, coupon.id)}>
                        <button
                          type="submit"
                          style={{
                            padding: '6px 14px',
                            background: 'none',
                            border: '1px solid #FF333333',
                            color: '#FF3333',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            cursor: 'pointer',
                            letterSpacing: '0.06em',
                          }}
                        >
                          🗑 Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {coupons.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 32 }}>🎟️</p>
            <p style={{ fontSize: 14, color: '#444' }}>No coupons yet. Create your first discount code above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
