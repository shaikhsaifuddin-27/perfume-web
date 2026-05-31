'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '../account/account.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setMessage(data.message ?? data.error ?? 'Request complete');
    setLoading(false);
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.authPage}>
        <div className={styles.authBox}>
          <h1 className={styles.authTitle}>Reset Password</h1>
          <div className="divider-gold"></div>
          {message && <p style={{ color: '#C9A84C', fontSize: 13, textAlign: 'center' }}>{message}</p>}
          <form onSubmit={submit} className={styles.authForm}>
            <input className="input-luxury" required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn-gold" disabled={loading} style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p className={styles.authSwitch}><Link href="/account" className={styles.authLink}>Back to sign in</Link></p>
        </div>
      </div>
      <Footer />
    </>
  );
}
