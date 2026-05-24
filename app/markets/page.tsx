import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import Markets from '../components/Markets';

export const metadata: Metadata = {
  title: 'Markets & Trending | EVERY DAY',
  description: 'Top stocks, market movers, AI leaderboard and music charts — all trending rankings updated daily.',
  openGraph: {
    title: 'Markets & Trending | EVERY DAY',
    description: 'Top stocks, market movers, AI leaderboard and Billboard charts — updated daily.',
    url: 'https://everyday-app.vercel.app/markets',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Markets & Trending | EVERY DAY',
    description: 'Stocks, AI rankings, music charts and more — updated daily.',
    images: ['/og-image.png'],
  },
};

export default function MarketsPage() {
  return (
    <PageShell>
      <Markets />
    </PageShell>
  );
}
