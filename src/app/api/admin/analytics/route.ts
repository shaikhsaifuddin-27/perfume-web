import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const allowed = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'];
  if (!session || !allowed.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysStr = searchParams.get('days') ?? '30';
  const days = parseInt(daysStr, 10);

  if (isNaN(days) || days < 7 || days > 365) {
    return NextResponse.json(
      { error: 'Days parameter must be an integer between 7 and 365.' },
      { status: 400 }
    );
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const cacheKey = `cache:admin:analytics:${days}`;

  if (redisUrl && redisToken) {
    try {
      const cacheRes = await fetch(`${redisUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['GET', cacheKey]),
      });
      if (cacheRes.ok) {
        const cacheData = await cacheRes.json();
        if (cacheData?.result) {
          return NextResponse.json(JSON.parse(cacheData.result));
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Revenue per day
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
    select: { createdAt: true, total: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  // Build day-by-day revenue map
  const revenueMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    revenueMap[key] = { revenue: 0, orders: 0 };
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (revenueMap[key]) {
      revenueMap[key].revenue += o.total;
      revenueMap[key].orders += 1;
    }
  }
  const revenueByDay = Object.entries(revenueMap).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    orders: data.orders,
  }));

  // Order status breakdown
  const statusGroups = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { total: true },
  });
  const statusBreakdown = statusGroups.map((g) => ({
    status: g.status,
    count: g._count.id,
    revenue: g._sum.total ?? 0,
  }));

  // Top categories by revenue
  const categories = await prisma.category.findMany({
    include: {
      products: {
        include: {
          sizes: {
            include: {
              orderItems: {
                include: { order: { select: { status: true } } },
              },
            },
          },
        },
      },
    },
  });

  const categoryRevenue = categories.map((cat) => {
    let revenue = 0;
    let unitsSold = 0;
    for (const product of cat.products) {
      for (const size of product.sizes) {
        for (const item of size.orderItems) {
          if (item.order.status !== 'CANCELLED') {
            revenue += item.priceAtTime * item.quantity;
            unitsSold += item.quantity;
          }
        }
      }
    }
    return { category: cat.name, revenue: Math.round(revenue * 100) / 100, unitsSold };
  }).sort((a, b) => b.revenue - a.revenue);

  // Top products by revenue
  const products = await prisma.product.findMany({
    include: {
      sizes: {
        include: {
          orderItems: {
            include: { order: { select: { status: true } } },
          },
        },
      },
    },
    take: 10,
  });

  const topProducts = products.map((p) => {
    let revenue = 0;
    let unitsSold = 0;
    for (const size of p.sizes) {
      for (const item of size.orderItems) {
        if (item.order.status !== 'CANCELLED') {
          revenue += item.priceAtTime * item.quantity;
          unitsSold += item.quantity;
        }
      }
    }
    return { name: p.name, revenue: Math.round(revenue * 100) / 100, unitsSold, image: p.image };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const responseData = {
    revenueByDay,
    statusBreakdown,
    categoryRevenue,
    topProducts,
  };

  if (redisUrl && redisToken) {
    try {
      await fetch(`${redisUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['SET', cacheKey, JSON.stringify(responseData), 'EX', '300']),
      });
    } catch {
      // Ignore cache write errors
    }
  }

  return NextResponse.json(responseData);
}
