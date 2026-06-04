import { prisma } from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const bestSellers = await prisma.product.findMany({
    where: { isBestSeller: true, isActive: true, deletedAt: null },
    take: 3,
    include: {
      category: { select: { name: true, id: true } },
      sizes: true,
      _count: { select: { reviews: true } },
    }
  });

  const newArrivals = await prisma.product.findMany({
    where: { isNew: true, isActive: true, deletedAt: null },
    take: 2,
    include: {
      category: { select: { name: true, id: true } },
      sizes: true,
      _count: { select: { reviews: true } },
    }
  });

  return (
    <>
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      <HomeClient bestSellers={bestSellers} newArrivals={newArrivals} />
      <Footer />
    </>
  );
}
