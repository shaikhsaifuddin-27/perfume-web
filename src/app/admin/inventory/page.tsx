import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { adjustStock } from './actions';

export const metadata: Metadata = { title: 'Inventory | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      sizes: { orderBy: { ml: 'asc' } },
      category: { select: { name: true } },
    },
  });

  const totalStock = products.reduce(
    (total, p) => total + p.sizes.reduce((t, s) => t + s.stock, 0),
    0
  );
  const totalValue = products.reduce(
    (total, p) => total + p.sizes.reduce((t, s) => t + s.stock * s.price, 0),
    0
  );
  const lowStockCount = products.reduce(
    (count, p) => count + p.sizes.filter((s) => s.stock < 10).length,
    0
  );
  const outOfStockCount = products.reduce(
    (count, p) => count + p.sizes.filter((s) => s.stock === 0).length,
    0
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Inventory
        </h1>
        <p style={{ color: '#444', fontSize: 13, margin: '6px 0 0' }}>
          Manage stock levels across all product sizes
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Units', value: totalStock.toLocaleString(), icon: '📦', accent: '#C9A84C' },
          { label: 'Inventory Value', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '💎', accent: '#3399FF' },
          { label: 'Low Stock SKUs', value: lowStockCount, icon: '⚠️', accent: '#FF9900' },
          { label: 'Out of Stock', value: outOfStockCount, icon: '🚫', accent: '#FF3333' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#0F0F0F',
              border: `1px solid ${s.accent}22`,
              borderRadius: 12,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: 30, fontWeight: 700, color: s.accent, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Stock Levels</h2>
          <p style={{ fontSize: 11, color: '#444', margin: '4px 0 0' }}>Adjust stock inline — changes save immediately</p>
        </div>

        {products.map((product) => (
          <div key={product.id} style={{ borderBottom: '1px solid #141414' }}>
            {/* Product row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 24px',
                background: '#0A0A0A',
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #1E1E1E', flexShrink: 0 }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>{product.name}</p>
                <p style={{ fontSize: 11, color: '#555', margin: '3px 0 0', letterSpacing: '0.06em' }}>
                  {product.category?.name} · {product.sizes.length} size{product.sizes.length !== 1 ? 's' : ''} ·{' '}
                  <span style={{ color: '#C9A84C' }}>
                    {product.sizes.reduce((t, s) => t + s.stock, 0)} units total
                  </span>
                </p>
              </div>
            </div>

            {/* Sizes */}
            {product.sizes.map((size) => {
              const stockStatus =
                size.stock === 0 ? 'OOS' : size.stock < 10 ? 'LOW' : 'OK';
              const statusColor =
                stockStatus === 'OOS' ? '#FF3333' : stockStatus === 'LOW' ? '#FF9900' : '#33CC66';

              return (
                <div
                  key={size.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 24px 12px 80px',
                    borderTop: '1px solid #141414',
                    gap: 16,
                    background: stockStatus !== 'OK' ? `${statusColor}06` : 'transparent',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#888', minWidth: 60 }}>{size.ml}ml</span>
                  <span style={{ fontSize: 13, color: '#C9A84C', minWidth: 70 }}>${size.price}</span>
                  <div
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      background: `${statusColor}20`,
                      color: statusColor,
                      minWidth: 40,
                      textAlign: 'center',
                    }}
                  >
                    {stockStatus}
                  </div>

                  {/* Stock adjustment form */}
                  <form action={adjustStock} style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    <input type="hidden" name="sizeId" value={size.id} />
                    <label style={{ fontSize: 11, color: '#444', letterSpacing: '0.08em' }}>STOCK:</label>
                    <input
                      type="number"
                      name="stock"
                      defaultValue={size.stock}
                      min={0}
                      step={1}
                      style={{
                        width: 80,
                        padding: '6px 10px',
                        background: '#141414',
                        border: `1px solid ${stockStatus !== 'OK' ? statusColor + '44' : '#2a2a2a'}`,
                        color: '#F5F0E8',
                        fontSize: 13,
                        borderRadius: 6,
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, #9A7A30, #C9A84C)',
                        color: '#050505',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                      }}
                    >
                      UPDATE
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        ))}

        {products.length === 0 && (
          <p style={{ textAlign: 'center', padding: '64px 0', color: '#444', fontSize: 14 }}>
            No products found. Add products first.
          </p>
        )}
      </div>
    </div>
  );
}
