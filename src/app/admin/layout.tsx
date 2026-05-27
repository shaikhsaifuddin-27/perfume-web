import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // Server-side auth guard — any non-ADMIN gets redirected
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/account');
  }

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: 'fa-chart-line' },
    { href: '/admin/products', label: 'Products', icon: 'fa-box' },
    { href: '/admin/orders', label: 'Orders', icon: 'fa-receipt' },
    { href: '/admin/customers', label: 'Customers', icon: 'fa-users' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#fff' }}>
      <aside
        style={{
          width: 260,
          borderRight: '1px solid #1a1a1a',
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif, Cormorant Garamond)',
              fontSize: 22,
              color: '#C9A84C',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}
          >
            MÉ Admin
          </h2>
          <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>
            {session.user.email}
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#aaa',
                textDecoration: 'none',
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 6,
                transition: 'all 0.2s',
              }}
            >
              <i className={`fa-solid ${link.icon}`} style={{ width: 16, textAlign: 'center' }}></i>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#555', textDecoration: 'none', fontSize: 12 }}
          >
            <i className="fa-solid fa-arrow-left" style={{ width: 16 }}></i>
            Back to Store
          </Link>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px', background: '#0A0A0A', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
