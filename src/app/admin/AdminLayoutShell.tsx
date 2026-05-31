'use client';

import { ReactNode, useState } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutShellProps {
  children: ReactNode;
  user: { name: string | null; email: string };
}

export default function AdminLayoutShell({ children, user }: AdminLayoutShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#fff', overflow: 'hidden' }}>
      {/* Collapsible Sidebar */}
      <AdminSidebar user={user} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        {/* Top Navbar */}
        <header
          style={{
            height: 64,
            borderBottom: '1px solid #1a1a1a',
            background: '#080808',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          {/* Left: Collapsed toggle button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={toggleCollapse}
              style={{
                background: 'none',
                border: 'none',
                color: '#C9A84C',
                fontSize: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
                borderRadius: 4,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              ☰
            </button>
            <span
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 18,
                letterSpacing: '0.05em',
                color: '#F5F0E8',
                fontWeight: 500,
              }}
            >
              Maison Élara Admin Portal
            </span>
          </div>

          {/* Center: Search input */}
          <div style={{ flex: 1, maxWidth: 400, margin: '0 32px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 13 }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search transaction, customer, SKU, coupon..."
              style={{
                width: '100%',
                background: '#121212',
                border: '1px solid #1E1E1E',
                color: '#fff',
                padding: '8px 12px 8px 34px',
                borderRadius: 8,
                fontSize: 12,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#1E1E1E')}
            />
          </div>

          {/* Right: Notifications + User profile badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Notification center */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ccc',
                  fontSize: 18,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 6,
                  borderRadius: '50%',
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'none'; }}
              >
                🔔
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#FF3333',
                    boxShadow: '0 0 4px #FF3333',
                  }}
                />
              </button>

              {showNotifications && (
                <div
                  style={{
                    position: 'absolute',
                    top: 36,
                    right: 0,
                    width: 280,
                    background: '#0F0F0F',
                    border: '1px solid #1E1E1E',
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.08em' }}>
                    Notifications
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { title: 'New order #ME-9827', text: '5 mins ago' },
                      { title: 'Oud Rose Élixir (50ml) Low Stock', text: '1 hr ago' },
                      { title: 'Daily Database backup succeeded', text: '4 hrs ago' },
                    ].map((item, idx) => (
                      <div key={idx} style={{ paddingBottom: 6, borderBottom: idx < 2 ? '1px solid #161616' : 'none' }}>
                        <p style={{ fontSize: 12, color: '#ccc', margin: 0, fontWeight: 500 }}>{item.title}</p>
                        <p style={{ fontSize: 9, color: '#555', margin: '2px 0 0' }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #161616',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                  border: '1px solid #C9A84C44',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#C9A84C',
                }}
              >
                {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: '#ccc', fontWeight: 500 }}>
                {user.name ?? 'Admin User'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic page content container */}
        <main
          style={{
            flex: 1,
            padding: '32px 40px',
            background: '#070707',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
