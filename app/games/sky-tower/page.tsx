import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import SkyTower from '../../components/games/SkyTower';

export const metadata: Metadata = {
  title: 'Sky Tower | EVERY DAY',
  description: 'Drop blocks and build a tower up to the stars. Perfect drops build combos — how high can you go?',
  alternates: { canonical: '/games/sky-tower' },
  openGraph: {
    title: 'Sky Tower | EVERY DAY',
    description: 'Drop blocks and build a tower up to the stars.',
    url: 'https://www.everyday1234567.com/games/sky-tower',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sky Tower | EVERY DAY',
    description: 'Drop blocks and build a tower up to the stars.',
    images: ['/og-image.png'],
  },
};

export default function SkyTowerPage() {
  return (
    <PageShell>
      <SkyTower />
    </PageShell>
  );
}
