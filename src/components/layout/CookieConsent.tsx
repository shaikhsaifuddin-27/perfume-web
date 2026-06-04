'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function CookieConsent() {
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const consent = localStorage.getItem('maisonelara-cookie-consent');
        if (!consent) {
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Cookie consent check error:', err);
      }
    };
    checkConsent();
  }, []);

  const saveConsent = async (prefs: typeof preferences) => {
    try {
      localStorage.setItem('maisonelara-cookie-consent', JSON.stringify({ ...prefs, date: new Date().toISOString() }));
    } catch (err) {
      console.error('Cookie consent save error:', err);
    }
    setIsVisible(false);

    if (session?.user) {
      try {
        await fetch('/api/account/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'COOKIE_MARKETING',
            status: prefs.marketing ? 'GRANTED' : 'WITHDRAWN',
          }),
        });
        await fetch('/api/account/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'COOKIE_ANALYTICS',
            status: prefs.analytics ? 'GRANTED' : 'WITHDRAWN',
          }),
        });
      } catch {
        // Fail silently
      }
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        right: 24,
        maxWidth: 500,
        zIndex: 9999,
        background: '#0F0F0F',
        border: '1px solid rgba(201, 168, 76, 0.2)',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
        color: '#F5F0E8',
        fontFamily: 'var(--font-sans), sans-serif',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-serif), serif',
          fontSize: 20,
          fontWeight: 300,
          color: '#C9A84C',
          margin: '0 0 12px 0',
          letterSpacing: '0.05em',
        }}
      >
        Maison Élara Privacy Consent
      </h3>
      <p style={{ fontSize: 13, lineHeight: '1.6', color: '#ccc', margin: '0 0 20px 0' }}>
        We use cookies to optimize your shopping experience, analyze site traffic, and personalize advertisements in accordance with GDPR and DPDPA regulations.
      </p>

      {showPreferences ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C9A84C' }}>Necessary Cookies</span>
              <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Required for standard site functions.</p>
            </div>
            <input type="checkbox" checked disabled style={{ accentColor: '#C9A84C' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C9A84C' }}>Analytics Cookies</span>
              <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Help us analyze visitor counts and traffic sources.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
              style={{ accentColor: '#C9A84C', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#C9A84C' }}>Marketing Cookies</span>
              <p style={{ margin: 0, fontSize: 11, color: '#888' }}>Used for behavioral ads and shopping recommendation campaigns.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
              style={{ accentColor: '#C9A84C', cursor: 'pointer' }}
            />
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {showPreferences ? (
          <>
            <button
              onClick={handleSavePreferences}
              style={{
                background: '#C9A84C',
                color: '#050505',
                border: 'none',
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Save Preferences
            </button>
            <button
              onClick={() => setShowPreferences(false)}
              style={{
                background: 'transparent',
                color: '#888',
                border: 'none',
                padding: '10px 14px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleAcceptAll}
              style={{
                background: '#C9A84C',
                color: '#050505',
                border: 'none',
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Accept All
            </button>
            <button
              onClick={() => setShowPreferences(true)}
              style={{
                background: 'transparent',
                color: '#C9A84C',
                border: '1px solid rgba(201, 168, 76, 0.4)',
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              Customize
            </button>
          </>
        )}
      </div>
    </div>
  );
}
