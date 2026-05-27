'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import ProductCard from '@/components/product/ProductCard';
import { useStore } from '@/store/useStore';
import { ProductListItem } from '@/types/product';
import Link from 'next/link';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const { wishlist } = useStore();
  const [wishlistProducts, setWishlistProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setWishlistProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/products?ids=${wishlist.join(',')}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWishlistProducts(data);
        }
      })
      .catch((err) => console.error('Failed to fetch wishlist products:', err))
      .finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <>
      <Navbar /><CartDrawer /><SearchOverlay />

      <div className={styles.page}>
        <div className={styles.header}>
          <p className="overline" style={{ marginBottom: 12 }}>My Account</p>
          <h1 className={styles.title}>Wishlist</h1>
          <div className="divider-gold"></div>
          <p className={styles.sub}>
            {loading ? 'Loading...' : `${wishlistProducts.length} saved ${wishlistProducts.length === 1 ? 'fragrance' : 'fragrances'}`}
          </p>
        </div>

        {loading ? (
          <div className="page-loader" style={{ position: 'relative', height: '200px' }}>
            <div className="loader-line"></div>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className={styles.empty}>
            <i className="fa-regular fa-heart" style={{ fontSize: 64, color: 'rgba(201,168,76,0.2)', marginBottom: 24 }}></i>
            <h2 className={styles.emptyTitle}>Your Wishlist is Empty</h2>
            <p className={styles.emptySub}>Save your favourite fragrances to revisit them whenever you like.</p>
            <Link href="/shop" className="btn-gold" style={{ marginTop: 28 }}>Explore Collections</Link>
          </div>
        ) : (
          <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
            <div className={styles.grid}>
              {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
