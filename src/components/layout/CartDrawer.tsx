'use client';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, cartTotal } = useStore();
  const total = cartTotal();

  return (
    <>
      <div className={`cart-backdrop ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <aside className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className={styles.header}>
          <div>
            <p className="overline">Your Selection</p>
            <h3 className={styles.title}>Shopping Bag</h3>
          </div>
          <button className={styles.close} onClick={() => setCartOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className={styles.empty}>
            <i className="fa-solid fa-bag-shopping" style={{ fontSize: 48, color: 'rgba(201,168,76,0.3)', marginBottom: 16 }}></i>
            <p>Your bag is empty</p>
            <Link href="/shop" className="btn-gold" onClick={() => setCartOpen(false)}>Discover Fragrances</Link>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {cart.map((item) => {
                const sizePrice = item.product.sizes.find(s => s.ml === item.size)?.price ?? item.product.price;
                return (
                  <div key={`${item.product.id}-${item.size}`} className={styles.item}>
                    <div className={styles.itemImage}>
                      <Image src={item.product.image} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.product.name}</p>
                      <p className={styles.itemSize}>{item.size}ml</p>
                      <div className={styles.itemBottom}>
                        <div className={styles.qty}>
                          <button onClick={() => updateQty(item.product.id, item.size, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, item.size, item.quantity + 1)}>+</button>
                        </div>
                        <span className={styles.itemPrice}>${(sizePrice * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <button className={styles.remove} onClick={() => removeFromCart(item.product.id, item.size)}>
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <span className={styles.totalAmount}>${total.toLocaleString()}</span>
              </div>
              <p className={styles.shipping}>Complimentary shipping on orders over $150</p>
              <Link href="/checkout" className="btn-gold" style={{ width: '100%', justifyContent: 'center', display: 'flex' }} onClick={() => setCartOpen(false)}>
                Proceed to Checkout
              </Link>
              <button className="btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => setCartOpen(false)}>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
