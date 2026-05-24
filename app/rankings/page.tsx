import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import Rankings from '../components/Rankings';

export const metadata: Metadata = {
  title: 'Charts & Rankings | EVERY DAY',
  description: 'Daily updated rankings — AI model leaderboard, top stocks, music Billboard charts and trending tech. All in one place.',
  openGraph: {
    title: 'Charts & Rankings | EVERY DAY',
    description: 'AI models, top stocks, Billboard music and trending tech — all rankings updated daily.',
    url: 'https://everyday-app.vercel.app/rankings',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Charts & Rankings | EVERY DAY',
    description: 'AI, stocks, music and tech rankings — updated daily.',
    images: ['/og-image.png'],
  },
};

export default function RankingsPage() {
  return (
    <PageShell>
      <Rankings />
    </PageShell>
  );
}
