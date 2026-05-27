'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import styles from './Home.module.css';

interface HomeClientProps {
  bestSellers: any[];
  newArrivals: any[];
}

export default function HomeClient({ bestSellers, newArrivals }: HomeClientProps) {
  const [loaded, setLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const heroSlides = [
    { headline: 'The Art of\nScent Mastery', sub: 'Where ancient rituals meet modern luxury', product: 'Noir Absolu', img: '/product_noir.png' },
    { headline: 'Rare Ingredients.\nTimeless Grace.', sub: 'Curated from the world\'s finest sources', product: 'Oud Rose Élixir', img: '/product_oud_rose.png' },
    { headline: 'A Fragrance\nFor Every Chapter', sub: 'Crafted to become part of your story', product: 'Jasmine Absolue', img: '/product_jasmine.png' },
  ];

  const testimonials = [
    { name: 'Isabelle M.', location: 'Paris', quote: 'Noir Absolu is the only perfume that has ever made me feel truly myself. It is devastating in the most beautiful way.', rating: 5 },
    { name: 'Rashid A.', location: 'Dubai', quote: 'The Oud Rose Élixir exceeded every expectation. The longevity, the sillage — nothing compares at any price point.', rating: 5 },
    { name: 'Céline V.', location: 'New York', quote: 'Maison Élara does not just sell perfume. They sell identity. Jasmine Absolue has become my signature.', rating: 5 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    const interval = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (!loaded) return;
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.fade-up, .fade-in').forEach(el => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="page-loader">
        <div className="loader-logo">MAISON ÉLARA</div>
        <div className="loader-line"></div>
        <p className="overline" style={{ color: 'rgba(201,168,76,0.5)' }}>Curating your experience</p>
      </div>
    );
  }

  return (
    <>
      <section className={styles.hero}>
        {heroSlides.map((slide, i) => (
          <div key={i} className={`${styles.heroSlide} ${i === currentSlide ? styles.active : ''}`}>
            <Image src={slide.img} alt={slide.headline} fill style={{ objectFit: 'cover' }} priority={i === 0} className={styles.heroImg} />
            <div className={styles.heroOverlay} />
          </div>
        ))}
        <div className={styles.heroContent}>
          <p className="overline" style={{ marginBottom: 24 }}>Maison Élara — Est. 2018</p>
          <h1 className={styles.heroTitle}>{heroSlides[currentSlide].headline}</h1>
          <p className={styles.heroSub}>{heroSlides[currentSlide].sub}</p>
          <div className={styles.heroCtas}>
            <Link href="/shop" className="btn-gold">Discover Collections</Link>
            <Link href="/about" className="btn-outline">Our Story</Link>
          </div>
        </div>
        <div className={styles.heroSlideNav}>
          {heroSlides.map((_, i) => (
            <button key={i} className={`${styles.heroDot} ${i === currentSlide ? styles.activeDot : ''}`} onClick={() => setCurrentSlide(i)} />
          ))}
        </div>
        <div className={styles.heroScroll}>
          <div className={styles.scrollLine}></div>
          <span className="overline">Scroll</span>
        </div>
      </section>

      <div className={styles.marqueeBar}>
        <div className={styles.marquee}>
          {['Rare Ingredients', '·', 'Artisan Craftsmanship', '·', 'Timeless Elegance', '·', 'Limited Editions', '·', 'Free Shipping $150+', '·', 'Luxury Packaging', '·'].concat(
            ['Rare Ingredients', '·', 'Artisan Craftsmanship', '·', 'Timeless Elegance', '·', 'Limited Editions', '·', 'Free Shipping $150+', '·', 'Luxury Packaging', '·']
          ).map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      <section className={styles.story}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyImgWrap}>
              <div className={styles.storyImg1}>
                <Image src="/editorial_lifestyle.png" alt="Editorial" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className={styles.storyImg2}>
                <Image src="/fragrance_notes.png" alt="Fragrance Notes" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className={`${styles.storyText} fade-up`}>
              <p className="overline" style={{ marginBottom: 20 }}>The Maison</p>
              <h2 className={styles.storyTitle}>Born of Obsession.<br />Refined by Time.</h2>
              <div className="divider-left"></div>
              <p className={styles.storyBody}>
                In 2018, master perfumer Élara Voss set out with a singular vision: to create fragrances that transcend the ordinary — compositions so layered, so alive, they become inseparable from the wearer&apos;s identity.
              </p>
              <Link href="/about" className="btn-text" style={{ marginTop: 32 }}>
                Discover Our Story <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.productsSection}>
        <div className="container">
          <div className={`section-header fade-up`}>
            <p className="overline">Iconic Fragrances</p>
            <div className="divider-gold"></div>
            <h2 className="section-title">Best Sellers</h2>
          </div>
          <div className={styles.productsGrid}>
            {bestSellers.map((p, i) => <ProductCard key={p.id} product={p} priority={i === 0} />)}
          </div>
          <div className={styles.viewAll}>
            <Link href="/shop" className="btn-outline">View All Fragrances</Link>
          </div>
        </div>
      </section>

      <section className={styles.eleganceSection}>
        <div className={styles.eleganceImg}>
          <Image src="/collection_perfumes.png" alt="Collection" fill style={{ objectFit: 'cover' }} />
          <div className={styles.eleganceOverlay}></div>
        </div>
        <div className={`${styles.eleganceContent} fade-up`}>
          <p className="overline" style={{ marginBottom: 20 }}>Designed for Elegance</p>
          <h2 className={styles.eleganceTitle}>Every Detail.<br />Intentional.</h2>
          <Link href="/shop" className="btn-gold" style={{ marginTop: 36 }}>Explore Collections</Link>
        </div>
      </section>

      <section className={styles.productsSection}>
        <div className="container">
          <div className="section-header fade-up">
            <p className="overline">Just Arrived</p>
            <div className="divider-gold"></div>
            <h2 className="section-title">New Arrivals</h2>
          </div>
          <div className={styles.productsGrid}>
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <section className={styles.testimonials}>
        <div className="container-sm">
          <div className="section-header fade-up">
            <p className="overline">Customer Stories</p>
            <div className="divider-gold"></div>
            <h2 className="section-title">Words of Those Who Wear Us</h2>
          </div>
          <div className={styles.testimonialSlider}>
            <div className={styles.testimonialCard}>
              <blockquote className={styles.quote}>
                &quot;{testimonials[testimonialIdx].quote}&quot;
              </blockquote>
              <div className={styles.testimonialAuthor}>
                <span className={styles.authorName}>{testimonials[testimonialIdx].name}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.newsletter}>
        <div className="container-sm">
          <div className={`${styles.newsletterBox} fade-up`}>
            <h2 className={styles.newsletterTitle}>Join the Inner Circle</h2>
            <div className={styles.newsletterForm}>
              <input className="input-luxury" placeholder="Your email address" type="email" style={{ flex: 1 }} />
              <button className="btn-gold">Subscribe</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
