'use client';
import { useState, useMemo } from 'react';
import ProductCard from '@/components/product/ProductCard';
import styles from './shop.module.css';
import { ProductListItem } from '@/types/product';

interface ShopClientProps {
  initialProducts: ProductListItem[];
  categories: Array<{ id: string; name: string }>;
}

export default function ShopClient({ initialProducts, categories }: ShopClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 500]);

  const filtered = useMemo(() => {
    let list = activeCategory === 'all' 
      ? [...initialProducts] 
      : initialProducts.filter(p => p.category?.name.toLowerCase() === activeCategory.toLowerCase());
    
    // Use the first size's price for filtering in the list view
    list = list.filter(p => {
      const minPrice = Math.min(...p.sizes.map((s) => s.price));
      return minPrice >= priceRange[0] && minPrice <= priceRange[1];
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => Math.min(...a.sizes.map((s) => s.price)) - Math.min(...b.sizes.map((s) => s.price)));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => Math.min(...b.sizes.map((s) => s.price)) - Math.min(...a.sizes.map((s) => s.price)));
    }
    
    return list;
  }, [activeCategory, sortBy, priceRange, initialProducts]);

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sideSection}>
          <h3 className={styles.sideTitle}>Collections</h3>
          <button
            className={`${styles.catBtn} ${activeCategory === 'all' ? styles.catActive : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Fragrances
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.catBtn} ${activeCategory === cat.name ? styles.catActive : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className={styles.sideSection}>
          <h3 className={styles.sideTitle}>Sort By</h3>
          {[
            { value: 'featured', label: 'Featured' },
            { value: 'price-asc', label: 'Price: Low to High' },
            { value: 'price-desc', label: 'Price: High to Low' },
          ].map(s => (
            <button
              key={s.value}
              className={`${styles.catBtn} ${sortBy === s.value ? styles.catActive : ''}`}
              onClick={() => setSortBy(s.value)}
            >{s.label}</button>
          ))}
        </div>

        <div className={styles.sideSection}>
          <h3 className={styles.sideTitle}>Price Range</h3>
          <p className={styles.priceLabel}>${priceRange[0]} — ${priceRange[1]}</p>
          <input
            type="range" min={0} max={500} value={priceRange[1]}
            className={styles.rangeInput}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
          />
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.resultsHeader}>
          <p className={styles.resultCount}>{filtered.length} Fragrances</p>
        </div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <i className="fa-solid fa-bottle-droplet" style={{ fontSize: 48, color: 'rgba(201,168,76,0.2)', marginBottom: 16 }}></i>
            <p>No fragrances match your selection.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 3} />)}
          </div>
        )}
      </main>
    </div>
  );
}
