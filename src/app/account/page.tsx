'use client';

import { useEffect, useState, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { useStore } from '@/store/useStore';
import { ProductListItem } from '@/types/product';
import styles from './account.module.css';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MaisonElaraPasskeys', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

type Tab = 'dashboard' | 'orders' | 'addresses' | 'settings' | 'privacy';

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

interface AddressInfo {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  country: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}

function AccountPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;

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
  const [savedAddresses, setSavedAddresses] = useState<AddressInfo[]>([]);
  const [recommended, setRecommended] = useState<ProductListItem[]>([]);

  const { wishlist } = useStore();
  const wishlistCount = wishlist.length;

  useEffect(() => {
    async function syncTab() {
      if (tabParam && ['dashboard', 'orders', 'addresses', 'settings', 'privacy'].includes(tabParam)) {
        setTab(tabParam);
      }
    }
    syncTab();
  }, [tabParam]);

  async function handlePasskeySignIn() {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const optionsRes = await fetch('/api/account/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(options.error ?? 'Failed to get passkey login options.');
      }

      const { challenge, allowCredentials } = options;

      interface LocalKey {
        id: string;
        privateKey: CryptoKey;
      }

      const db = await openDatabase();
      const keys = await new Promise<LocalKey[]>((resolve, reject) => {
        const tx = db.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as LocalKey[]);
        req.onerror = () => reject(req.error);
      });

      const allowedIds = new Set((allowCredentials || []).map((c: { id: string }) => c.id));
      const localKey = keys.find((k) => allowedIds.has(k.id));

      if (!localKey) {
        throw new Error('No registered passkey found on this device for this account.');
      }

      const signature = await window.crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        localKey.privateKey,
        new TextEncoder().encode(challenge)
      );

      const signatureHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const result = await signIn('credentials', {
        email,
        type: 'passkey',
        credentialId: localKey.id,
        signature: signatureHex,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Passkey sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const privileged = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];
    if (session && privileged.includes(session.user.role)) {
      router.push('/admin');
    }
  }, [session, router]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) return;
      setProfileName(session.user.name ?? '');

      try {
        const r = await fetch('/api/account');
        const data = await r.json();
        if (data.user) {
          setProfileName(data.user.name ?? '');
          setPhone(data.user.phone ?? '');
          setSavedAddresses(data.user.addresses ?? []);
        }
      } catch {
        // ignore
      }

      setOrdersLoading(true);
      try {
        const r = await fetch('/api/orders');
        const data = await r.json();
        setOrders(data.orders ?? []);
      } catch {
        // ignore
      } finally {
        setOrdersLoading(false);
      }

      try {
        const res = await fetch('/api/products?limit=3');
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          setRecommended(data.products.slice(0, 3));
        }
      } catch {
        // ignore
      }
    }
    loadProfile();
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
              <button type="button" onClick={handlePasskeySignIn} className="btn-gold" disabled={loading} style={{ marginTop: 12, width: '100%', justifyContent: 'center', background: 'transparent', border: '1px solid #C9A84C', color: '#C9A84C', cursor: loading ? 'not-allowed' : 'pointer' }}>
                Sign In with Passkey
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
  const loyaltyPoints = Math.round(totalSpent * 0.1);

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
            {(['dashboard', 'orders', 'addresses', 'settings', 'privacy'] as Tab[]).map((item) => (
              <button key={item} className={`${styles.navItem} ${tab === item ? styles.navActive : ''}`} onClick={() => setTab(item)}>
                {item === 'privacy' ? 'Privacy & Data' : item.charAt(0).toUpperCase() + item.slice(1)}
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
              <h1 className={styles.pageTitle}>Welcome Back, {session.user.name || 'Member'}</h1>
              <p style={{ color: '#aaa', fontSize: 13, margin: '-10px 0 24px 0' }}>Experience luxury curated for you.</p>
              
              <div className={styles.dashStats}>
                {[
                  { label: 'Total Orders', value: String(orders.length) },
                  { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}` },
                  { label: 'Wishlist Items', value: String(wishlistCount) },
                  { label: 'Loyalty Points', value: `${loyaltyPoints} pts` },
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

              <div style={{ marginTop: 40 }}>
                <h2 className={styles.sectionTitle}>Saved Addresses</h2>
                {savedAddresses.length === 0 ? (
                  <p style={{ color: '#555', fontSize: 13 }}>No saved addresses. Your address is captured securely during checkout.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginTop: 12 }}>
                    {savedAddresses.map((addr) => (
                      <div key={addr.id} style={{ padding: 16, background: '#0F0F0F', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 8 }}>
                        <p style={{ fontSize: 10, color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                          {addr.isDefault ? 'Default Address' : 'Address'}
                        </p>
                        <p style={{ fontSize: 13, color: '#ccc', margin: 0, fontWeight: 500 }}>
                          {addr.firstName} {addr.lastName}
                        </p>
                        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
                          {addr.address}, {addr.city}, {addr.country} {addr.zip}
                        </p>
                        <p style={{ fontSize: 11, color: '#666', margin: '4px 0 0' }}>
                          Tel: {addr.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 40 }}>
                <h2 className={styles.sectionTitle}>Recommended Fragrances</h2>
                {recommended.length === 0 ? (
                  <p style={{ color: '#555' }}>Loading recommendations...</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 16 }}>
                    {recommended.map((prod) => {
                      const displayPrice = prod.sizes?.[0]?.price ?? 0;
                      return (
                        <Link key={prod.id} href={`/product/${prod.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#0F0F0F', border: '1px solid #1E1E1E', padding: 12, borderRadius: 8, transition: 'border-color 0.3s ease' }}>
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: 4, marginBottom: 8 }}>
                            <Image src={prod.image} alt={prod.name} fill style={{ objectFit: 'cover' }} />
                          </div>
                          <p style={{ fontSize: 14, fontFamily: 'Cormorant Garamond, serif', color: '#F5F0E8', margin: '0 0 2px 0', fontWeight: 400 }}>{prod.name}</p>
                          <p style={{ fontSize: 10, color: '#888', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{prod.tagline}</p>
                          <p style={{ fontSize: 12, color: '#C9A84C', margin: 'auto 0 0 0', fontFamily: 'Cormorant Garamond, serif' }}>${displayPrice.toFixed(2)}</p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
              {savedAddresses.length === 0 ? (
                <p style={{ color: '#555', fontSize: 13 }}>No saved addresses. Your address is captured securely during checkout.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 16 }}>
                  {savedAddresses.map((addr) => (
                    <div key={addr.id} style={{ padding: 20, background: '#0F0F0F', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 10 }}>
                      <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>
                        {addr.isDefault ? 'Default Address' : 'Address'}
                      </p>
                      <p style={{ fontSize: 14, color: '#ccc', margin: 0, fontWeight: 500 }}>
                        {addr.firstName} {addr.lastName}
                      </p>
                      <p style={{ fontSize: 13, color: '#888', margin: '6px 0 0', lineHeight: 1.5 }}>
                        {addr.address}<br />
                        {addr.city}, {addr.country} {addr.zip}
                      </p>
                      <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0' }}>
                        Phone: {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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

          {tab === 'privacy' && (
            <div>
              <h1 className={styles.pageTitle}>Privacy & Data Rights</h1>
              <p style={{ color: '#aaa', fontSize: 13, lineHeight: '1.6', marginBottom: 20 }}>
                In accordance with GDPR and DPDPA, you have full control over your personal data. Below, you can export all your saved profile and transaction records or request complete deletion of your account.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 28 }}>
                <div style={{ padding: 20, background: '#0F0F0F', border: '1px solid rgba(201, 168, 76, 0.1)', borderRadius: 10 }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#C9A84C', fontWeight: 400, margin: '0 0 8px 0' }}>Export Personal Data</h3>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px 0' }}>
                    Download a comprehensive backup of your identity details, saved addresses, wishlist, reviews, order history, and consent records in a machine-readable JSON format.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/account/export');
                        if (!res.ok) throw new Error();
                        const data = await res.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `maison-elara-data-export.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch {
                        alert('Failed to export data.');
                      }
                    }}
                    className="btn-gold"
                    style={{ fontSize: 11, padding: '8px 16px' }}
                  >
                    Download JSON Export
                  </button>
                </div>

                <div style={{ padding: 20, background: '#0F0F0F', border: '1px solid rgba(255, 51, 51, 0.1)', borderRadius: 10 }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#FF3333', fontWeight: 400, margin: '0 0 8px 0' }}>Request Account Erasure</h3>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px 0' }}>
                    Permanently delete your profile. If you have past order history, we redact all PII to maintain compliance with auditing requirements while completely purging other records. <strong>This action cannot be undone.</strong>
                  </p>
                  <button
                    onClick={async () => {
                      if (confirm('Are you absolutely sure you want to request complete erasure of your personal data? This will log you out and anonymize or delete your account permanently.')) {
                        try {
                          const res = await fetch('/api/account/delete', { method: 'DELETE' });
                          if (res.ok) {
                            alert('Your personal data has been erased successfully.');
                            signOut();
                          } else {
                            throw new Error();
                          }
                        } catch {
                          alert('Failed to delete account.');
                        }
                      }
                    }}
                    className="btn-gold"
                    style={{ background: 'transparent', border: '1px solid #FF3333', color: '#FF3333', fontSize: 11, padding: '8px 16px' }}
                  >
                    Erase My Data & Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#C9A84C' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, letterSpacing: '0.1em' }}>Loading...</p>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
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
