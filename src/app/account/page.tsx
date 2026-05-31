'use client';

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from './account.module.css';

type Tab = 'dashboard' | 'orders' | 'addresses' | 'settings';

interface AccountOrder {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  items: {
    quantity: number;
    productName: string;
    sizeMl: number;
    productSize?: { product?: { name: string } };
  }[];
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session && session.user.role === 'ADMIN') router.push('/admin');
  }, [session, router]);

  useEffect(() => {
    if (!session?.user) return;
    setProfileName(session.user.name ?? '');
    setOrdersLoading(true);
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.orders ?? []))
      .finally(() => setOrdersLoading(false));
  }, [session]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn('credentials', { email, password, mfaCode: mfaCode || undefined, redirect: false });
    if (result?.error) setError('Invalid email address or password.');
    setLoading(false);
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSettingsMessage(null);

    const profileRes = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profileName, phone }),
    });

    if (!profileRes.ok) {
      setSettingsMessage('Profile update failed.');
      return;
    }

    if (currentPassword || newPassword) {
      const passwordRes = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!passwordRes.ok) {
        const data = await passwordRes.json();
        setSettingsMessage(data.error ?? 'Password update failed.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
    }

    setSettingsMessage('Settings saved.');
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#C9A84C' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, letterSpacing: '0.1em' }}>Loading Session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <Navbar /><CartDrawer /><SearchOverlay />
        <div className={styles.authPage}>
          <div className={styles.authBox}>
            <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Welcome Back</p>
            <h1 className={styles.authTitle}>Sign In</h1>
            <div className="divider-gold"></div>
            {error && <div style={{ background: 'rgba(255, 51, 51, 0.1)', border: '1px solid #FF333344', color: '#FF3333', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16, textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleSignIn} className={styles.authForm}>
              <input className="input-luxury" placeholder="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="input-luxury" placeholder="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginTop: 12 }} />
              <input className="input-luxury" placeholder="MFA code for protected accounts" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} style={{ marginTop: 12 }} />
              <button type="submit" className="btn-gold" disabled={loading} style={{ marginTop: 20, width: '100%', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
              <p className={styles.authSwitch}><Link href="/forgot-password" className={styles.authLink}>Forgot password?</Link></p>
              <p className={styles.authSwitch}>New to Maison Elara? <Link href="/register" className={styles.authLink}>Create an account</Link></p>
            </form>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const userInitials = (session.user.name ?? session.user.email ?? 'EM').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <div className={styles.avatar}>
            <div className={styles.avatarCircle} style={{ background: 'linear-gradient(135deg, #161616, #222)', border: '1px solid #C9A84C33', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C9A84C', fontWeight: 700, fontSize: 16 }}>{userInitials}</div>
            <p className={styles.avatarName}>{session.user.name ?? 'Elara Member'}</p>
            <p className={styles.avatarEmail}>{session.user.email}</p>
          </div>
          <nav className={styles.sideNav}>
            {(['dashboard', 'orders', 'addresses', 'settings'] as Tab[]).map((item) => (
              <button key={item} className={`${styles.navItem} ${tab === item ? styles.navActive : ''}`} onClick={() => setTab(item)}>
                {item === 'dashboard' ? 'Dashboard' : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>
          <button className={styles.logoutBtn} onClick={() => signOut()}>
            Sign Out
          </button>
        </aside>

        <main className={styles.main}>
          {tab === 'dashboard' && (
            <div>
              <h1 className={styles.pageTitle}>Welcome Back</h1>
              <div className={styles.dashStats}>
                {[
                  { label: 'Total Orders', value: String(orders.length) },
                  { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}` },
                  { label: 'Wishlist Items', value: '0' },
                ].map((s) => (
                  <div key={s.label} className={`${styles.statCard} glass`}>
                    <span className={styles.statVal}>{s.value}</span>
                    <span className={styles.statLbl}>{s.label}</span>
                  </div>
                ))}
              </div>
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
              {ordersLoading && <p style={{ color: '#555' }}>Loading orders...</p>}
              {!ordersLoading && orders.slice(0, 2).map((order) => <OrderCard key={order.id} order={order} />)}
              {!ordersLoading && orders.length === 0 && <p style={{ color: '#555' }}>No orders yet.</p>}
            </div>
          )}

          {tab === 'orders' && (
            <div>
              <h1 className={styles.pageTitle}>My Orders</h1>
              {ordersLoading && <p style={{ color: '#555' }}>Loading orders...</p>}
              {!ordersLoading && orders.map((order) => <OrderCard key={order.id} order={order} withTrack />)}
              {!ordersLoading && orders.length === 0 && <p style={{ color: '#555' }}>No orders yet.</p>}
            </div>
          )}

          {tab === 'addresses' && (
            <div>
              <h1 className={styles.pageTitle}>Saved Addresses</h1>
              <p style={{ color: '#555' }}>Addresses are captured securely during checkout.</p>
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <h1 className={styles.pageTitle}>Account Settings</h1>
              <form className={styles.settingsForm} onSubmit={saveSettings}>
                {settingsMessage && <p style={{ color: settingsMessage.includes('saved') ? '#C9A84C' : '#FF3333', fontSize: 13 }}>{settingsMessage}</p>}
                <input className="input-luxury" placeholder="Full name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                <input className="input-luxury" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginTop: 12 }} />
                <input className="input-luxury" placeholder="Email" defaultValue={session.user.email ?? ''} disabled style={{ marginTop: 12, opacity: 0.6 }} />
                <h3 className={styles.settingsSection}>Change Password</h3>
                <input className="input-luxury" placeholder="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ marginTop: 12 }} />
                <input className="input-luxury" placeholder="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ marginTop: 12 }} />
                <button className="btn-gold" type="submit" style={{ marginTop: 24 }}>Save Changes</button>
              </form>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

function OrderCard({ order, withTrack = false }: { order: AccountOrder; withTrack?: boolean }) {
  const items = order.items.map((item) => `${item.productName || item.productSize?.product?.name || 'Product'} ${item.sizeMl ? `${item.sizeMl}ml` : ''}`).join(', ');
  return (
    <div className={styles.orderCard}>
      <div><p className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</p><p className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</p></div>
      <div><p className={styles.orderItems}>{items}</p></div>
      <div style={{ textAlign: 'right' }}>
        <span className={`${styles.orderStatus} ${order.status === 'DELIVERED' ? styles.statusDelivered : styles.statusShipped}`}>{order.status}</span>
        <p className={styles.orderTotal}>${order.total.toFixed(2)}</p>
        {withTrack && <Link href={`/account/orders/${order.id}`} className="btn-text" style={{ marginTop: 8, fontSize: 10 }}>Track Order</Link>}
      </div>
    </div>
  );
}
