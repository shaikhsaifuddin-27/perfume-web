import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { updateProduct } from './actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit ${product.name} | Admin` : 'Edit Product | Admin' };
}

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

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { category: true, sizes: { orderBy: { ml: 'asc' } } },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!product) notFound();

  const updateAction = updateProduct.bind(null, id);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <a
            href="/admin/products"
            style={{ fontSize: 12, color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Products
          </a>
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Edit: {product.name}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Main Form */}
        <form action={updateAction} encType="multipart/form-data">
          <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: 28, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: '0 0 20px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Product Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Name *</label>
                <input name="name" required defaultValue={product.name} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tagline</label>
                <input name="tagline" defaultValue={product.tagline ?? ''} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Category *</label>
                <select name="categoryId" required defaultValue={product.categoryId} style={inputStyle}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Badge</label>
                <input name="badge" defaultValue={product.badge ?? ''} style={inputStyle} placeholder="e.g. Best Seller" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Product Image</label>
                <input name="currentImage" type="hidden" value={product.image} />
                <input
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{
                    ...inputStyle,
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                />
                <p style={{ fontSize: 10, color: '#444', margin: '6px 0 0' }}>
                  Leave empty to keep the current image.
                </p>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Description *</label>
              <textarea
                name="description"
                required
                rows={5}
                defaultValue={product.description}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', cursor: 'pointer' }}>
                <input type="checkbox" name="isBestSeller" defaultChecked={product.isBestSeller} style={{ accentColor: '#C9A84C' }} />
                Best Seller
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', cursor: 'pointer' }}>
                <input type="checkbox" name="isNew" defaultChecked={product.isNew} style={{ accentColor: '#C9A84C' }} />
                New Arrival
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                style={{
                  padding: '11px 28px',
                  background: 'linear-gradient(135deg, #9A7A30, #C9A84C)',
                  color: '#050505',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                💾 Save Changes
              </button>
              <a
                href="/admin/products"
                style={{
                  padding: '11px 20px',
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  color: '#555',
                  fontSize: 12,
                  borderRadius: 8,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Cancel
              </a>
            </div>
          </div>
        </form>

        {/* Preview + Sizes sidebar */}
        <div>
          {/* Preview */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <img src={product.image} alt={product.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0, fontFamily: 'Cormorant Garamond, serif' }}>
                {product.name}
              </p>
              <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>{product.tagline}</p>
            </div>
          </div>

          {/* Sizes (read-only, go to inventory to adjust) */}
          <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Sizes & Stock</h2>
              <a href="/admin/inventory" style={{ fontSize: 11, color: '#C9A84C', textDecoration: 'none' }}>
                Manage →
              </a>
            </div>
            {product.sizes.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #141414',
                }}
              >
                <span style={{ fontSize: 13, color: '#888' }}>{s.ml}ml</span>
                <span style={{ fontSize: 13, color: '#C9A84C', fontWeight: 600 }}>${s.price}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: s.stock === 0 ? '#FF3333' : s.stock < 10 ? '#FF9900' : '#33CC66',
                  }}
                >
                  {s.stock} units
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
