'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '../account.module.css';

export default function MfaSetupPage() {
  const router = useRouter();
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  async function startSetup() {
    const response = await fetch('/api/account/mfa/setup', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? 'MFA setup failed.');
      return;
    }
    setOtpauthUrl(data.otpauthUrl);
  }

  async function verify() {
    const response = await fetch('/api/account/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? 'MFA verification failed.');
      return;
    }
    setRecoveryCodes(data.recoveryCodes ?? []);
    setMessage('MFA enabled. Save your recovery codes.');
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.authPage}>
        <div className={styles.authBox}>
          <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Admin Security</p>
          <h1 className={styles.authTitle}>Enable MFA</h1>
          <div className="divider-gold"></div>
          {message && <p style={{ color: message.includes('enabled') ? '#C9A84C' : '#FF3333', fontSize: 13, textAlign: 'center' }}>{message}</p>}
          {!otpauthUrl ? (
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={startSetup}>Start MFA Setup</button>
          ) : (
            <div className={styles.authForm}>
              <p style={{ color: '#aaa', fontSize: 12, wordBreak: 'break-all' }}>{otpauthUrl}</p>
              <input className="input-luxury" placeholder="6-digit authenticator code" value={token} onChange={(e) => setToken(e.target.value)} />
              <button className="btn-gold" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={verify}>Verify MFA</button>
            </div>
          )}
          {recoveryCodes.length > 0 && (
            <div style={{ marginTop: 20, color: '#ccc', fontFamily: 'monospace', fontSize: 12 }}>
              {recoveryCodes.map((code) => <div key={code}>{code}</div>)}
              <button className="btn-gold" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={() => router.push('/admin')}>Continue to Admin</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
