'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useStore } from '@/store/useStore';
import styles from './Navbar.module.css';

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: session } = useSession();
  const { cartCount, setCartOpen, setSearchOpen, menuOpen, setMenuOpen } = useStore();
  const count = cartCount();

  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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
            <Link href="/contact">Contact</Link>
          </div>
        </div>

        <Link href="/" className={styles.logo}>MAISON<br /><span>ÉLARA</span></Link>

        <div className={styles.navRight}>
          <button className={styles.iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          <Link href="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
            <i className="fa-regular fa-heart"></i>
          </Link>
          <button className={styles.iconBtn} onClick={() => setCartOpen(true)} aria-label="Cart" style={{ position: 'relative' }}>
            <i className="fa-solid fa-bag-shopping"></i>
            {mounted && count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>

          {/* ── Portal Button ── */}
          {mounted && (() => {
            const privileged = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];
            const isAdmin = session && privileged.includes(session.user.role);
            const isUser = session && !isAdmin;
            if (isAdmin) {
              return (
                <Link href="/admin" className={styles.portalBtnAdmin} aria-label="Admin Panel">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>Admin Panel</span>
                </Link>
              );
            }
            if (isUser) {
              return (
                <div className={styles.dropdownContainer} ref={dropdownRef}>
                  <button className={styles.portalBtnUser} onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <i className="fa-regular fa-circle-user"></i>
                    <span>{session.user.name?.split(' ')[0] || 'Account'}</span>
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: 8 }}></i>
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <Link href="/account?tab=dashboard" onClick={() => setDropdownOpen(false)}>Dashboard</Link>
                      <Link href="/account?tab=orders" onClick={() => setDropdownOpen(false)}>My Orders</Link>
                      <Link href="/wishlist" onClick={() => setDropdownOpen(false)}>Wishlist</Link>
                      <Link href="/account?tab=addresses" onClick={() => setDropdownOpen(false)}>Saved Addresses</Link>
                      <Link href="/account?tab=privacy" onClick={() => setDropdownOpen(false)}>Privacy & Data</Link>
                      <Link href="/account?tab=settings" onClick={() => setDropdownOpen(false)}>Settings</Link>
                      <button onClick={() => { setDropdownOpen(false); signOut(); }} className={styles.logoutBtn}>Logout</button>
                    </div>
                  )}
                </div>
              );
            }
            // Guest
            return (
              <div className={styles.authActions}>
                <Link href="/account" className={styles.signInBtn}>Sign In</Link>
                <Link href="/register" className={styles.portalBtnGuest} aria-label="Enter Portal">
                  <i className="fa-solid fa-key"></i>
                  <span>Enter Portal</span>
                </Link>
              </div>
            );
          })()}
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
            <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            
            {(() => {
              const privileged = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'SUPPORT'];
              const isAdmin = session && privileged.includes(session.user.role);
              const isUser = session && !isAdmin;
              if (isAdmin) {
                return (
                  <>
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                    <Link href="/admin/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
                    <Link href="/admin/products" onClick={() => setMenuOpen(false)}>Products</Link>
                    <Link href="/admin/coupons" onClick={() => setMenuOpen(false)}>Coupons</Link>
                    <button onClick={() => { setMenuOpen(false); signOut(); }} className={styles.mobileLogoutBtn}>Logout</button>
                  </>
                );
              }
              if (isUser) {
                return (
                  <>
                    <Link href="/account?tab=dashboard" onClick={() => setMenuOpen(false)}>My Account</Link>
                    <Link href="/account?tab=orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
                    <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
                    <Link href="/account?tab=addresses" onClick={() => setMenuOpen(false)}>Saved Addresses</Link>
                    <Link href="/account?tab=privacy" onClick={() => setMenuOpen(false)}>Privacy & Data</Link>
                    <Link href="/account?tab=settings" onClick={() => setMenuOpen(false)}>Settings</Link>
                    <button onClick={() => { setMenuOpen(false); signOut(); }} className={styles.mobileLogoutBtn}>Logout</button>
                  </>
                );
              }
              return (
                <>
                  <Link href="/account" onClick={() => setMenuOpen(false)}>Sign In</Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>Create Account</Link>
                </>
              );
            })()}
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
