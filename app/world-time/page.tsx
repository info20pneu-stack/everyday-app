import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import WorldTime from '../components/WorldTime';

export const metadata: Metadata = {
  title: 'World Time Clocks | EVERY DAY',
  description: 'Check the current local time in cities around the world. Live world clocks with timezone and UTC offset for 40+ cities.',
  openGraph: {
    title: 'World Time Clocks | EVERY DAY',
    description: 'Live world clocks — current time in New York, London, Tokyo, Dubai and 40+ cities worldwide.',
    url: 'https://everyday-app.vercel.app/world-time',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Time Clocks | EVERY DAY',
    description: 'Live world clocks — current time in 40+ cities worldwide.',
    images: ['/og-image.png'],
  },
};

export default function WorldTimePage() {
  return (
    <PageShell>
      <WorldTime />
    </PageShell>
  );
}
