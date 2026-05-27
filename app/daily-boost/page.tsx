import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import DailyBoost from '../components/DailyBoost';

export const metadata: Metadata = {
  title: 'Daily Boost | EVERY DAY',
  description: 'Start your day right — daily motivational quote, word of the day, fun fact and a fresh daily challenge.',
  alternates: { canonical: '/daily-boost' },
  openGraph: {
    title: 'Daily Boost | EVERY DAY',
    description: 'Daily motivation, word of the day, fun fact and a fresh daily challenge.',
  alternates: { canonical: '/daily-boost' },
    url: 'https://everyday-app.vercel.app/daily-boost',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Boost | EVERY DAY',
    description: 'Daily motivation, word of the day and fun fact.',
  alternates: { canonical: '/daily-boost' },
    images: ['/og-image.png'],
  },
};

export default function DailyBoostPage() {
  return (
    <PageShell>
      <DailyBoost />
    </PageShell>
  );
}
