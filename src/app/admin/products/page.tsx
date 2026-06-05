import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { deleteProductForm } from './actions';
import ConfirmSubmitButton from './ConfirmSubmitButton';

export const metadata: Metadata = { title: 'Products | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#0A0A0A',
  border: '1px solid #2a2a2a',
  color: '#F5F0E8',
  fontSize: 13,
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const q = sp?.q ?? '';
  const cat = sp?.cat ?? '';

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        ...(cat ? { categoryId: cat } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true, id: true } },
        sizes: { orderBy: { ml: 'asc' } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const totalStock = products.reduce((t, p) => t + p.sizes.reduce((s, sz) => s + sz.stock, 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Products
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: '6px 0 0' }}>
          {products.length} fragrances · {totalStock} units in stock
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Products', value: products.length, accent: '#C084FC' },
          { label: 'Best Sellers', value: products.filter((p) => p.isBestSeller).length, accent: '#C9A84C' },
          { label: 'New Arrivals', value: products.filter((p) => p.isNew).length, accent: '#3399FF' },
          { label: 'Total Stock', value: totalStock, accent: '#33CC66' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: '#0F0F0F', border: `1px solid ${s.accent}22`, borderRadius: 12, padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
            </div>
            <p style={{ fontSize: 30, fontWeight: 700, color: s.accent, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Product Form */}
      <div
        style={{
          background: '#0F0F0F',
          border: '1px solid #1E1E1E',
          borderRadius: 14,
          padding: '28px',
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F5F0E8', margin: '0 0 20px' }}>
          Add New Fragrance
        </h2>
        <form action={createProductAction}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Name *
              </label>
              <input name="name" required style={inputStyle} placeholder="Noir Absolu" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Tagline
              </label>
              <input name="tagline" style={inputStyle} placeholder="The essence of midnight" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Base Price (50ml) *
              </label>
              <input name="price" type="number" required min="1" step="0.01" style={inputStyle} placeholder="245" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Category *
              </label>
              <select name="categoryId" required style={inputStyle}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Product Image *
              </label>
              <input
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                required
                style={{
                  ...inputStyle,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              />
              <p style={{ fontSize: 10, color: '#444', margin: '6px 0 0' }}>
                JPG, PNG, WEBP or GIF. Max 5MB.
              </p>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Badge (optional)
              </label>
              <input name="badge" style={inputStyle} placeholder="Best Seller" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="A deep, complex fragrance with notes of oud, amber, and sandalwood..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" name="isBestSeller" style={{ accentColor: '#C9A84C', width: 14, height: 14 }} />
              Mark as Best Seller
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', cursor: 'pointer' }}>
              <input type="checkbox" name="isNew" style={{ accentColor: '#C9A84C', width: 14, height: 14 }} />
              Mark as New Arrival
            </label>
          </div>
          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 28px',
              background: 'linear-gradient(135deg, #9A7A30, #C9A84C)',
              color: '#050505',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            + Add Fragrance
          </button>
        </form>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <form method="GET" action="/admin/products" style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
          {cat && <input type="hidden" name="cat" value={cat} />}
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#444' }}>🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products…"
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              background: '#0F0F0F',
              border: '1px solid #1E1E1E',
              color: '#F5F0E8',
              fontSize: 13,
              borderRadius: 8,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </form>
        <div style={{ display: 'flex', gap: 4, background: '#0A0A0A', padding: 4, borderRadius: 10, border: '1px solid #1a1a1a', flexWrap: 'wrap' }}>
          <a
            href={`/admin/products${q ? `?q=${q}` : ''}`}
            style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: !cat ? 700 : 400,
              textDecoration: 'none',
              background: !cat ? '#C9A84C' : 'transparent',
              color: !cat ? '#050505' : '#555',
              transition: 'all 0.2s',
            }}
          >
            All
          </a>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`/admin/products?cat=${c.id}${q ? `&q=${q}` : ''}`}
              style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: cat === c.id ? 700 : 400,
                textDecoration: 'none',
                background: cat === c.id ? '#C9A84C' : 'transparent',
                color: cat === c.id ? '#050505' : '#555',
                transition: 'all 0.2s',
              }}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {products.map((product) => {
          const stockTotal = product.sizes.reduce((t, s) => t + s.stock, 0);
          const stockStatus = stockTotal === 0 ? 'OOS' : stockTotal < 20 ? 'LOW' : 'OK';
          const stockColor = stockStatus === 'OOS' ? '#FF3333' : stockStatus === 'LOW' ? '#FF9900' : '#33CC66';

          return (
            <div
              key={product.id}
              style={{
                background: '#0F0F0F',
                border: '1px solid #1E1E1E',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: 180, background: '#141414', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                />
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                  {product.isBestSeller && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#C9A84C', color: '#050505', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.1em' }}>
                      BEST SELLER
                    </span>
                  )}
                  {product.isNew && (
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#3399FF', color: '#fff', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.1em' }}>
                      NEW
                    </span>
                  )}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    fontSize: 9,
                    fontWeight: 700,
                    background: `${stockColor}22`,
                    color: stockColor,
                    padding: '3px 8px',
                    borderRadius: 20,
                    letterSpacing: '0.1em',
                    border: `1px solid ${stockColor}33`,
                  }}
                >
                  {stockStatus === 'OOS' ? 'OUT OF STOCK' : stockStatus === 'LOW' ? `LOW: ${stockTotal}` : `${stockTotal} units`}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0, fontFamily: 'Cormorant Garamond, serif' }}>
                    {product.name}
                  </p>
                  <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>{product.tagline}</p>
                  <p style={{ fontSize: 11, color: '#444', margin: '3px 0 0', letterSpacing: '0.06em' }}>
                    {product.category?.name} · ⭐ {product._count.reviews} reviews
                  </p>
                </div>

                {/* Sizes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {product.sizes.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        background: '#141414',
                        border: '1px solid #2a2a2a',
                        borderRadius: 6,
                        color: '#888',
                      }}
                    >
                      {s.ml}ml — <span style={{ color: '#C9A84C' }}>${s.price}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <a
                    href={`/admin/products/${product.id}/edit`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px 0',
                      border: '1px solid #2a2a2a',
                      color: '#888',
                      textDecoration: 'none',
                      fontSize: 12,
                      borderRadius: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    ✏️ Edit
                  </a>
                  <a
                    href={`/product/${product.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #1E1E1E',
                      color: '#444',
                      textDecoration: 'none',
                      fontSize: 12,
                      borderRadius: 6,
                    }}
                  >
                    👁
                  </a>
                  <form action={deleteProductForm.bind(null, product.id)}>
                    <ConfirmSubmitButton
                      message={`Delete "${product.name}"?`}
                      title="Delete product"
                      style={{
                        padding: '8px 14px',
                        background: 'none',
                        border: '1px solid #FF333333',
                        color: '#FF3333',
                        fontSize: 12,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      🗑
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14 }}>
          <p style={{ fontSize: 36 }}>🧴</p>
          <p style={{ fontSize: 15, color: '#444', margin: '8px 0 0' }}>No products match your search</p>
        </div>
      )}
    </div>
  );
}

async function createProductAction(formData: FormData) {
  'use server';
  const { createProduct } = await import('./actions');
  await createProduct(formData);
}
