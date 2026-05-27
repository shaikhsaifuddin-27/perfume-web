import { prisma } from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/layout/SearchOverlay';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch products from database
  const bestSellers = await prisma.product.findMany({
    where: { isBestSeller: true },
    take: 3,
    include: {
      category: true,
      sizes: true,
    }
  });

  const newArrivals = await prisma.product.findMany({
    where: { isNew: true },
    take: 2,
    include: {
      category: true,
      sizes: true,
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
