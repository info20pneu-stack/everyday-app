import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import News from '../components/News';

export const metadata: Metadata = {
  title: 'Top News Headlines | EVERY DAY',
  description: 'Today\'s top news headlines in your language — world, business, technology, sports and more.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'Top News Headlines | EVERY DAY',
    description: 'Today\'s top news headlines in your language.',
    url: 'https://www.everyday1234567.com/news',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top News Headlines | EVERY DAY',
    description: 'Today\'s top news headlines in your language.',
    images: ['/og-image.png'],
  },
};

export default function NewsPage() {
  return (
    <PageShell>
      <News />
    </PageShell>
  );
}
