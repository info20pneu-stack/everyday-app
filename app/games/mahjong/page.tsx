import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import Mahjong from '../../components/games/Mahjong';

export const metadata: Metadata = {
  title: 'Mahjong Solitaire | EVERY DAY',
  description: 'Free mahjong solitaire: match free porcelain tiles, clear 20 levels in four chapters with 1–3 stars, and play the daily challenge — the same table for everyone.',
  alternates: { canonical: '/games/mahjong' },
  openGraph: {
    title: 'Mahjong Solitaire | EVERY DAY',
    description: 'Match free tiles and clear the table. 20 levels and a daily challenge.',
    url: 'https://www.everyday1234567.com/games/mahjong',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mahjong Solitaire | EVERY DAY',
    description: 'Match free tiles and clear the table. 20 levels and a daily challenge.',
    images: ['/og-image.png'],
  },
};

export default function MahjongPage() {
  return (
    <PageShell>
      <Mahjong />
    </PageShell>
  );
}
