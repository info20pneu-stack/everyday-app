import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import Shells from '../../components/games/Shells';

export const metadata: Metadata = {
  title: 'Shells – find the ball | EVERY DAY',
  description: 'The classic shell game with porcelain cups: follow the ball through faster and faster shuffles. Streak multiplier, hints and a daily challenge that is the same for everyone.',
  alternates: { canonical: '/games/shells' },
  openGraph: {
    title: 'Shells – find the ball | EVERY DAY',
    description: 'Follow the ball under the porcelain cups. Daily challenge, the same for everyone.',
    url: 'https://www.everyday1234567.com/games/shells',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shells – find the ball | EVERY DAY',
    description: 'Follow the ball under the porcelain cups. Daily challenge, the same for everyone.',
    images: ['/og-image.png'],
  },
};

export default function ShellsPage() {
  return (
    <PageShell>
      <Shells />
    </PageShell>
  );
}
