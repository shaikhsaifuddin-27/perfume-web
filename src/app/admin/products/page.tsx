import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { deleteProductForm } from './actions';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Products | Admin' };

export const revalidate = 0; // always fresh for admin

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        sizes: { orderBy: { ml: 'asc' } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif, Cormorant Garamond)', fontSize: 32, fontWeight: 300, color: '#F5F0E8' }}>
            Products
          </h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>{products.length} fragrances</p>
        </div>
      </div>

      {/* Add Product Form */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 12, padding: 28, marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 20, color: '#F5F0E8' }}>Add New Product</h2>
        <form action={createProductAction}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Name *
              </label>
              <input name="name" required style={inputStyle} placeholder="Noir Absolu" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Tagline
              </label>
              <input name="tagline" style={inputStyle} placeholder="The essence of midnight" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Base Price (USD, 50ml) *
              </label>
              <input name="price" type="number" required min="1" step="0.01" style={inputStyle} placeholder="245" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Image Path
              </label>
              <input name="image" style={inputStyle} placeholder="/product_noir.png" defaultValue="/product_noir.png" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Badge (optional)
              </label>
              <input name="badge" style={inputStyle} placeholder="Best Seller" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Description *
            </label>
            <textarea name="description" required rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="A deep, complex fragrance..." />
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
              <input type="checkbox" name="isBestSeller" style={{ accentColor: '#C9A84C' }} />
              Best Seller
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
              <input type="checkbox" name="isNew" style={{ accentColor: '#C9A84C' }} />
              Mark as New
            </label>
          </div>
          <button type="submit" style={btnStyle}>
            <i className="fa-solid fa-plus"></i> Add Product
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0A0A0A' }}>
              {['Product', 'Category', 'Sizes & Prices', 'Stock', 'Reviews', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '14px 16px', fontSize: 11, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={product.image} alt={product.name} style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                  <div>
                    <p style={{ fontSize: 14, color: '#F5F0E8', fontWeight: 500 }}>{product.name}</p>
                    <p style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{product.tagline}</p>
                    {product.badge && (
                      <span style={{ fontSize: 9, padding: '2px 8px', background: '#C9A84C22', color: '#C9A84C', borderRadius: 10, letterSpacing: '0.1em' }}>
                        {product.badge}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px', fontSize: 13, color: '#888' }}>{product.category?.name ?? '—'}</td>
                <td style={{ padding: '16px' }}>
                  {product.sizes.map((s) => (
                    <div key={s.id} style={{ fontSize: 12, color: '#aaa', marginBottom: 2 }}>
                      {s.ml}ml — <span style={{ color: '#C9A84C' }}>${s.price}</span>
                      <span style={{ color: s.stock > 0 ? '#6BCB77' : '#D94F4F', marginLeft: 8, fontSize: 10 }}>
                        {s.stock > 0 ? `${s.stock} in stock` : 'OOS'}
                      </span>
                    </div>
                  ))}
                </td>
                <td style={{ padding: '16px', fontSize: 13, color: '#888' }}>
                  {product.sizes.reduce((t, s) => t + s.stock, 0)} total
                </td>
                <td style={{ padding: '16px', fontSize: 13, color: '#888' }}>{product._count.reviews}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      style={{ background: 'none', border: '1px solid #333', color: '#aaa', padding: '6px 10px', fontSize: 12, borderRadius: 4, textDecoration: 'none', cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </Link>
                    <form action={deleteProductForm.bind(null, product.id)}>
                      <button
                        type="submit"
                        style={{ background: 'none', border: '1px solid #D94F4F33', color: '#D94F4F', padding: '6px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer' }}
                        onClick={(e) => { if (!confirm(`Delete "${product.name}"?`)) e.preventDefault(); }}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p style={{ textAlign: 'center', padding: '48px 0', color: '#555', fontSize: 14 }}>No products found. Add your first product above.</p>
        )}
      </div>
    </div>
  );
}

// Bound server action wrapper for form submission
async function createProductAction(formData: FormData) {
  'use server';
  const { createProduct } = await import('./actions');
  await createProduct(formData);
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#0A0A0A',
  border: '1px solid #333',
  color: '#F5F0E8',
  fontSize: 13,
  borderRadius: 6,
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #9A7A30, #C9A84C, #9A7A30)',
  color: '#050505',
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  borderRadius: 4,
};
