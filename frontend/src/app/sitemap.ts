import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Static routes
  const routes = ['', '/shop', '/about', '/blog', '/checkout', '/account'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const dbProducts = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
    });

    const productRoutes = dbProducts.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: (product.updatedAt || new Date()).toISOString().split('T')[0],
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error('Sitemap generation error, returning static routes:', error);
    return routes;
  }
}
