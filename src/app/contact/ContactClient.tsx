'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactClient() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null);

  const update = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json() as { message?: string; error?: string };

    setLoading(false);
    if (!response.ok) {
      setResult({ error: data.error ?? 'Something went wrong.' });
    } else {
      setResult({ success: data.message });
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  }

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />
      <main style={{ minHeight: '100vh', background: '#050505', paddingTop: 120, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="overline" style={{ marginBottom: 16 }}>Get in Touch</p>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
              Contact Us
            </h1>
            <div className="divider-gold" style={{ margin: '20px auto' }}></div>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
              Whether you have a question about our fragrances, an order inquiry, or simply wish to share your experience — we would love to hear from you.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {/* Contact Info */}
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5F0E8', marginBottom: 24 }}>
                Our Maison
              </h2>
              {[
                { icon: 'fa-envelope', label: 'Email', value: 'contact@maisonelara.com' },
                { icon: 'fa-phone', label: 'Phone', value: '+1 (800) ELARA-01' },
                { icon: 'fa-location-dot', label: 'Atelier', value: '14 Rue de la Paix, Paris' },
                { icon: 'fa-clock', label: 'Hours', value: 'Mon–Fri, 9am–6pm CET' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`fa-solid ${item.icon}`} style={{ color: '#C9A84C', fontSize: 14 }}></i>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, marginBottom: 4 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 400, color: '#F5F0E8', marginBottom: 24 }}>
                Send a Message
              </h2>

              {result?.success && (
                <div style={{
                  background: 'rgba(51,204,102,0.08)',
                  border: '1px solid rgba(51,204,102,0.25)',
                  color: '#33CC66',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 20,
                }}>
                  <i className="fa-solid fa-check-circle" style={{ marginRight: 8 }}></i>
                  {result.success}
                </div>
              )}

              {result?.error && (
                <div style={{
                  background: 'rgba(255,51,51,0.08)',
                  border: '1px solid rgba(255,51,51,0.25)',
                  color: '#FF3333',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 20,
                }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }}></i>
                  {result.error}
                </div>
              )}

              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  id="contact-name"
                  className="input-luxury"
                  placeholder="Your name"
                  required
                  value={form.name}
                  onChange={update('name')}
                  autoComplete="name"
                />
                <input
                  id="contact-email"
                  className="input-luxury"
                  type="email"
                  placeholder="Email address"
                  required
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="email"
                />
                <select
                  id="contact-subject"
                  className="input-luxury"
                  required
                  value={form.subject}
                  onChange={update('subject')}
                >
                  <option value="">Select subject</option>
                  <option value="Order Inquiry">Order Inquiry</option>
                  <option value="Product Question">Product Question</option>
                  <option value="Returns & Exchanges">Returns &amp; Exchanges</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Press & Media">Press &amp; Media</option>
                  <option value="Other">Other</option>
                </select>
                <textarea
                  id="contact-message"
                  className="input-luxury"
                  placeholder="Your message…"
                  required
                  rows={5}
                  value={form.message}
                  onChange={update('message')}
                  style={{ resize: 'vertical', minHeight: 120 }}
                />
                <button
                  id="contact-submit"
                  type="submit"
                  className="btn-gold"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                      Sending…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane" style={{ marginRight: 8 }}></i>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
