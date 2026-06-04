'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '../account/account.module.css';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#FF3333', '#FF9900', '#33CC66'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {checks.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < score ? colors[score - 1] : '#222',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: 10, color: c.pass ? '#33CC66' : '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={`fa-solid ${c.pass ? 'fa-check' : 'fa-circle'}`} style={{ fontSize: 8 }}></i>
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className={styles.authBox}>
        <h1 className={styles.authTitle}>Invalid Link</h1>
        <div className="divider-gold"></div>
        <p style={{ color: '#555', textAlign: 'center', fontSize: 13, marginBottom: 20 }}>
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
          Request New Link
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setMessage('Password must be 8+ characters with an uppercase letter and a number.');
      return;
    }

    setLoading(true);
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? 'Reset failed. The link may have expired.');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/account'), 3000);
  }

  if (success) {
    return (
      <div className={styles.authBox} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h1 className={styles.authTitle}>Password Reset</h1>
        <div className="divider-gold"></div>
        <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
          Your password has been updated successfully. Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className={styles.authBox}>
      <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Maison Élara</p>
      <h1 className={styles.authTitle}>Set New Password</h1>
      <div className="divider-gold"></div>

      {message && (
        <div style={{
          background: 'rgba(255,51,51,0.08)',
          border: '1px solid #FF333330',
          color: '#FF3333',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          {message}
        </div>
      )}

      <form onSubmit={submit} className={styles.authForm}>
        <div>
          <input
            id="new-password"
            className="input-luxury"
            placeholder="New password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password && <PasswordStrength password={password} />}
        </div>
        <input
          id="confirm-password"
          className="input-luxury"
          placeholder="Confirm new password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={{ marginTop: 12 }}
        />
        <button
          id="reset-password-submit"
          type="submit"
          className="btn-gold"
          disabled={loading}
          style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Updating…' : 'Set New Password'}
        </button>
      </form>

      <p className={styles.authSwitch}>
        <Link href="/forgot-password" className={styles.authLink}>Request a different link</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.authPage}>
        <Suspense fallback={
          <div className={styles.authBox} style={{ textAlign: 'center', color: '#555' }}>Loading…</div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
