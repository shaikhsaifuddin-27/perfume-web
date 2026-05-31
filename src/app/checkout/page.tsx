'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import styles from './checkout.module.css';

type Step = 'info' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { cart, cartTotal } = useStore();
  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    country: 'United States',
    zip: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const total = cartTotal();

  // Handle pre-filling user info if logged in
  useEffect(() => {
    if (session?.user) {
      setForm(f => ({
        ...f,
        email: session.user?.email || '',
        firstName: session.user?.name?.split(' ')[0] || '',
        lastName: session.user?.name?.split(' ').slice(1).join(' ') || '',
      }));
    }
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('canceled') === 'true') {
      setError('Checkout was canceled. You can modify your bag and try again.');
      setStep('payment');
    }
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const handleStripeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            size: item.size,
            quantity: item.quantity,
          })),
          email: form.email,
          couponCode: couponCode.trim() || undefined,
          shipping: form,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('Stripe redirect error:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <>
        <Navbar /><CartDrawer /><SearchOverlay />
        <div className={styles.success}>
          <p className="overline" style={{ marginBottom: 16 }}>Checking Session</p>
          <h1 className={styles.successTitle}>Loading Checkout</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Navbar /><CartDrawer /><SearchOverlay />
        <div className={styles.success}>
          <p className="overline" style={{ marginBottom: 16 }}>Secure Checkout</p>
          <h1 className={styles.successTitle}>Sign In Required</h1>
          <div className="divider-gold"></div>
          <p className={styles.successSub}>
            Please sign in before checkout so your payment can be securely linked to your order history.
          </p>
          <Link href="/account" className="btn-gold">Sign In</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <div className={styles.page}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>MAISON ÉLARA</Link>

          {/* Steps */}
          <div className={styles.steps}>
            {(['info', 'shipping', 'payment'] as Step[]).map((s, i) => (
              <div key={s} className={styles.stepItem}>
                <div className={`${styles.stepNum} ${step === s ? styles.stepActive : ((['info','shipping','payment'] as Step[]).indexOf(step) > i ? styles.stepDone : '')}`}>
                  {(['info','shipping','payment'] as Step[]).indexOf(step) > i ? <i className="fa-solid fa-check" style={{ fontSize: 10 }}></i> : i + 1}
                </div>
                <span className={styles.stepLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                {i < 2 && <div className={styles.stepLine}></div>}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: '#FF333311', border: '1px solid #FF333333', color: '#FF3333', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 13 }}>
              {error}
            </div>
          )}

          {step === 'info' && (
            <div className={styles.form}>
              <h2 className={styles.formTitle}>Contact Information</h2>
              <input className="input-luxury" placeholder="Email address" value={form.email} onChange={update('email')} style={{ marginBottom: 12 }} />
              <div className={styles.row}>
                <input className="input-luxury" placeholder="First name" value={form.firstName} onChange={update('firstName')} />
                <input className="input-luxury" placeholder="Last name" value={form.lastName} onChange={update('lastName')} />
              </div>
              <input className="input-luxury" placeholder="Phone number" value={form.phone} onChange={update('phone')} style={{ marginTop: 12 }} />
              <button
                className="btn-gold"
                style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (!form.email || !form.firstName) {
                    setError('Email and First name are required.');
                    return;
                  }
                  setError(null);
                  setStep('shipping');
                }}
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {step === 'shipping' && (
            <div className={styles.form}>
              <h2 className={styles.formTitle}>Shipping Address</h2>
              <input className="input-luxury" placeholder="Address" value={form.address} onChange={update('address')} style={{ marginBottom: 12 }} />
              <div className={styles.row}>
                <input className="input-luxury" placeholder="City" value={form.city} onChange={update('city')} />
                <input className="input-luxury" placeholder="ZIP Code" value={form.zip} onChange={update('zip')} />
              </div>
              <select className="input-luxury" value={form.country} onChange={update('country')} style={{ marginTop: 12 }}>
                {['United States', 'United Kingdom', 'France', 'UAE', 'Germany', 'Australia'].map(c => <option key={c}>{c}</option>)}
              </select>
              <div className={styles.shippingOptions}>
                {[{ label: 'Standard Shipping', sub: '5-7 business days', price: 'FREE' }].map((opt, i) => (
                  <div key={i} className={`${styles.shippingOpt} ${styles.shippingOptActive}`}>
                    <div>
                      <p className={styles.shippingLabel}>{opt.label}</p>
                      <p className={styles.shippingSub}>{opt.sub}</p>
                    </div>
                    <span className={styles.shippingPrice}>{opt.price}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn-outline" onClick={() => setStep('info')}>Back</button>
                <button
                  className="btn-gold"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    if (!form.address || !form.city || !form.zip) {
                      setError('Please enter a shipping address.');
                      return;
                    }
                    setError(null);
                    setStep('payment');
                  }}
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className={styles.form}>
              <h2 className={styles.formTitle}>Secure Payment</h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: '1.6', marginBottom: 24 }}>
                You will be redirected to Stripe to securely complete your payment. Maison Élara does not store your credit card information.
              </p>
              <div className={styles.secureNote}>
                <i className="fa-solid fa-lock" style={{ color: '#C9A84C' }}></i>
                <span>Your payment is secured with 256-bit SSL encryption via Stripe</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn-outline" onClick={() => setStep('shipping')} disabled={loading}>Back</button>
                <button
                  className="btn-gold"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleStripeCheckout}
                  disabled={loading || cart.length === 0}
                >
                  {loading ? 'Initializing Payment...' : `Pay Securely via Stripe — $${(total * 1.08).toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.right}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          <div className={styles.summaryItems}>
            {cart.map(item => {
              const sp = item.product.sizes.find(s => s.ml === item.size)?.price ?? item.product.price;
              return (
                <div key={`${item.product.id}-${item.size}`} className={styles.summaryItem}>
                  <div className={styles.summaryImg}>
                    <Image src={item.product.image} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                    <span className={styles.summaryQty}>{item.quantity}</span>
                  </div>
                  <div className={styles.summaryInfo}>
                    <p className={styles.summaryName}>{item.product.name}</p>
                    <p className={styles.summarySize}>{item.size}ml</p>
                  </div>
                  <span className={styles.summaryPrice}>${(sp * item.quantity).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.summaryTotals}>
            <input
              className="input-luxury"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              style={{ marginBottom: 14 }}
            />
            <div className={styles.totalRow}><span>Subtotal</span><span>${total.toLocaleString()}</span></div>
            <div className={styles.totalRow}><span>Shipping</span><span className={styles.free}>Free</span></div>
            <div className={styles.totalRow}><span>Tax (8%)</span><span>${(total * 0.08).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Total</span>
              <span>${(total * 1.08).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
