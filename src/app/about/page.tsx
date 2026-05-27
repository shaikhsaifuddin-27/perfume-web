import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import type { Metadata } from 'next';
import styles from './about.module.css';

export const metadata: Metadata = { title: 'Our Story | MAISON ÉLARA', description: 'Discover the heritage and vision behind Maison Élara luxury perfumes.' };

export default function AboutPage() {
  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />

      {/* Hero */}
      <section className={styles.hero}>
        <Image src="/editorial_lifestyle.png" alt="Maison Élara Story" fill style={{ objectFit: 'cover' }} priority />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <p className="overline" style={{ marginBottom: 20 }}>Est. 2018 — Grasse, France</p>
          <h1 className={styles.heroTitle}>A House Built<br />on Obsession</h1>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.section}>
        <div className="container-sm">
          <div className={styles.missionGrid}>
            <div>
              <p className="overline" style={{ marginBottom: 16 }}>Our Philosophy</p>
              <h2 className={styles.sectionTitle}>Fragrance as<br />Fine Art</h2>
              <div className="divider-left"></div>
              <p className={styles.body}>We believe a fragrance should do more than smell beautiful — it should transport you, define you, and become an extension of your innermost self. Founded by master perfumer Élara Voss in 2018, Maison Élara was born from a refusal to compromise.</p>
              <p className={styles.body} style={{ marginTop: 16 }}>Every composition begins not with trends but with truth — the truth of a specific emotion, a memory, a place that deserves to be preserved in scent.</p>
            </div>
            <div className={styles.missionStats}>
              {[{ num: '12', label: 'Rare Source Countries' }, { num: '47', label: 'Exclusive Formulas' }, { num: '200K+', label: 'Connoisseurs Worldwide' }, { num: '6', label: 'International Awards' }].map(s => (
                <div key={s.label} className={styles.stat}>
                  <span className={styles.statNum}>{s.num}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Atelier */}
      <section id="atelier" className={styles.atelierSection}>
        <div className={styles.atelierImg}>
          <Image src="/fragrance_notes.png" alt="The Atelier" fill style={{ objectFit: 'cover' }} />
          <div className={styles.atelierOverlay}></div>
        </div>
        <div className={styles.atelierContent}>
          <p className="overline" style={{ marginBottom: 16 }}>The Atelier</p>
          <h2 className={styles.sectionTitle}>Where Mastery<br />Is Made</h2>
          <div className="divider-left"></div>
          <p className={styles.body}>Our atelier in Grasse — the perfume capital of the world — is where every formula comes to life. A team of six master perfumers work in dialogue with one another and with the land itself, sourcing local florals alongside rare materials from Oman, Madagascar, and Japan.</p>
          <p className={styles.body} style={{ marginTop: 16 }}>Each formula undergoes a minimum of 18 months of refinement before it ever meets glass or gold.</p>
        </div>
      </section>

      {/* Values */}
      <section className={styles.section} style={{ background: '#060606' }}>
        <div className="container">
          <div className="section-header">
            <p className="overline">Our Principles</p>
            <div className="divider-gold"></div>
            <h2 className="section-title">What We Stand For</h2>
          </div>
          <div className={styles.valuesGrid}>
            {[
              { icon: 'fa-leaf', title: 'Sustainable Sourcing', desc: 'Every ingredient is ethically sourced, supporting local farmers and preserving biodiversity for future generations.' },
              { icon: 'fa-flask', title: 'Artisan Craft', desc: 'No mass production. Every bottle is filled, sealed, and inspected by hand in our Grasse facility.' },
              { icon: 'fa-gem', title: 'Uncompromising Quality', desc: 'We use only the highest concentration of rare raw materials — never diluting the integrity of our vision.' },
              { icon: 'fa-heart', title: 'Emotional Truth', desc: 'Fragrance should evoke. Every composition is built around a specific emotional narrative, not a demographic.' },
            ].map(v => (
              <div key={v.title} className={`${styles.valueCard} glass`}>
                <i className={`fa-solid ${v.icon}`} style={{ fontSize: 28, color: '#C9A84C', marginBottom: 20 }}></i>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.body}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container-sm">
          <p className="overline" style={{ textAlign: 'center', marginBottom: 20 }}>Begin Your Journey</p>
          <h2 className={styles.ctaTitle}>Find Your Signature Scent</h2>
          <div className="divider-gold"></div>
          <p className={styles.body} style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 36px' }}>
            Every fragrance tells a story. Let us help you find the one that speaks yours.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Link href="/shop" className="btn-gold">Explore Collections</Link>
            <Link href="/blog" className="btn-outline">Read the Journal</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
