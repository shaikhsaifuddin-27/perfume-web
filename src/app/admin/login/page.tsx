'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '@/app/account/account.module.css';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MaisonElaraPasskeys', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function AdminLoginPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const privileged = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];
    if (session) {
      if (privileged.includes(session.user.role)) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    }
  }, [session, router]);

  async function handlePasskeySignIn() {
    if (!email) {
      setError('Please enter your administrator email first.');
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

      // Check role post-login
      const sessionRes = await fetch('/api/auth/session');
      const latestSession = await sessionRes.json();
      const privileged = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];

      if (latestSession?.user) {
        if (!privileged.includes(latestSession.user.role)) {
          await signOut({ redirect: false });
          throw new Error('Access Denied: Unprivileged account.');
        }
        router.push('/admin');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Passkey sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        mfaCode: mfaCode || undefined,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email address or password.');
        setLoading(false);
        return;
      }

      // Fetch latest session to check role
      const sessionRes = await fetch('/api/auth/session');
      const latestSession = await sessionRes.json();
      const privileged = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];

      if (latestSession?.user) {
        if (!privileged.includes(latestSession.user.role)) {
          await signOut({ redirect: false });
          setError('Access Denied: Unprivileged account.');
          setLoading(false);
          return;
        }
        router.push('/admin');
      }
    } catch {
      setError('An unexpected login error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#C9A84C' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, letterSpacing: '0.1em' }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.authPage} style={{ background: '#050505' }}>
        <div className={styles.authBox} style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <p className="overline" style={{ textAlign: 'center', color: '#C9A84C', marginBottom: 16 }}>Staff Administration</p>
          <h1 className={styles.authTitle}>Portal Login</h1>
          <div className="divider-gold"></div>
          
          {error && (
            <div style={{ background: 'rgba(255, 51, 51, 0.08)', border: '1px solid rgba(255, 51, 51, 0.25)', color: '#FF3333', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className={styles.authForm}>
            <input
              id="admin-email"
              className="input-luxury"
              placeholder="Administrator email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              id="admin-password"
              className="input-luxury"
              placeholder="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 12 }}
              autoComplete="current-password"
            />
            <input
              id="admin-mfa"
              className="input-luxury"
              placeholder="Verification MFA code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              style={{ marginTop: 12 }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <input
                id="remember-device"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                style={{ accentColor: '#C9A84C', cursor: 'pointer' }}
              />
              <label htmlFor="remember-device" style={{ fontSize: 12, color: '#aaa', cursor: 'pointer', userSelect: 'none' }}>
                Remember this device
              </label>
            </div>

            <button type="submit" className="btn-gold" disabled={loading} style={{ marginTop: 24, width: '100%', justifyContent: 'center', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>

            <button type="button" onClick={handlePasskeySignIn} className="btn-gold" disabled={loading} style={{ marginTop: 12, width: '100%', justifyContent: 'center', background: 'transparent', border: '1px solid #C9A84C', color: '#C9A84C', cursor: loading ? 'not-allowed' : 'pointer' }}>
              Sign In with Passkey
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#C9A84C' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, letterSpacing: '0.1em' }}>Loading...</p>
      </div>
    }>
      <AdminLoginPageContent />
    </Suspense>
  );
}
