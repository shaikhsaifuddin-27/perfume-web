import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';

export const metadata = {
  title: 'Terms of Service | Maison Élara',
  description: 'Maison Élara Terms of Service.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <main style={{ minHeight: '80vh', padding: '140px 10vw 80px', background: '#050505', color: '#F5F0E8' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p className="overline" style={{ color: '#C9A84C', marginBottom: 12 }}>Compliance & Legal</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, marginBottom: 30 }}>Terms of Service</h1>
          <div className="divider-gold" style={{ marginBottom: 40 }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 14, lineHeight: '1.8', color: '#ccc' }}>
            <p>
              Welcome to <strong>MAISON ÉLARA</strong>. These Terms of Service govern your use of our e-commerce platform and the purchase of our luxury fragrances.
            </p>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>1. Account Registration</h2>
              <p>
                To place an order or use certain features (like wishlists, passkeys, and reviews), you must create an account. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>2. Purchasing & Payments</h2>
              <p>
                All prices are displayed in USD. We process transactions securely via Stripe. By providing payment details, you confirm that you have authorization to use the payment method.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>3. Order Cancellations, Returns & Refunds</h2>
              <ul>
                <li><strong>Cancellations:</strong> You can cancel any order that is in PENDING or PROCESSING status from your account order tracking page.</li>
                <li><strong>Returns:</strong> Delivered items can be returned within 14 days of receipt, provided the product remains in original, unopened packaging.</li>
                <li><strong>Refunds:</strong> Refund requests can be raised via your account orders portal. High-value refunds (over $500) require dual admin authorization and will be refunded back to the original Stripe payment method.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#C9A84C', fontWeight: 400, marginBottom: 12 }}>4. Intellectual Property</h2>
              <p>
                All content, designs, images, logos, and perfume descriptions displayed on this site are the exclusive property of Maison Élara and protected by international intellectual property laws.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
