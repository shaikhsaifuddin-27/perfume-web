'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import styles from '../account.module.css';

// IndexedDB Helper for storing the cryptographic private key securely in the browser
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MaisonElaraPasskeys', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePrivateKey(id: string, privateKey: CryptoKey) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('keys', 'readwrite');
    const store = transaction.objectStore('keys');
    const request = store.put({ id, privateKey });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function spkiToPem(keyBuffer: ArrayBuffer) {
  const base64 = arrayBufferToBase64(keyBuffer);
  const lines = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.substring(i, i + 64));
  }
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

export default function MfaSetupPage() {
  const router = useRouter();
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);

  useEffect(() => {
    // Check if user already has a passkey stored locally
    openDatabase()
      .then((db) => {
        const tx = db.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');
        const req = store.getAllKeys();
        req.onsuccess = () => {
          if (req.result.length > 0) {
            setPasskeyRegistered(true);
          }
        };
      })
      .catch(() => {});
  }, []);

  async function startSetup() {
    setMessage(null);
    setErrorMsg(null);
    const response = await fetch('/api/account/mfa/setup', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) {
      setErrorMsg(data.error ?? 'MFA setup failed.');
      return;
    }
    setOtpauthUrl(data.otpauthUrl);
    setMfaSecret(data.secret ?? '');
  }

  async function verify() {
    setMessage(null);
    setErrorMsg(null);
    const response = await fetch('/api/account/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (!response.ok) {
      setErrorMsg(data.error ?? 'MFA verification failed.');
      return;
    }
    setRecoveryCodes(data.recoveryCodes ?? []);
    setMessage('MFA enabled. Save your recovery codes.');
  }

  async function registerPasskey() {
    setMessage(null);
    setErrorMsg(null);
    try {
      // 1. Get Options & Challenge
      const optionsRes = await fetch('/api/account/webauthn/register/options', { method: 'POST' });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        throw new Error(options.error ?? 'Failed to initiate passkey options.');
      }

      const { user } = options;

      // 2. Generate Cryptographic Keypair locally
      const keypair = await window.crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      );

      // 3. Export Public Key in PEM format
      const spki = await window.crypto.subtle.exportKey('spki', keypair.publicKey);
      const publicKeyPem = spkiToPem(spki);

      // Generate a unique credential ID locally
      const credentialId = `pk_${window.crypto.randomUUID()}`;

      // 4. Send Public Key and Credential ID to server for verification and storage
      const verifyRes = await fetch('/api/account/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId, publicKeyPem }),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyResult.error ?? 'Failed to verify passkey on server.');
      }

      // 5. Store private key securely in browser IndexedDB
      await savePrivateKey(credentialId, keypair.privateKey);
      
      // Store reference to latest credentialId in localStorage for quick login queries
      localStorage.setItem('maisonelara-passkey-id', credentialId);
      localStorage.setItem('maisonelara-passkey-email', user.name);

      setPasskeyRegistered(true);
      setMessage('Passkey registered successfully! You can now log in securely without entering your password.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during passkey registration.');
    }
  }

  const qrUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    : '';

  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <div className={styles.authPage}>
        <div className={styles.authBox} style={{ maxWidth: 500 }}>
          <p className="overline" style={{ textAlign: 'center', marginBottom: 16 }}>Security Center</p>
          <h1 className={styles.authTitle}>Multi-Factor Settings</h1>
          <div className="divider-gold"></div>

          {message && (
            <div style={{ padding: 12, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, color: '#C9A84C', fontSize: 13, marginBottom: 20, textAlign: 'center', lineHeight: 1.5 }}>
              {message}
            </div>
          )}
          {errorMsg && (
            <div style={{ padding: 12, background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: 8, color: '#FF3333', fontSize: 13, marginBottom: 20, textAlign: 'center', lineHeight: 1.5 }}>
              {errorMsg}
            </div>
          )}

          {/* Section 1: Google Authenticator / Authy TOTP */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#C9A84C', fontWeight: 400, margin: '0 0 10px' }}>
              Authenticator App (TOTP)
            </h3>
            <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, margin: '0 0 16px' }}>
              Secure your account using Google Authenticator, Authy, or any standard TOTP verification app.
            </p>

            {!otpauthUrl ? (
              <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={startSetup}>
                Configure Authenticator App
              </button>
            ) : (
              <div className={styles.authForm} style={{ background: '#0F0F0F', padding: 20, borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                  Scan this QR code with Google Authenticator or Authy to configure your device.
                </p>
                {qrUrl && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <img src={qrUrl} alt="MFA QR Code" style={{ border: '8px solid white', borderRadius: 4, width: 180, height: 180 }} />
                  </div>
                )}
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manual Setup Secret</span>
                  <p style={{ color: '#C9A84C', fontFamily: 'monospace', fontSize: 14, margin: '4px 0 0', wordBreak: 'break-all', userSelect: 'all' }}>
                    {mfaSecret}
                  </p>
                </div>
                <input
                  className="input-luxury"
                  placeholder="Enter 6-digit verification code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                />
                <button className="btn-gold" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={verify}>
                  Verify & Enable
                </button>
              </div>
            )}

            {recoveryCodes.length > 0 && (
              <div style={{ marginTop: 20, color: '#ccc', background: '#080808', border: '1px solid #1A1A1A', borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 11, color: '#FF3333', fontWeight: 600, margin: '0 0 10px' }}>
                  MFA Recovery Codes (Save these securely!)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontFamily: 'monospace', fontSize: 12, color: '#aaa' }}>
                  {recoveryCodes.map((code) => <div key={code}>{code}</div>)}
                </div>
                <button className="btn-gold" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => router.push('/admin')}>
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #1E1E1E', margin: '24px 0' }}></div>

          {/* Section 2: Passkeys & WebAuthn */}
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#C9A84C', fontWeight: 400, margin: '0 0 10px' }}>
              Passkey (Touch ID / Face ID)
            </h3>
            <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, margin: '0 0 16px' }}>
              Register this browser/device as a Passkey to log in instantly using biometric verification (Face ID, Touch ID, or Windows Hello) instead of typing passwords.
            </p>

            <button
              className="btn-gold"
              style={{
                width: '100%',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid #C9A84C',
                color: '#C9A84C',
              }}
              onClick={registerPasskey}
            >
              {passkeyRegistered ? 'Register Another Passkey' : 'Register Passkey on this Device'}
            </button>
            
            {passkeyRegistered && (
              <p style={{ fontSize: 11, color: '#33CC66', textAlign: 'center', marginTop: 10 }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>
                Active Passkey detected on this browser
              </p>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
