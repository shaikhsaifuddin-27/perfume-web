import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: '#F5F0E8', margin: 0 }}>
          Store Settings
        </h1>
        <p style={{ color: '#444', fontSize: 13, marginTop: 4, margin: 0 }}>
          Manage global store properties, gateway API integrations, and currency parameters
        </p>
      </div>

      {/* Form sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Main Settings */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>General Properties</h3>
          {[
            { label: 'Store Name', val: 'Maison Élara' },
            { label: 'Support Email', val: 'concierge@maisonelara.com' },
            { label: 'Default Currency', val: 'USD ($)' },
            { label: 'Warehouse Address', val: '7 Route de la Marigarde, 06130 Grasse, France' },
          ].map((field) => (
            <div key={field.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', fontWeight: 600 }}>{field.label}</label>
              <input type="text" defaultValue={field.val} disabled style={{ background: '#141414', border: '1px solid #1E1E1E', color: '#ccc', padding: '10px 14px', borderRadius: 8, fontSize: 12 }} />
            </div>
          ))}
          <button style={{ alignSelf: 'flex-start', background: '#C9A84C', border: 'none', color: '#050505', padding: '10px 20px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'not-allowed' }}>
            Save Settings
          </button>
        </div>

        {/* Integration Details */}
        <div style={{ background: '#0F0F0F', border: '1px solid #1E1E1E', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#F5F0E8', margin: 0 }}>Integrations</h3>
          {[
            { name: 'Stripe Gateway', status: 'Connected', desc: 'Accepting card payments.' },
            { name: 'Razorpay Gateway', status: 'Connected', desc: 'Accepting UPI/net banking.' },
            { name: 'PostgreSQL Database', status: 'Connected', desc: 'Prisma client connection active.' },
            { name: 'SMTP Email Sender', status: 'Inactive', desc: 'Not configured.' },
          ].map((int) => (
            <div key={int.name} style={{ padding: 12, background: 'rgba(255,255,255,0.01)', border: '1px solid #1A1A1A', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>{int.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: int.status === 'Connected' ? '#33CC6622' : '#FF333322', color: int.status === 'Connected' ? '#33CC66' : '#FF3333' }}>
                  {int.status}
                </span>
              </div>
              <p style={{ fontSize: 10, color: '#444', margin: '4px 0 0' }}>{int.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
