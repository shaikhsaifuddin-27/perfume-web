import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch product with relations
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      sizes: {
        orderBy: { ml: 'asc' }
      },
      notes: true,
    }
  });

  if (!product) return notFound();

  // Fetch related products
  const related = await prisma.product.findMany({
    where: {
      OR: [
        { categoryId: product.categoryId },
        { isBestSeller: true }
      ],
      NOT: { id: product.id }
    },
    take: 3,
    include: {
      sizes: true,
      category: true,
    }
  });

  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <ProductDetailClient product={product} related={related} />
      <Footer />
    </>
  );
}
