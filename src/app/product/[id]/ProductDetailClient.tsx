'use client';
import { useSyncExternalStore, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import ProductCard from '@/components/product/ProductCard';
import styles from './product.module.css';
import { ProductWithRelations, ProductListItem } from '@/types/product';

interface ProductDetailClientProps {
  product: ProductWithRelations;
  related: ProductListItem[];
}

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export default function ProductDetailClient({ product, related }: ProductDetailClientProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const isWishlisted = mounted && wishlist.includes(product.id);

  // Find the first size or default
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'description' | 'notes' | 'ingredients'>('description');
  const [activeImg, setActiveImg] = useState(0);

  const images = [product.image, '/fragrance_notes.png', '/packaging_luxury.png'];

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Collections</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.images}>
          <div className={styles.thumbs}>
            {images.map((img, i) => (
              <button key={i} className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`} onClick={() => setActiveImg(i)}>
                <Image src={img} alt={`View ${i}`} fill style={{ objectFit: 'cover' }} />
              </button>
            ))}
          </div>
          <div className={styles.mainImg}>
            <Image src={images[activeImg]} alt={product.name} fill style={{ objectFit: 'cover' }} priority />
            {product.badge && <span className={`badge badge-new ${styles.badge}`}>{product.badge}</span>}
          </div>
        </div>

        <div className={styles.info}>
          <p className="overline" style={{ marginBottom: 12 }}>{product.category?.name}</p>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.tagline}>{product.tagline}</p>

          <div className={styles.priceRow}>
            {selectedSize.originalPrice && <span className={styles.originalPrice}>${selectedSize.originalPrice}</span>}
            <span className={styles.price}>${selectedSize.price}</span>
          </div>

          <div className={styles.sizeSection}>
            <p className={styles.sizeLabel}>Size: <strong>{selectedSize.ml}ml</strong></p>
            <div className={styles.sizes}>
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  className={`${styles.sizeBtn} ${selectedSize.id === s.id ? styles.sizeBtnActive : ''}`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s.ml}ml<br />
                  <span className={styles.sizeBtnPrice}>${s.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.addRow}>
            <div className={styles.qty}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button
              className="btn-gold"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                const cartProduct = {
                  id: product.id,
                  name: product.name,
                  tagline: product.tagline,
                  price: selectedSize.price,
                  image: product.image,
                  badge: product.badge,
                  isNew: product.isNew,
                  isBestSeller: product.isBestSeller,
                  sizes: product.sizes.map((s) => ({
                    id: s.id,
                    ml: s.ml,
                    price: s.price,
                    originalPrice: s.originalPrice,
                  })),
                };
                addToCart(cartProduct, selectedSize.ml, qty);
              }}
            >
              Add to Bag — ${(selectedSize.price * qty).toLocaleString()}
            </button>
            <button
              className={styles.wishBtn}
              onClick={() => toggleWishlist(product.id)}
            >
              <i className={isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
                style={{ color: isWishlisted ? '#C9A84C' : undefined }}></i>
            </button>
          </div>

          <div className={styles.features}>
            {[
              { icon: 'fa-truck', label: 'Complimentary Shipping $150+' },
              { icon: 'fa-box', label: 'Luxury Gift Packaging' },
              { icon: 'fa-rotate-left', label: '30-Day Returns' },
              { icon: 'fa-shield-halved', label: 'Authenticity Guaranteed' },
            ].map(f => (
              <div key={f.label} className={styles.feature}>
                <i className={`fa-solid ${f.icon}`} style={{ color: '#C9A84C' }}></i>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.tabs}>
            {(['description', 'notes', 'ingredients'] as const).map(t => (
              <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {tab === 'description' && <p className={styles.desc}>{product.description}</p>}
            {tab === 'notes' && (
              <div className={styles.notes}>
                {(['TOP', 'HEART', 'BASE'] as const).map(tier => {
                  const notes = product.notes.filter((n) => n.type === tier);
                  if (notes.length === 0) return null;
                  return (
                    <div key={tier} className={styles.noteTier}>
                      <p className={styles.noteTierLabel}>{tier} Notes</p>
                      <div className={styles.noteTags}>
                        {notes.map((n) => <span key={n.id} className={styles.noteTag}>{n.name}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {tab === 'ingredients' && (
              <p className={styles.desc} style={{ fontSize: 12 }}>{product.ingredients ?? 'Full ingredient list available on packaging.'}</p>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className={styles.related}>
          <div className="section-header">
            <p className="overline">You May Also Love</p>
            <div className="divider-gold"></div>
            <h2 className="section-title">Complete the Experience</h2>
          </div>
          <div className={styles.relatedGrid}>
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
