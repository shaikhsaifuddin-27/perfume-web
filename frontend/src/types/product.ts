import { Prisma } from '@prisma/client';

/** Full product with all relations — used in product detail page */
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    sizes: true;
    notes: true;
    reviews: { include: { user: { select: { name: true } } } };
    _count: { select: { reviews: true } };
  };
}> & { avgRating?: number };

/** Minimal product for list/card display */
export type ProductListItem = Prisma.ProductGetPayload<{
  include: {
    category: { select: { name: true; id: true } };
    sizes: true;
    _count: { select: { reviews: true } };
  };
}> & { avgRating?: number };

/** Product stored in cart — minimal snapshot to avoid storing full Prisma object */
export interface CartProduct {
  id: string;
  name: string;
  tagline: string;
  price: number;
  image: string;
  badge?: string | null;
  isNew?: boolean;
  isBestSeller?: boolean;
  sizes: Array<{
    id?: string;
    ml: number;
    price: number;
    originalPrice?: number | null;
  }>;
}
