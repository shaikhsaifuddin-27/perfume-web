'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from './account.module.css';

type Tab = 'dashboard' | 'orders' | 'addresses' | 'settings';

const orders = [
  { id: 'ME-918273', date: 'May 8, 2025', status: 'Delivered', total: 570, items: ['Noir Absolu 50ml', 'Jasmine Absolue 30ml'] },
  { id: 'ME-817364', date: 'April 20, 2025', status: 'Shipped', total: 340, items: ['Oud Rose Élixir 50ml'] },
  { id: 'ME-716253', date: 'March 15, 2025', status: 'Delivered', total: 185, items: ['Élara Collection Set'] },
];

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!loggedIn) {
    return (
      <>
        <Navbar /><CartDrawer /><SearchOverlay />
        <div className={styles.authPage}>
          <div className={styles.authBox}>
            <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Welcome Back</p>
            <h1 className={styles.authTitle}>Sign In</h1>
            <div className="divider-gold"></div>
            <div className={styles.authForm}>
              <input className="input-luxury" placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="input-luxury" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 12 }} />
              <button className="btn-gold" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={() => setLoggedIn(true)}>
                Sign In
              </button>
              <div className={styles.authOr}><span>or continue with</span></div>
              <div className={styles.socialAuth}>
                {['Google', 'Apple', 'Facebook'].map(s => (
                  <button key={s} className={styles.socialBtn} onClick={() => setLoggedIn(true)}>
                    <i className={`fa-brands fa-${s.toLowerCase()}`}></i> {s}
                  </button>
                ))}
              </div>
              <p className={styles.authSwitch}>
                New to Maison Élara? <button className={styles.authLink} onClick={() => setLoggedIn(true)}>Create an account</button>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <div className={styles.avatar}>
            <div className={styles.avatarCircle}><i className="fa-solid fa-user" style={{ fontSize: 28, color: '#C9A84C' }}></i></div>
            <p className={styles.avatarName}>Élara Member</p>
            <p className={styles.avatarEmail}>member@maisonelara.com</p>
          </div>
          <nav className={styles.sideNav}>
            {([
              { key: 'dashboard', icon: 'fa-grid-2', label: 'Dashboard' },
              { key: 'orders', icon: 'fa-box', label: 'My Orders' },
              { key: 'addresses', icon: 'fa-location-dot', label: 'Addresses' },
              { key: 'settings', icon: 'fa-gear', label: 'Settings' },
            ] as { key: Tab; icon: string; label: string }[]).map(item => (
              <button key={item.key} className={`${styles.navItem} ${tab === item.key ? styles.navActive : ''}`} onClick={() => setTab(item.key)}>
                <i className={`fa-solid ${item.icon}`}></i>
                {item.label}
              </button>
            ))}
          </nav>
          <button className={styles.logoutBtn} onClick={() => setLoggedIn(false)}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
          </button>
        </aside>

        <main className={styles.main}>
          {tab === 'dashboard' && (
            <div>
              <h1 className={styles.pageTitle}>Welcome Back</h1>
              <div className={styles.dashStats}>
                {[
                  { label: 'Total Orders', value: '3', icon: 'fa-box' },
                  { label: 'Total Spent', value: '$1,095', icon: 'fa-credit-card' },
                  { label: 'Loyalty Points', value: '2,190', icon: 'fa-star' },
                  { label: 'Wishlist Items', value: '0', icon: 'fa-heart' },
                ].map(s => (
                  <div key={s.label} className={`${styles.statCard} glass`}>
                    <i className={`fa-solid ${s.icon}`} style={{ color: '#C9A84C', fontSize: 20, marginBottom: 12 }}></i>
                    <span className={styles.statVal}>{s.value}</span>
                    <span className={styles.statLbl}>{s.label}</span>
                  </div>
                ))}
              </div>
              <h2 className={styles.sectionTitle}>Recent Orders</h2>
              {orders.slice(0, 2).map(o => (
                <div key={o.id} className={styles.orderCard}>
                  <div><p className={styles.orderId}>{o.id}</p><p className={styles.orderDate}>{o.date}</p></div>
                  <div><p className={styles.orderItems}>{o.items.join(', ')}</p></div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`${styles.orderStatus} ${o.status === 'Delivered' ? styles.statusDelivered : styles.statusShipped}`}>{o.status}</span>
                    <p className={styles.orderTotal}>${o.total}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'orders' && (
            <div>
              <h1 className={styles.pageTitle}>My Orders</h1>
              {orders.map(o => (
                <div key={o.id} className={styles.orderCard}>
                  <div><p className={styles.orderId}>{o.id}</p><p className={styles.orderDate}>{o.date}</p></div>
                  <div><p className={styles.orderItems}>{o.items.join(', ')}</p></div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`${styles.orderStatus} ${o.status === 'Delivered' ? styles.statusDelivered : styles.statusShipped}`}>{o.status}</span>
                    <p className={styles.orderTotal}>${o.total}</p>
                    <button className="btn-text" style={{ marginTop: 8, fontSize: 10 }}>Track Order <i className="fa-solid fa-arrow-right"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'addresses' && (
            <div>
              <h1 className={styles.pageTitle}>Saved Addresses</h1>
              <div className={styles.addressGrid}>
                <div className={`${styles.addressCard} glass`}>
                  <div className={styles.addressDefault}><i className="fa-solid fa-house"></i> Default</div>
                  <p>123 Rue de Rivoli</p>
                  <p>Paris 75001, France</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button className="btn-text" style={{ fontSize: 10 }}>Edit</button>
                    <button className="btn-text" style={{ fontSize: 10, color: 'rgba(245,240,232,0.3)' }}>Remove</button>
                  </div>
                </div>
                <button className={styles.addAddress}>
                  <i className="fa-solid fa-plus" style={{ color: '#C9A84C', fontSize: 24, marginBottom: 8 }}></i>
                  <span>Add New Address</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <h1 className={styles.pageTitle}>Account Settings</h1>
              <div className={styles.settingsForm}>
                <div className={styles.row2}>
                  <input className="input-luxury" placeholder="First name" defaultValue="Élara" />
                  <input className="input-luxury" placeholder="Last name" defaultValue="Member" />
                </div>
                <input className="input-luxury" placeholder="Email" defaultValue="member@maisonelara.com" style={{ marginTop: 12 }} />
                <input className="input-luxury" placeholder="Phone" style={{ marginTop: 12 }} />
                <h3 className={styles.settingsSection}>Change Password</h3>
                <input className="input-luxury" placeholder="Current password" type="password" style={{ marginTop: 12 }} />
                <input className="input-luxury" placeholder="New password" type="password" style={{ marginTop: 12 }} />
                <button className="btn-gold" style={{ marginTop: 24 }}>Save Changes</button>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
