import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import HigherLower from '../../components/games/HigherLower';

export const metadata: Metadata = {
  title: 'Higher or Lower | EVERY DAY',
  description: 'A daily quiz: which country has more people, which mountain is higher, which river is longer? 10 pairs a day, the same for everyone.',
  alternates: { canonical: '/games/higher-lower' },
  openGraph: {
    title: 'Higher or Lower | EVERY DAY',
    description: 'Which number is bigger? 10 pairs a day, the same for everyone.',
    url: 'https://www.everyday1234567.com/games/higher-lower',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Higher or Lower | EVERY DAY',
    description: 'Which number is bigger? 10 pairs a day, the same for everyone.',
    images: ['/og-image.png'],
  },
};

export default function HigherLowerPage() {
  return (
    <PageShell>
      <HigherLower />
    </PageShell>
  );
}
