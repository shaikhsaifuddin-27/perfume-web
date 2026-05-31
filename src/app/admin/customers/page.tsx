import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Customers | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

function getTier(totalSpent: number): { label: string; color: string; bg: string } {
  if (totalSpent >= 1000) return { label: '✦ Gold', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)' };
  if (totalSpent >= 300) return { label: '◆ Silver', color: '#A8A8B8', bg: 'rgba(168,168,184,0.12)' };
  return { label: '● Bronze', color: '#8B6A4A', bg: 'rgba(139,106,74,0.12)' };
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  '#C9A84C', '#3399FF', '#C084FC', '#33CC66', '#FF9900', '#FF6B9D',
];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const sort = sp?.sort ?? 'joined';
  const query = sp?.q ?? '';

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      orders: { select: { total: true, status: true, createdAt: true } },
      _count: { select: { wishlist: true, reviews: true } },
    },
    orderBy: sort === 'spent' ? { createdAt: 'desc' } : { createdAt: 'desc' },
  });

  // Sort in-memory for spent
  const enriched = users
    .map((u) => ({
      ...u,
      totalSpent: u.orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0),
      orderCount: u.orders.length,
      lastOrder: u.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null,
    }))
    .sort((a, b) => {
      if (sort === 'spent') return b.totalSpent - a.totalSpent;
      if (sort === 'orders') return b.orderCount - a.orderCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalRevenue = enriched.reduce((s, u) => s + u.totalSpent, 0);
  const goldCount = enriched.filter((u) => u.totalSpent >= 1000).length;
  const silverCount = enriched.filter((u) => u.totalSpent >= 300 && u.totalSpent < 1000).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Customers
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: '6px 0 0' }}>
          {enriched.length} registered customers · Customer lifetime value analysis
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Customers', value: enriched.length, icon: '👤', accent: '#3399FF' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '💰', accent: '#C9A84C' },
          { label: 'Gold Tier', value: goldCount, icon: '✦', accent: '#C9A84C' },
          { label: 'Silver Tier', value: silverCount, icon: '◆', accent: '#A8A8B8' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: '#0F0F0F', border: `1px solid ${s.accent}22`, borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.accent, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <form method="GET" action="/admin/customers" style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
          {sort !== 'joined' && <input type="hidden" name="sort" value={sort} />}
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#444' }}>🔍</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email…"
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
        </form>

        <div style={{ display: 'flex', gap: 4, background: '#0A0A0A', padding: 4, borderRadius: 10, border: '1px solid #1a1a1a' }}>
          {[
            { key: 'joined', label: 'Latest Joined' },
            { key: 'spent', label: 'Top Spenders' },
            { key: 'orders', label: 'Most Orders' },
          ].map((s) => (
            <a
              key={s.key}
              href={`/admin/customers?sort=${s.key}${query ? `&q=${query}` : ''}`}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: sort === s.key ? 700 : 400,
                textDecoration: 'none',
                background: sort === s.key ? '#C9A84C' : 'transparent',
                color: sort === s.key ? '#050505' : '#555',
                transition: 'all 0.2s',
                letterSpacing: '0.04em',
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['Customer', 'Email', 'Tier', 'Joined', 'Orders', 'Wishlist', 'Lifetime Value'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
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
            {enriched.map((user, idx) => {
              const tier = getTier(user.totalSpent);
              const initials = getInitials(user.name, user.email);
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #141414' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `${avatarColor}20`,
                          border: `1px solid ${avatarColor}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: avatarColor,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: '#ddd', margin: 0, fontWeight: 500 }}>
                          {user.name ?? 'Anonymous'}
                        </p>
                        {user.role === 'ADMIN' && (
                          <span style={{ fontSize: 9, color: '#C9A84C', background: '#C9A84C20', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.1em' }}>
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 12, color: '#555' }}>{user.email}</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: tier.bg,
                        color: tier.color,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tier.label}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 12, color: '#555' }}>
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: '#ddd', textAlign: 'center' }}>
                    {user.orderCount}
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#555', textAlign: 'center' }}>
                    {user._count.wishlist}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#C9A84C' }}>
                      ${user.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {enriched.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 32 }}>👤</p>
            <p style={{ fontSize: 14, color: '#444' }}>No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
