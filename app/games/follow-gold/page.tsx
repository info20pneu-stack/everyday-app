import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import FollowGold from '../../components/games/FollowGold';

export const metadata: Metadata = {
  title: 'Follow the Gold | EVERY DAY',
  description: 'Keep your eye on the gold ball while the balls shuffle along arcs and whole rings spin. Every round gets faster — how far can you go?',
  alternates: { canonical: '/games/follow-gold' },
  openGraph: {
    title: 'Follow the Gold | EVERY DAY',
    description: 'Keep your eye on the gold ball while the balls shuffle. How far can you go?',
    url: 'https://www.everyday1234567.com/games/follow-gold',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Follow the Gold | EVERY DAY',
    description: 'Keep your eye on the gold ball while the balls shuffle. How far can you go?',
    images: ['/og-image.png'],
  },
};

export default function FollowGoldPage() {
  return (
    <PageShell>
      <FollowGold />
    </PageShell>
  );
}
