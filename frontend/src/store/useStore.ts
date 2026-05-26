import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartProduct } from '@/types/product';

// NOTE: 'use client' is NOT needed on Zustand store files.
// Zustand stores are not React components — they are plain JS modules.

export type { CartProduct };

export interface CartItem {
  product: CartProduct;
  quantity: number;
  size: number; // ml value
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'INR';

const CURRENCY_DATA: Record<Currency, { symbol: string; rate: number }> = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 },
  AED: { symbol: 'د.إ', rate: 3.67 },
  INR: { symbol: '₹', rate: 83.45 },
};

interface StoreState {
  cart: CartItem[];
  wishlist: string[];
  currency: Currency;
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  // Cart actions
  addToCart: (product: CartProduct, size?: number, qty?: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  updateQty: (productId: string, size: number, qty: number) => void;
  clearCart: () => void;
  // Wishlist actions
  toggleWishlist: (productId: string) => void;
  // UI actions
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  // Currency
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number) => string;
  // Computed
  cartTotal: () => number;
  cartCount: () => number;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      currency: 'USD',
      cartOpen: false,
      searchOpen: false,
      menuOpen: false,

      addToCart: (product, size, qty = 1) => {
        const selectedSize = size ?? product.sizes[0]?.ml ?? 50;
        set((state) => {
          const existing = state.cart.find(
            (i) => i.product.id === product.id && i.size === selectedSize
          );
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.product.id === product.id && i.size === selectedSize
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity: qty, size: selectedSize }] };
        });
        set({ cartOpen: true });
      },

      removeFromCart: (productId, size) =>
        set((state) => ({
          cart: state.cart.filter((i) => !(i.product.id === productId && i.size === size)),
        })),

      updateQty: (productId, size, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId, size);
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) =>
            i.product.id === productId && i.size === size ? { ...i, quantity: qty } : i
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        })),

      setCartOpen: (open) => set({ cartOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setMenuOpen: (open) => set({ menuOpen: open }),
      setCurrency: (currency) => set({ currency }),

      formatPrice: (price) => {
        const { currency } = get();
        const data = CURRENCY_DATA[currency];
        const converted = price * data.rate;
        return `${data.symbol}${converted.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
      },

      cartTotal: () =>
        get().cart.reduce((sum, item) => {
          const sizePrice =
            item.product.sizes.find((s) => s.ml === item.size)?.price ?? item.product.price;
          return sum + sizePrice * item.quantity;
        }, 0),

      cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'maison-elara-store',
      // Only persist client-safe data
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        currency: state.currency,
      }),
    }
  )
);
