import type { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = { title: 'Analytics | Maison Élara Admin' };
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
