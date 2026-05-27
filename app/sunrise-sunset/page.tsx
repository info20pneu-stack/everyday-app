import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import SunriseSunset from '../components/SunriseSunset';

export const metadata: Metadata = {
  title: 'Sunrise & Sunset Times | EVERY DAY',
  description: 'Today\'s sunrise, sunset, golden hour and civil twilight times for your location. Solar noon, day length and UV index.',
  alternates: { canonical: '/sunrise-sunset' },
  openGraph: {
    title: 'Sunrise & Sunset Times | EVERY DAY',
    description: 'Sunrise, sunset, golden hour and day length for your location.',
    url: 'https://everyday-app.vercel.app/sunrise-sunset',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sunrise & Sunset Times | EVERY DAY',
    description: 'Sunrise, sunset and golden hour times for your location.',
    images: ['/og-image.png'],
  },
};

export default function SunriseSunsetPage() {
  return (
    <PageShell>
      <SunriseSunset />
    </PageShell>
  );
}
