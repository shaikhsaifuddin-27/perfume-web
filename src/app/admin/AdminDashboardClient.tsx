'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  revTrend: number;
  orderTrend: number;
  todayRevenue: number;
  periodRevenue: number;
  avgRating: number;
  monthlyTopCustomerName: string;
  monthlyTopCustomerSpend: number;
  yearlyTopCustomerName: string;
  yearlyTopCustomerSpend: number;
  lowStockCount: number;
  todayOrdersCount: number;
  pendingOrdersCount: number;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
  customerName: string | null;
  customerEmail: string | null;
}

interface LowStockItem {
  id: string;
  ml: number;
  stock: number;
  productName: string;
  productImage: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

interface AnalyticsData {
  revenueByDay: { date: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; count: number; revenue: number }[];
  categoryRevenue: { category: string; revenue: number; unitsSold: number }[];
  topProducts: { name: string; revenue: number; unitsSold: number; image: string }[];
}

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
    <div
      style={{
        background: '#141414',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
      }}
    >
      <p style={{ color: '#888', marginBottom: 6, margin: 0 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '4px 0', fontWeight: 600 }}>
          {p.name === 'revenue' || p.name === 'Revenue'
            ? `$${numberFormatter.format(Number(p.value))}`
            : p.name === 'count' || p.name === 'Signups' || p.name === 'Orders'
            ? `${p.value}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const numberFormatter = new Intl.NumberFormat('en-US');
const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const activityTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Kolkata',
});

export default function AdminDashboardClient({
  stats,
  recentOrders,
  lowStock,
  customerGrowth,
  activities,
}: {
  stats: Stats;
  recentOrders: RecentOrder[];
  lowStock: LowStockItem[];
  customerGrowth: { date: string; count: number }[];
  activities: ActivityItem[];
}) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [chartDays, setChartDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/analytics?days=${chartDays}`);
        const data = await r.json();
        setAnalytics(data);
      } catch {
        // analytics failed — leave previous data
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [chartDays]);

  const activityIcons: Readonly<Record<string, string>> = {
    ORDER: '🛍️',
    REFUND: '💸',
    SIGNUP: '👤',
    STOCK: '📦',
  } as const;

  const activityColors: Readonly<Record<string, string>> = {
    ORDER: '#33CC66',
    REFUND: '#FF3333',
    SIGNUP: '#3399FF',
    STOCK: '#FF9900',
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 5 Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          {
            label: 'Revenue Today',
            value: `$${moneyFormatter.format(stats.todayRevenue)}`,
            accent: '#C9A84C',
          },
          {
            label: 'Orders Today',
            value: stats.todayOrdersCount.toString(),
            accent: '#3399FF',
          },
          {
            label: 'Pending Orders',
            value: stats.pendingOrdersCount.toString(),
            accent: '#FF9900',
            highlight: stats.pendingOrdersCount > 0,
          },
          {
            label: 'Total Customers',
            value: stats.totalUsers.toString(),
            accent: '#C084FC',
          },
          {
            label: 'Inventory Alerts',
            value: stats.lowStockCount.toString(),
            accent: '#FF3333',
            highlight: stats.lowStockCount > 0,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              background: '#0F0F0F',
              border: `1px solid ${metric.highlight ? `${metric.accent}33` : '#1E1E1E'}`,
              borderRadius: 12,
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
              boxShadow: metric.highlight ? `0 0 12px ${metric.accent}05` : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                {metric.label}
              </span>
            </div>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: metric.accent,
                margin: 0,
                fontFamily: 'monospace',
              }}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Row: Charts Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        {/* Revenue Graph / Sales Trends (Large Area Chart) */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Revenue & Sales trends</h3>
              <p style={{ fontSize: 11, color: '#444', margin: '4px 0 0' }}>Daily sales progression vs transactions</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 11,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    background: chartDays === d ? '#C9A84C' : '#1A1A1A',
                    color: chartDays === d ? '#050505' : '#555',
                    fontWeight: chartDays === d ? 700 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {loading || !analytics ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 13 }}>
              Loading charts…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.revenueByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradMain3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#444', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={Math.floor(analytics.revenueByDay.length / 6)}
                />
                <YAxis tick={{ fill: '#444', fontSize: 10 }} tickFormatter={(v) => `$${v}`} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revenueGradMain3)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Volume Chart (Daily Order count) */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Orders Analytics</h3>
          <p style={{ fontSize: 11, color: '#444', margin: '4px 0 16px' }}>Volume of daily processed transactions</p>

          {loading || !analytics ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 13 }}>
              Loading order analytics…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#444', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={Math.floor(analytics.revenueByDay.length / 6)}
                />
                <YAxis tick={{ fill: '#444', fontSize: 9 }} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#3399FF" radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Customer Growth Chart + Recent Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Customer Growth Line Chart */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Customer Growth</h3>
          <p style={{ fontSize: 11, color: '#444', margin: '4px 0 20px' }}>Cumulative active client acquisitions</p>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#444', fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                interval={Math.floor(customerGrowth.length / 6)}
              />
              <YAxis tick={{ fill: '#444', fontSize: 10 }} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" name="Signups" stroke="#C084FC" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Business Activity Feed */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Recent Business Activity</h3>
          <p style={{ fontSize: 11, color: '#444', margin: '4px 0 16px' }}>Real-time updates across sales & inventory</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
            {activities.map((act) => (
              <div
                key={act.id + act.type}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid #161616',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `${activityColors[act.type]}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {activityIcons[act.type] ?? '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: activityColors[act.type] }}>
                      {act.title}
                    </span>
                    <span style={{ fontSize: 9, color: '#444' }}>
                      {activityTimeFormatter.format(new Date(act.time))}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#ccc', margin: '2px 0 0', lineHeight: 1.3 }}>
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: 12 }}>
                No recent activity recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Product Management Catalog & Recent Orders log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Top Product Management */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Top Performing Perfumes</h3>
            <a href="/admin/products" style={{ fontSize: 11, color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>
              Catalog Manager →
            </a>
          </div>

          {loading || !analytics || analytics.topProducts.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: 12 }}>
              No catalog revenue details
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analytics.topProducts.map((p, idx) => (
                <div
                  key={p.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid #1A1A1A',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#444', fontWeight: 700, width: 14 }}>#{idx + 1}</span>
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{ width: 28, height: 38, objectFit: 'cover', borderRadius: 4, border: '1px solid #222' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: '#ccc', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 10, color: '#444', margin: '2px 0 0' }}>{p.unitsSold} units shipped</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C' }}>${numberFormatter.format(p.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Order Log Summary</h3>
            <a href="/admin/orders" style={{ fontSize: 11, color: '#C9A84C', textDecoration: 'none', fontWeight: 500 }}>
              Order Registry →
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.slice(0, 4).map((o) => (
              <div
                key={o.id}
                style={{
                  padding: 12,
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid #1A1A1A',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', fontFamily: 'monospace' }}>
                    #{o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <p style={{ fontSize: 12, color: '#ccc', margin: '4px 0 0', fontWeight: 500 }}>
                    {o.customerName ?? 'Guest User'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', display: 'block' }}>
                    ${o.total.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 9, color: '#555' }}>
                    {shortDateFormatter.format(new Date(o.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
