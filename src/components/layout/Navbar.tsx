'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { cartCount, setCartOpen, setSearchOpen, menuOpen, setMenuOpen } = useStore();
  const count = cartCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setVisible(y < lastY || y < 100);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${!visible ? styles.hidden : ''}`}>
        <div className={styles.navLeft}>
          <button className={styles.iconBtn} onClick={() => setMenuOpen(true)} aria-label="Menu">
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>
          <div className={styles.navLinks}>
            <Link href="/shop">Collections</Link>
            <Link href="/about">Maison</Link>
            <Link href="/blog">Journal</Link>
          </div>
        </div>

        <Link href="/" className={styles.logo}>MAISON<br /><span>ÉLARA</span></Link>

        <div className={styles.navRight}>
          <button className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          <Link href="/account" className={styles.iconBtn} aria-label="Account">
            <i className="fa-regular fa-user"></i>
          </Link>
          <Link href="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
            <i className="fa-regular fa-heart"></i>
          </Link>
          <button className={styles.iconBtn} onClick={() => setCartOpen(true)} aria-label="Cart" style={{ position: 'relative' }}>
            <i className="fa-solid fa-bag-shopping"></i>
            {mounted && count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.menuOpen : ''}`}>
        <button className={styles.menuClose} onClick={() => setMenuOpen(false)}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className={styles.menuContent}>
          <div className={styles.menuLogo}>MAISON ÉLARA</div>
          <nav className={styles.menuNav}>
            <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/shop" onClick={() => setMenuOpen(false)}>Collections</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>Maison</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)}>Journal</Link>
            <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
            <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
          </nav>
          <div className={styles.menuFooter}>
            <p className="overline">The Art of Fine Fragrance</p>
          </div>
        </div>
      </div>
      {menuOpen && <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />}
    </>
  );
}
