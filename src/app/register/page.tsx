'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '../account/account.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? 'Registration failed');
      return;
    }

    router.push('/account');
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.authPage}>
        <div className={styles.authBox}>
          <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Join Maison Elara</p>
          <h1 className={styles.authTitle}>Create Account</h1>
          <div className="divider-gold"></div>
          {message && <div style={{ color: '#FF3333', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>{message}</div>}
          <form onSubmit={submit} className={styles.authForm}>
            <input className="input-luxury" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input-luxury" required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 12 }} />
            <input className="input-luxury" required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginTop: 12 }} />
            <button className="btn-gold" disabled={loading} style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className={styles.authSwitch}>
            Already have an account? <Link href="/account" className={styles.authLink}>Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
