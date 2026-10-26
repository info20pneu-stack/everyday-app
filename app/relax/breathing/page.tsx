import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import BoxBreathing from '../../components/relax/BoxBreathing';

export const metadata: Metadata = {
  title: 'Box Breathing | EVERY DAY',
  description: 'Calm down with guided box breathing: inhale, hold, exhale, hold. Pick a landscape, set 1, 3 or 5 minutes and breathe along with the square.',
  alternates: { canonical: '/relax/breathing' },
  openGraph: {
    title: 'Box Breathing | EVERY DAY',
    description: 'Guided box breathing with calming landscapes.',
    url: 'https://www.everyday1234567.com/relax/breathing',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Box Breathing | EVERY DAY',
    description: 'Guided box breathing with calming landscapes.',
    images: ['/og-image.png'],
  },
};

export default function BreathingPage() {
  return (
    <PageShell>
      <BoxBreathing />
    </PageShell>
  );
}
