import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import DailyBlocks from '../../components/games/DailyBlocks';

export const metadata: Metadata = {
  title: 'Daily Blocks | EVERY DAY',
  description: 'Falling blocks with the same piece order for everyone today. Clear lines, level up and top the daily leaderboard.',
  alternates: { canonical: '/games/daily-blocks' },
  openGraph: {
    title: 'Daily Blocks | EVERY DAY',
    description: 'Falling blocks — the same pieces for everyone today.',
    url: 'https://www.everyday1234567.com/games/daily-blocks',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Blocks | EVERY DAY',
    description: 'Falling blocks — the same pieces for everyone today.',
    images: ['/og-image.png'],
  },
};

export default function DailyBlocksPage() {
  return (
    <PageShell>
      <DailyBlocks />
    </PageShell>
  );
}
