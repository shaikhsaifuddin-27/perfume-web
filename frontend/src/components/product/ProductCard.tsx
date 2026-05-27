'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { ProductListItem } from '@/types/product';
import styles from './ProductCard.module.css';

interface Props {
  product: ProductListItem;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: Props) {
  const { addToCart, toggleWishlist, wishlist, formatPrice } = useStore();
  const isWishlisted = wishlist.includes(product.id);

  // Use the price from the first size as the default price for the card
  const displayPrice = product.sizes?.[0]?.price ?? 0;

  const cartProduct = {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    price: displayPrice,
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

  return (
    <div className={styles.card}>
      <Link href={`/product/${product.id}`} className={styles.imageWrap}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          style={{ objectFit: 'cover' }}
          priority={priority}
          className={styles.img}
        />
        <div className={styles.overlay} />
        {(product.badge || product.isNew) && (
          <span className={`badge badge-new ${styles.badge}`}>
            {product.badge || (product.isNew ? 'New' : '')}
          </span>
        )}
      </Link>

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={() => toggleWishlist(product.id)}
          aria-label="Wishlist"
        >
          <i className={isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
            style={{ color: isWishlisted ? '#C9A84C' : undefined }}></i>
        </button>
        <button className={styles.actionBtn} aria-label="Quick View">
          <i className="fa-regular fa-eye"></i>
        </button>
      </div>

      <div className={styles.info}>
        <div>
          <Link href={`/product/${product.id}`} className={styles.name}>{product.name}</Link>
          <p className={styles.tagline}>{product.tagline}</p>
          <div className={styles.meta}>
            <div className="stars">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < Math.floor(product.avgRating || 5) ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
              ))}
              <span className={styles.reviewCount}>({product._count?.reviews || 0})</span>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <div>
            <span className={styles.price}>{formatPrice(displayPrice)}</span>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => addToCart(cartProduct)}
            aria-label="Add to bag"
          >
            <i className="fa-solid fa-bag-shopping"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
