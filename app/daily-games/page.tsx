import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import DailyGames from '../components/DailyGames';

export const metadata: Metadata = {
  title: 'Daily Games | EVERY DAY',
  description: 'Play today\'s Wordle, Connections, Mini Crossword, Quordle and more daily brain games — all in one place.',
  alternates: { canonical: '/daily-games' },
  openGraph: {
    title: 'Daily Games | EVERY DAY',
    description: 'Wordle, Connections, Mini Crossword, Quordle and more — today\'s daily games in one place.',
  alternates: { canonical: '/daily-games' },
    url: 'https://everyday-app.vercel.app/daily-games',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Games | EVERY DAY',
    description: 'Wordle, Connections and more — all daily games in one place.',
  alternates: { canonical: '/daily-games' },
    images: ['/og-image.png'],
  },
};

export default function DailyGamesPage() {
  return (
    <PageShell>
      <DailyGames />
    </PageShell>
  );
}
