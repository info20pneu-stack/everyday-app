import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import DailyPuzzle from '../../components/DailyPuzzle';

export const metadata: Metadata = {
  title: 'Daily Puzzle | EVERY DAY',
  description: 'Guess the word of the day in 6 tries. One puzzle a day, the same for everyone — keep your streak going.',
  alternates: { canonical: '/games/daily-puzzle' },
  openGraph: {
    title: 'Daily Puzzle | EVERY DAY',
    description: 'Guess the word of the day in 6 tries. The same puzzle for everyone.',
    url: 'https://www.everyday1234567.com/games/daily-puzzle',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
};

export default function DailyPuzzlePage() {
  return (
    <PageShell>
      <DailyPuzzle />
    </PageShell>
  );
}
