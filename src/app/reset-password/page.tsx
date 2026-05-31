'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '../account/account.module.css';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordShell token="" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  return <ResetPasswordShell token={token} />;
}

function ResetPasswordShell({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
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
          <h1 className={styles.authTitle}>Choose New Password</h1>
          <div className="divider-gold"></div>
          {message && <p style={{ color: message.includes('complete') ? '#C9A84C' : '#FF3333', fontSize: 13, textAlign: 'center' }}>{message}</p>}
          <form onSubmit={submit} className={styles.authForm}>
            <input className="input-luxury" required type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn-gold" disabled={loading || !token} style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
          <p className={styles.authSwitch}><Link href="/account" className={styles.authLink}>Back to sign in</Link></p>
        </div>
      </div>
      <Footer />
    </>
  );
}
