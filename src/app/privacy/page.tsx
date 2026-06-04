import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';

export const metadata = {
  title: 'Privacy Policy | Maison Élara',
  description: 'Maison Élara Privacy Policy — GDPR and DPDPA Compliance Statement.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <main style={{ minHeight: '80vh', padding: '140px 10vw 80px', background: '#050505', color: '#F5F0E8' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p className="overline" style={{ color: '#C9A84C', marginBottom: 12 }}>Compliance & Legal</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, marginBottom: 30 }}>Privacy Policy</h1>
          <div className="divider-gold" style={{ marginBottom: 40 }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, lineHeight: '1.8', color: '#ccc' }}>
            <p>
              At <strong>MAISON ÉLARA</strong>, we value the trust you place in us. This Privacy Policy describes how we collect, use, and protect your personal data in accordance with the European General Data Protection Regulation (GDPR) and the Indian Digital Personal Data Protection Act (DPDPA).
            </p>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>1. Information We Collect</h2>
              <p>We collect personal data that you provide directly to us, including:</p>
              <ul>
                <li>Identity Data: Name, email address, phone number, shipping address.</li>
                <li>Financial and Transaction Data: Payment status, purchase amounts, order details (handled securely via Stripe Checkout).</li>
                <li>Technical Data: IP address, cookie consent parameters, log details.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>2. Lawful Basis for Processing</h2>
              <p>We process your personal data under the following lawful bases:</p>
              <ul>
                <li><strong>Consent:</strong> For marketing emails, newsletter subscriptions, and non-essential cookies. You can withdraw consent at any time.</li>
                <li><strong>Contract Fulfillment:</strong> To process and ship your luxury fragrance orders.</li>
                <li><strong>Legal Obligation:</strong> To maintain transaction records for tax compliance.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>3. Data Rights (GDPR & DPDPA)</h2>
              <p>You have the following rights regarding your personal data:</p>
              <ul>
                <li><strong>Right of Access & Portability:</strong> You can download a copy of all your stored data in JSON format from your account profile settings.</li>
                <li><strong>Right to Rectification:</strong> You can correct or update your profile name, phone number, and address book inside the Account dashboard.</li>
                <li><strong>Right to Erasure (Anonymization):</strong> You can request full erasure of your account. If you have historical orders, we redact all PII (name, phone, address, email) to preserve financial audits while deleting other tracking details.</li>
                <li><strong>Grievance Redressal:</strong> In accordance with DPDPA, you can contact our Data Protection Officer for any inquiries or grievances.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>4. Data Security</h2>
              <p>
                We implement industry-standard technical and organizational security controls (MFA, WebAuthn, brute force lockout protection, rate limiting, and encrypted database TLS routes) to protect your personal data from unauthorized access or breaches.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>5. Contact Us</h2>
              <p>
                If you have questions about this policy or wish to exercise your rights, please reach out to us through our <Link href="/contact" style={{ color: '#C9A84C', textDecoration: 'underline' }}>Contact Page</Link> or email our privacy team at <code>privacy@maisonelara.com</code>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
