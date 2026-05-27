import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>MAISON<br /><span>ÉLARA</span></div>
          <p className={styles.tagline}>The art of fine fragrance, distilled into moments that endure.</p>
          <div className={styles.social}>
            {['instagram', 'facebook-f', 'pinterest-p', 'tiktok'].map(s => (
              <a key={s} href="#" className={styles.socialLink} aria-label={s}>
                <i className={`fa-brands fa-${s}`}></i>
              </a>
            ))}
          </div>
        </div>

        <div className={styles.cols}>
          <div className={styles.col}>
            <h4>Collections</h4>
            <nav>
              <Link href="/shop">All Fragrances</Link>
              <Link href="/shop?cat=Oriental">Oriental</Link>
              <Link href="/shop?cat=Floral">Floral</Link>
              <Link href="/shop?cat=Woody">Woody</Link>
              <Link href="/shop?cat=Amber">Amber</Link>
            </nav>
          </div>
          <div className={styles.col}>
            <h4>Maison</h4>
            <nav>
              <Link href="/about">Our Story</Link>
              <Link href="/about#atelier">The Atelier</Link>
              <Link href="/blog">Journal</Link>
              <Link href="#">Sustainability</Link>
              <Link href="#">Press</Link>
            </nav>
          </div>
          <div className={styles.col}>
            <h4>Service</h4>
            <nav>
              <Link href="#">Shipping & Returns</Link>
              <Link href="#">FAQ</Link>
              <Link href="#">Gift Wrapping</Link>
              <Link href="#">Contact Us</Link>
              <Link href="#">Fragrance Guide</Link>
            </nav>
          </div>
          <div className={styles.col}>
            <h4>Newsletter</h4>
            <p className={styles.newsText}>Receive exclusive access to new collections and private events.</p>
            <div className={styles.newsForm}>
              <input className="input-luxury" placeholder="Your email address" type="email" />
              <button className="btn-gold" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>Subscribe</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© 2025 Maison Élara. All rights reserved.</p>
        <div className={styles.legal}>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Cookie Settings</Link>
        </div>
        <div className={styles.payments}>
          {['visa', 'mastercard', 'paypal', 'apple-pay', 'google-pay'].map(p => (
            <span key={p} className={styles.payIcon}>{p.replace('-', ' ')}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
