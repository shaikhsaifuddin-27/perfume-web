import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';
import AdminDashboardClient from './AdminDashboardClient';

export const metadata: Metadata = { title: 'Dashboard | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

const getAdminStats = unstable_cache(
  async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalUsers,
      recentRevenue,
      prevRevenue,
      recentOrders,
      prevOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ]);

    const revTrend =
      prevRevenue._sum.total && prevRevenue._sum.total > 0
        ? (((recentRevenue._sum.total ?? 0) - prevRevenue._sum.total) / prevRevenue._sum.total) * 100
        : 0;
    const orderTrend =
      prevOrders > 0 ? ((recentOrders - prevOrders) / prevOrders) * 100 : 0;

    // Today's Sales
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySalesAgg = await prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: todayStart }, status: { not: 'CANCELLED' } }
    });
    const todayRevenue = todaySalesAgg._sum.total ?? 0;

    // Average Product Rating
    const ratingAggregate = await prisma.review.aggregate({
      _avg: { rating: true }
    });
    const avgRating = ratingAggregate._avg.rating ?? 4.8;

    // Customer of the Month (highest spending customer in last 30 days)
    const topSpendersThisMonth = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { total: true },
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { _sum: { total: 'desc' } },
      take: 1
    });
    let monthlyTopCustomerName = 'No data';
    let monthlyTopCustomerSpend = 0;
    if (topSpendersThisMonth.length > 0 && topSpendersThisMonth[0].userId) {
      const user = await prisma.user.findUnique({
        where: { id: topSpendersThisMonth[0].userId },
        select: { name: true, email: true }
      });
      monthlyTopCustomerName = user?.name || user?.email || 'Maison Customer';
      monthlyTopCustomerSpend = topSpendersThisMonth[0]._sum.total ?? 0;
    }

    // Customer of the Year (highest spending customer in last 365 days)
    const oneYearAgo = new Date(now);
    oneYearAgo.setDate(now.getDate() - 365);
    const topSpendersThisYear = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { total: true },
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: oneYearAgo }
      },
      orderBy: { _sum: { total: 'desc' } },
      take: 1
    });
    let yearlyTopCustomerName = 'No data';
    let yearlyTopCustomerSpend = 0;
    if (topSpendersThisYear.length > 0 && topSpendersThisYear[0].userId) {
      const user = await prisma.user.findUnique({
        where: { id: topSpendersThisYear[0].userId },
        select: { name: true, email: true }
      });
      yearlyTopCustomerName = user?.name || user?.email || 'Maison Customer';
      yearlyTopCustomerSpend = topSpendersThisYear[0]._sum.total ?? 0;
    }

    // Low stock count (items < 10)
    const lowStockCount = await prisma.productSize.count({
      where: { stock: { lt: 10 } }
    });

    return {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalUsers,
      revTrend: Math.round(revTrend * 10) / 10,
      orderTrend: Math.round(orderTrend * 10) / 10,
      todayRevenue,
      periodRevenue: recentRevenue._sum.total ?? 0,
      avgRating: Math.round(avgRating * 100) / 100,
      monthlyTopCustomerName,
      monthlyTopCustomerSpend,
      yearlyTopCustomerName,
      yearlyTopCustomerSpend,
      lowStockCount,
    };
  },
  ['admin-stats'],
  { revalidate: 300, tags: ['admin'] }
);

const getRecentOrders = unstable_cache(
  async () => {
    return prisma.order.findMany({
      take: 12,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    });
  },
  ['admin-recent-orders'],
  { revalidate: 60, tags: ['orders'] }
);

const getLowStockProducts = unstable_cache(
  async () => {
    return prisma.productSize.findMany({
      where: { stock: { lt: 10 } },
      include: { product: { select: { name: true, image: true } } },
      orderBy: { stock: 'asc' },
      take: 5,
    });
  },
  ['admin-low-stock'],
  { revalidate: 120, tags: ['inventory'] }
);

export default async function AdminDashboard() {
  const [stats, recentOrders, lowStock] = await Promise.all([
    getAdminStats(),
    getRecentOrders(),
    getLowStockProducts(),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    todayOrdersCount,
    pendingOrdersCount,
    recentUsers,
    lowStockForActivity,
    pastUsersCount,
    usersCreatedThisMonth,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.user.findMany({
      where: { role: 'USER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.productSize.findMany({
      where: { stock: { lt: 10 } },
      include: { product: { select: { name: true } } },
      take: 5,
    }),
    prisma.user.count({ where: { role: 'USER', createdAt: { lt: thirtyDaysAgo } } }),
    prisma.user.findMany({
      where: { role: 'USER', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Cumulative Customer Growth Calculation
  const growthMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (30 - 1 - i));
    const key = d.toISOString().slice(0, 10);
    growthMap[key] = 0;
  }
  for (const u of usersCreatedThisMonth) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (growthMap[key] !== undefined) {
      growthMap[key] += 1;
    }
  }

  let cumulative = pastUsersCount;
  const customerGrowth = Object.entries(growthMap).map(([date, count]) => {
    cumulative += count;
    return { date, count: cumulative };
  });

  // Recent Business Activity
  const activities = [
    ...recentOrders.map((o) => ({
      id: o.id,
      type: o.status === 'CANCELLED' ? 'REFUND' : 'ORDER',
      title: o.status === 'CANCELLED' ? 'Refund Request' : 'New Order',
      description: o.status === 'CANCELLED'
        ? `Order #${o.id.slice(0, 8).toUpperCase()} cancellation / refund requested.`
        : `New order #${o.id.slice(0, 8).toUpperCase()} placed by ${o.user?.name || o.user?.email || 'Guest'} for $${o.total.toFixed(2)}.`,
      time: o.createdAt.toISOString(),
    })),
    ...recentUsers.map((u) => ({
      id: u.id,
      type: 'SIGNUP',
      title: 'New Customer Signup',
      description: `Customer ${u.name || u.email} registered an account.`,
      time: u.createdAt.toISOString(),
    })),
    ...lowStockForActivity.map((s) => ({
      id: s.id,
      type: 'STOCK',
      title: 'Low Stock Alert',
      description: `Product ${s.product.name} (${s.ml}ml) stock variant has dropped to ${s.stock} units.`,
      time: new Date().toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  const statsWithTodayCounts = {
    ...stats,
    todayOrdersCount,
    pendingOrdersCount,
  };

  return (
    <AdminDashboardClient
      stats={statsWithTodayCounts}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        itemCount: o._count.items,
        customerName: o.user?.name ?? null,
        customerEmail: o.user?.email ?? null,
      }))}
      lowStock={lowStock.map((s) => ({
        id: s.id,
        ml: s.ml,
        stock: s.stock,
        productName: s.product.name,
        productImage: s.product.image,
      }))}
      customerGrowth={customerGrowth}
      activities={activities}
    />
  );
}
