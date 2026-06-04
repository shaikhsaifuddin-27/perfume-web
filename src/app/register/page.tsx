'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateClientSide() {
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const validationError = validateClientSide();
    if (validationError) {
      setMessage(validationError);
      setLoading(false);
      return;
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    // Auto-sign in after successful registration
    await signIn('credentials', { email, password, redirect: false });
    router.push('/account');
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.authPage}>
        <div className={styles.authBox}>
          <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Join Maison Élara</p>
          <h1 className={styles.authTitle}>Create Account</h1>
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
            <input
              id="register-name"
              className="input-luxury"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <input
              id="register-email"
              className="input-luxury"
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginTop: 12 }}
              autoComplete="email"
            />
            <div style={{ marginTop: 12 }}>
              <input
                id="register-password"
                className="input-luxury"
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {password && <PasswordStrength password={password} />}
            </div>
            <input
              id="register-confirm"
              className="input-luxury"
              required
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ marginTop: 12 }}
              autoComplete="new-password"
            />
            {confirm && password !== confirm && (
              <p style={{ color: '#FF3333', fontSize: 10, marginTop: 4 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 4 }}></i>
                Passwords do not match
              </p>
            )}
            <button
              id="register-submit"
              className="btn-gold"
              type="submit"
              disabled={loading}
              style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className={styles.authSwitch}>
            Already have an account?{' '}
            <Link href="/account" className={styles.authLink}>Sign in</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
