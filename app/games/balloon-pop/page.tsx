import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import BalloonPop from '../../components/games/BalloonPop';

export const metadata: Metadata = {
  title: 'Balloon Pop | EVERY DAY',
  description: 'Pop balloons as fast as you can and leave the cacti alone. Four modes: Time, Survival, Memory and 2 players on one phone. Track your reaction time.',
  alternates: { canonical: '/games/balloon-pop' },
  openGraph: {
    title: 'Balloon Pop | EVERY DAY',
    description: 'Pop balloons, avoid cacti. Time, Survival, Memory and 2 players on one phone.',
    url: 'https://www.everyday1234567.com/games/balloon-pop',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balloon Pop | EVERY DAY',
    description: 'Pop balloons, avoid cacti. Time, Survival, Memory and 2 players on one phone.',
    images: ['/og-image.png'],
  },
};

export default function BalloonPopPage() {
  return (
    <PageShell>
      <BalloonPop />
    </PageShell>
  );
}
