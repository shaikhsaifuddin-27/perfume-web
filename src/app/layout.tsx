import type { Metadata } from 'next';
import AuthProvider from '@/components/providers/AuthProvider';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import './globals.css';
import CookieConsent from '@/components/layout/CookieConsent';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://maisonelara.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MAISON ÉLARA | Luxury Perfume & Fine Fragrances',
    template: '%s | MAISON ÉLARA',
  },
  description:
    'Discover the world of MAISON ÉLARA — where art meets scent. Explore our exclusive collection of luxury perfumes crafted for those who dare to be extraordinary.',
  keywords: ['luxury perfume', 'fine fragrance', 'niche perfume', 'oud', 'artisan fragrance', 'maison elara'],
  authors: [{ name: 'Maison Élara' }],
  openGraph: {
    title: 'MAISON ÉLARA | Luxury Perfume',
    description: 'Rare ingredients. Timeless elegance. Experience luxury redefined.',
    type: 'website',
    url: BASE_URL,
    images: [{ url: '/hero_perfume.png', width: 1200, height: 630, alt: 'Maison Élara' }],
    siteName: 'Maison Élara',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MAISON ÉLARA | Luxury Perfume',
    description: 'Rare ingredients. Timeless elegance.',
    images: ['/hero_perfume.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        {/* Font Awesome — self-hosted subset or replace with Lucide React for full tree-shaking */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#0A0A0A" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
