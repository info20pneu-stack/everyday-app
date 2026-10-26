import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import GamesHub from '../components/games/GamesHub';

export const metadata: Metadata = {
  title: 'Games | EVERY DAY',
  description: 'Quick breaks, mini games, quizzes and curiosities — pick a game by mood or by how much time you have.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'Games | EVERY DAY',
    description: 'Mini games, quizzes and relaxing breaks — 2, 5 or 10+ minutes.',
    url: 'https://www.everyday1234567.com/games',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Games | EVERY DAY',
    description: 'Mini games, quizzes and relaxing breaks — 2, 5 or 10+ minutes.',
    images: ['/og-image.png'],
  },
};

export default function GamesPage() {
  return (
    <PageShell maxWidth={1040}>
      <GamesHub />
    </PageShell>
  );
}
