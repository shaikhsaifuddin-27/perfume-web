import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Customers | Admin' };
export const revalidate = 0; // always fresh for admin

export default async function AdminCustomersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        select: {
          total: true,
        },
      },
    },
  });

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif, Cormorant Garamond)', fontSize: 32, fontWeight: 300, color: '#fff', margin: 0 }}>
          Manage Customers
        </h1>
        <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
          Analyze customer registration dates, order histories, and total user spending
        </p>
      </div>

      <div style={{ background: '#0D0D0D', borderRadius: 8, border: '1px solid #151515', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #151515', background: '#0a0a0a' }}>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Name</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Email</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Role</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Joined Date</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Orders</th>
              <th style={{ padding: '16px 24px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const totalSpent = user.orders.reduce((sum, o) => sum + o.total, 0);
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #111', transition: 'background 0.2s' }}>
                  <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 500, color: '#fff' }}>
                    {user.name || 'Anonymous User'}
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13, color: '#aaa' }}>{user.email}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        background: user.role === 'ADMIN' ? '#C9A84C22' : '#222',
                        color: user.role === 'ADMIN' ? '#C9A84C' : '#888',
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13, color: '#666' }}>
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 13, color: '#fff', fontWeight: 500 }}>
                    {user.orders.length}
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 14, fontWeight: 'bold', color: '#C9A84C' }}>
                    ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <p style={{ textAlign: 'center', padding: '64px 0', color: '#555', fontSize: 14 }}>
            No registered users found.
          </p>
        )}
      </div>
    </div>
  );
}
