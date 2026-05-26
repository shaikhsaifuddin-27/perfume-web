import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const idsParam = searchParams.get('ids');
    const category = searchParams.get('category');
    const isBestSeller = searchParams.get('bestSeller') === 'true';
    const isNew = searchParams.get('isNew') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    // Handle fetch-by-IDs (for wishlist page)
    if (idsParam) {
      const ids = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100); // cap at 100 IDs

      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: {
          category: { select: { name: true, id: true } },
          sizes: { orderBy: { ml: 'asc' } },
          _count: { select: { reviews: true } },
        },
      });

      return NextResponse.json(products);
    }

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { some: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (category) where.category = { name: { equals: category, mode: 'insensitive' } };
    if (isBestSeller) where.isBestSeller = true;
    if (isNew) where.isNew = true;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true, id: true } },
          sizes: { orderBy: { ml: 'asc' } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
