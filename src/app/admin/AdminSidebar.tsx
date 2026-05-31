'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface AdminSidebarProps {
  user: { name: string | null; email: string };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/analytics', label: 'Analytics', exact: false },
  { href: '/admin/orders', label: 'Orders', exact: false },
  { href: '/admin/products', label: 'Products', exact: false },
  { href: '/admin/inventory', label: 'Inventory', exact: false },
  { href: '/admin/customers', label: 'Customers', exact: false },
  { href: '/admin/payments', label: 'Payments', exact: false },
  { href: '/admin/coupons', label: 'Coupons', exact: false },
  { href: '/admin/marketing', label: 'Marketing', exact: false },
  { href: '/admin/reports', label: 'Reports', exact: false },
  { href: '/admin/settings', label: 'Settings', exact: false },
];

export default function AdminSidebar({ user, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (item: (typeof navItems)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initials = (user.name ?? user.email)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      style={{
        width: isCollapsed ? 72 : 260,
        borderRight: '1px solid #1a1a1a',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #0A0A0A 0%, #080808 100%)',
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Logo Section */}
      <div style={{ padding: '0 8px', marginBottom: 28, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9A7A30, #C9A84C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#050505',
              flexShrink: 0,
            }}
          >
            MÉ
          </div>
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 16,
                  color: '#C9A84C',
                  letterSpacing: '0.08em',
                  margin: 0,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Maison Élara
              </p>
              <p style={{ fontSize: 8, color: '#444', letterSpacing: '0.15em', margin: 0, marginTop: 2 }}>
                ADMIN PANEL
              </p>
            </div>
          )}
        </div>

        {/* Pulse indicator */}
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 10, paddingLeft: 2 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#33CC66',
                display: 'inline-block',
                boxShadow: '0 0 6px #33CC66',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em' }}>ONLINE</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {!isCollapsed && (
          <p style={{ fontSize: 8, color: '#333', letterSpacing: '0.2em', padding: '0 12px', marginBottom: 6, textTransform: 'uppercase' }}>
            Operations
          </p>
        )}
        {navItems.map((item) => {
          const active = isActive(item);
          const hovered = hoveredItem === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: 0,
                textDecoration: 'none',
                fontSize: 13,
                padding: '10px 12px',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                position: 'relative',
                color: active ? '#F5F0E8' : hovered ? '#C9A84C' : '#555',
                background: active
                  ? 'linear-gradient(90deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))'
                  : hovered
                  ? 'rgba(255,255,255,0.03)'
                  : 'transparent',
                borderLeft: !isCollapsed && active ? '2px solid #C9A84C' : '2px solid transparent',
                fontWeight: active ? 500 : 400,
                letterSpacing: '0.02em',
              }}
            >
              <span>{isCollapsed ? item.label.slice(0, 2).toUpperCase() : item.label}</span>
              {!isCollapsed && active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#C9A84C',
                    flexShrink: 0,
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Action Button at Bottom */}
      <button
        onClick={onToggleCollapse}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '8px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid #1a1a1a',
          borderRadius: 6,
          color: '#555',
          cursor: 'pointer',
          fontSize: 12,
          marginBottom: 10,
          transition: 'color 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
      >
        {isCollapsed ? '➡️' : '⬅️ Collapse'}
      </button>

      {/* Bottom User info & Signout */}
      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 14, marginTop: 4 }}>
        {/* User initials bubble / detail card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.01)',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
              border: '1px solid #C9A84C33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#C9A84C',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 11, color: '#ccc', margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name ?? 'Admin'}
              </p>
              <p style={{ fontSize: 9, color: '#444', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#444',
              textDecoration: 'none',
              fontSize: 11,
              padding: '6px 10px',
              borderRadius: 6,
              transition: 'color 0.2s',
            }}
          >
            <span>🏪</span>
            Storefront
          </Link>
        )}

        <button
          onClick={async () => {
            setSigningOut(true);
            await signOut({ callbackUrl: '/account' });
          }}
          disabled={signingOut}
          title={isCollapsed ? 'Sign Out' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : 10,
            color: signingOut ? '#333' : '#D94F4F',
            background: 'none',
            border: 'none',
            fontSize: 11,
            padding: '6px 10px',
            borderRadius: 6,
            cursor: signingOut ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'color 0.2s',
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>🚪</span>
          {!isCollapsed && <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </aside>
  );
}
