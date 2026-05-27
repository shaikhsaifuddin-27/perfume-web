import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import type { Metadata } from 'next';
import styles from './blog.module.css';

export const metadata: Metadata = { title: 'The Journal | MAISON ÉLARA', description: 'Stories of scent, ingredients, and the art of fragrance.' };

const posts = [
  { title: 'The History of Oud: From Ancient Temples to Modern Perfumery', cat: 'Ingredients', date: 'May 10, 2025', img: '/product_oud_rose.png', excerpt: 'For centuries, oud has been called the wood of the gods. Its journey from sacred incense to the heart of modern luxury perfumery is one of the most fascinating stories in fragrance history.', readTime: '7 min read' },
  { title: 'How to Layer Fragrances Like a Master Perfumer', cat: 'Guide', date: 'May 5, 2025', img: '/fragrance_notes.png', excerpt: 'Layering fragrances is the art of creating your own signature — a composition as unique as a fingerprint. Here is how our in-house perfumers approach this intimate practice.', readTime: '5 min read' },
  { title: 'The Art of the Signature Scent: Finding Your Olfactive Identity', cat: 'Lifestyle', date: 'April 28, 2025', img: '/editorial_lifestyle.png', excerpt: 'Your signature scent is not chosen — it is discovered. It emerges at the intersection of memory, desire, and chemistry. This is your guide to finding it.', readTime: '8 min read' },
  { title: 'Grasse: The Village That Defines Luxury Perfumery', cat: 'Travel', date: 'April 15, 2025', img: '/collection_perfumes.png', excerpt: 'Perched above the French Riviera, Grasse has been the global capital of fine fragrance for four centuries. We take you behind its ancient stone walls.', readTime: '6 min read' },
  { title: 'Understanding Fragrance Concentration: EDP vs EDT vs Parfum', cat: 'Education', date: 'April 8, 2025', img: '/product_noir.png', excerpt: 'The difference between a Parfum and an Eau de Toilette is not just price — it is experience, longevity, and intent. A definitive guide.', readTime: '4 min read' },
  { title: 'The Science of Sillage: Why Some Fragrances Leave a Trail', cat: 'Science', date: 'March 30, 2025', img: '/product_amber.png', excerpt: 'Sillage — French for "wake" — is the invisible trail a fragrance leaves in the air. Here is the chemistry and artistry behind this coveted quality.', readTime: '5 min read' },
];

export default function BlogPage() {
  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />

      <div className={styles.hero}>
        <p className="overline" style={{ marginBottom: 16 }}>Maison Élara</p>
        <h1 className={styles.heroTitle}>The Journal</h1>
        <div className="divider-gold"></div>
        <p className={styles.heroSub}>Stories of scent, craft, and the world of fine fragrance.</p>
      </div>

      {/* Featured */}
      <section className={styles.featuredSection}>
        <div className="container">
          <div className={styles.featured}>
            <div className={styles.featuredImg}>
              <Image src={posts[0].img} alt={posts[0].title} fill style={{ objectFit: 'cover' }} priority />
              <div className={styles.featuredOverlay}></div>
              <span className={`badge ${styles.featuredBadge}`}>{posts[0].cat}</span>
            </div>
            <div className={styles.featuredContent}>
              <p className={styles.postDate}>{posts[0].date} · {posts[0].readTime}</p>
              <h2 className={styles.featuredTitle}>{posts[0].title}</h2>
              <p className={styles.postExcerpt}>{posts[0].excerpt}</p>
              <Link href="#" className="btn-text" style={{ marginTop: 24 }}>Read Article <i className="fa-solid fa-arrow-right"></i></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className={styles.gridSection}>
        <div className="container">
          <div className={styles.grid}>
            {posts.slice(1).map((post, i) => (
              <Link key={i} href="#" className={styles.card}>
                <div className={styles.cardImg}>
                  <Image src={post.img} alt={post.title} fill style={{ objectFit: 'cover' }} className={styles.cardImgEl} />
                  <div className={styles.cardOverlay}></div>
                  <span className={`badge ${styles.cardBadge}`}>{post.cat}</span>
                </div>
                <div className={styles.cardInfo}>
                  <p className={styles.postDate}>{post.date} · {post.readTime}</p>
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                  <span className="btn-text" style={{ marginTop: 16, display: 'inline-flex' }}>Read More <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
