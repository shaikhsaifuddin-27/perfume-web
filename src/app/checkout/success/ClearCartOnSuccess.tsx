'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function ClearCartOnSuccess() {
  const clearCart = useStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
