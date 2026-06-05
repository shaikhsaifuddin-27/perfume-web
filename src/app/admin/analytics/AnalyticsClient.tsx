'use client';

import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';

interface AnalyticsData {
  revenueByDay: { date: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; count: number; revenue: number }[];
  categoryRevenue: { category: string; revenue: number; unitsSold: number }[];
  topProducts: { name: string; revenue: number; unitsSold: number; image: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9900',
  PROCESSING: '#C9A84C',
  SHIPPED: '#3399FF',
  DELIVERED: '#33CC66',
  CANCELLED: '#FF3333',
};

const CATEGORY_COLORS = ['#C9A84C', '#3399FF', '#C084FC', '#33CC66', '#FF9900', '#FF3333'];

const numberFormatter = new Intl.NumberFormat('en-US');
const roundedNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#888', margin: '0 0 6px' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '3px 0', fontWeight: 600 }}>
          {p.name === 'revenue' || p.name === 'Revenue' ? `$${numberFormatter.format(Number(p.value))}` : p.value} {p.name !== 'revenue' && p.name !== 'Revenue' ? p.name : ''}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/analytics?days=${days}`);
        const d = await r.json();
        setData(d);
      } catch {
        // analytics fetch failed
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [days]);

  const totalRevenue = data?.revenueByDay.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders = data?.revenueByDay.reduce((s, d) => s + d.orders, 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Analytics
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: '6px 0 0' }}>Detailed performance insights</p>
      </div>

      {/* Period Selector + Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: '#0F0F0F', padding: 4, borderRadius: 10, border: '1px solid #1E1E1E' }}>
          {[7, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 16px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: days === d ? '#C9A84C' : 'transparent',
                color: days === d ? '#050505' : '#555',
                fontWeight: days === d ? 700 : 400,
                transition: 'all 0.2s',
              }}
            >
              {d}d
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: `Revenue (${days}d)`, value: `$${roundedNumberFormatter.format(totalRevenue)}` },
            { label: `Orders (${days}d)`, value: totalOrders },
            { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#444', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C', margin: '2px 0 0' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue + Orders Dual Axis */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: '24px 20px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: '0 0 4px' }}>Revenue & Orders Over Time</h2>
        <p style={{ fontSize: 11, color: '#444', margin: '0 0 20px' }}>Daily revenue (bars) vs order count (line)</p>
        {loading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Loading chart…</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data?.revenueByDay ?? []} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} interval={Math.max(1, Math.floor((data?.revenueByDay.length ?? 1) / 8))} />
              <YAxis yAxisId="left" tick={{ fill: '#444', fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={60} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#444', fontSize: 10 }} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#555' }} />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#C9A84C" opacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3399FF" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom 3 charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Order Status */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: '24px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: '0 0 4px' }}>Order Status</h2>
          <p style={{ fontSize: 11, color: '#444', margin: '0 0 16px' }}>All-time distribution</p>
          {loading ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Loading…</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data?.statusBreakdown ?? []} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="count" nameKey="status">
                    {(data?.statusBreakdown ?? []).map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#888'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {(data?.statusBreakdown ?? []).map((s) => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.status] ?? '#888', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 11, color: '#666' }}>{s.status}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#aaa' }}>{s.count} orders</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Category Revenue */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: '24px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: '0 0 4px' }}>Revenue by Category</h2>
          <p style={{ fontSize: 11, color: '#444', margin: '0 0 16px' }}>Lifetime category performance</p>
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.categoryRevenue ?? []} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#444', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#666', fontSize: 10 }} width={80} tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + '…' : v} />
                <Tooltip contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => [`$${numberFormatter.format(typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) || 0 : 0)}`, 'Revenue']} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {(data?.categoryRevenue ?? []).map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: '24px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: '0 0 4px' }}>Top Products</h2>
          <p style={{ fontSize: 11, color: '#444', margin: '0 0 16px' }}>By revenue earned</p>
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.topProducts ?? []).map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#333', fontWeight: 700, width: 16, flexShrink: 0 }}>#{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} style={{ width: 26, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0, border: '1px solid #222' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#ccc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: '#444', margin: '2px 0 0' }}>{p.unitsSold} units sold</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C', flexShrink: 0 }}>${numberFormatter.format(p.revenue)}</span>
                </div>
              ))}
              {(data?.topProducts ?? []).length === 0 && (
                <p style={{ color: '#333', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>No sales data yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
