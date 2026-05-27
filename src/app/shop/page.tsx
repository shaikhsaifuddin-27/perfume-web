import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { prisma } from '@/lib/prisma';
import ShopClient from './ShopClient';
import styles from './shop.module.css';

export default async function ShopPage() {
  // Fetch products and categories on the server
  const products = await prisma.product.findMany({
    include: {
      category: true,
      sizes: true,
    }
  });

  const categories = await prisma.category.findMany();

  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <p className="overline" style={{ marginBottom: 16 }}>Maison Élara</p>
          <h1 className={styles.heroTitle}>The Collections</h1>
          <div className="divider-gold"></div>
          <p className={styles.heroSub}>Each fragrance is a world unto itself. Explore, discover, and find the one that speaks to your soul.</p>
        </div>
      </div>

      <Suspense fallback={<div className="page-loader"><div className="loader-logo">MAISON ÉLARA</div><div className="loader-line"></div></div>}>
        <ShopClient initialProducts={products} categories={categories} />
      </Suspense>

      <Footer />
    </>
  );
}
