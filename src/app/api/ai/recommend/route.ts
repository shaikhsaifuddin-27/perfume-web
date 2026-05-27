import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const answerSchema = z.object({
  answers: z
    .array(z.string().max(500, 'Answer too long'))
    .min(1, 'At least one answer required')
    .max(10, 'Too many answers'),
});

// Cache product catalog for 5 minutes to avoid a full table scan per request
let productCache: { data: Awaited<ReturnType<typeof fetchProducts>>; expiresAt: number } | null = null;

async function fetchProducts() {
  return prisma.product.findMany({
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      image: true,
      badge: true,
      isNew: true,
      isBestSeller: true,
      category: { select: { name: true } },
      notes: { select: { name: true, type: true } },
      sizes: { select: { ml: true, price: true }, orderBy: { ml: 'asc' } },
    },
  });
}

async function getProducts() {
  const now = Date.now();
  if (productCache && productCache.expiresAt > now) {
    return productCache.data;
  }
  const data = await fetchProducts();
  productCache = { data, expiresAt: now + 5 * 60 * 1000 };
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = answerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { answers } = parsed.data;
    const answerText = answers.join(' ').toLowerCase();

    const products = await getProducts();

    // Score products based on answer keywords
    const scoredProducts = products
      .map((product) => {
        let score = 0;

        const productText = [
          product.name,
          product.tagline,
          product.description,
          product.category?.name ?? '',
          ...product.notes.map((n) => n.name),
        ]
          .join(' ')
          .toLowerCase();

        // Keyword matching
        const keywords = answerText.split(/\s+/).filter((w) => w.length > 3);
        for (const keyword of keywords) {
          if (productText.includes(keyword)) score += 2;
        }

        // Category/mood boosts
        if (answerText.includes('dark') || answerText.includes('night') || answerText.includes('mysterious')) {
          if (product.name.toLowerCase().includes('noir') || product.name.toLowerCase().includes('nuit')) score += 5;
        }
        if (answerText.includes('floral') || answerText.includes('flower') || answerText.includes('romantic')) {
          if (product.category?.name.toLowerCase().includes('floral') || product.name.toLowerCase().includes('jasmine') || product.name.toLowerCase().includes('rose')) score += 5;
        }
        if (answerText.includes('wood') || answerText.includes('oud') || answerText.includes('oriental')) {
          if (product.notes.some((n) => ['oud', 'wood', 'cedar', 'patchouli'].includes(n.name.toLowerCase()))) score += 5;
        }
        if (answerText.includes('fresh') || answerText.includes('light') || answerText.includes('day')) {
          if (product.notes.some((n) => ['bergamot', 'citrus', 'iris'].includes(n.name.toLowerCase()))) score += 3;
        }
        if (answerText.includes('warm') || answerText.includes('cozy') || answerText.includes('amber')) {
          if (product.notes.some((n) => ['amber', 'vanilla', 'sandalwood'].includes(n.name.toLowerCase()))) score += 4;
        }

        if (product.isBestSeller) score += 1;

        return { product, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((p) => p.product);

    // Fallback: return best sellers if no matches
    const results =
      scoredProducts.length > 0
        ? scoredProducts
        : products.filter((p) => p.isBestSeller).slice(0, 3);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('AI recommend error:', error);
    return NextResponse.json({ error: 'Recommendation failed. Please try again.' }, { status: 500 });
  }
}
