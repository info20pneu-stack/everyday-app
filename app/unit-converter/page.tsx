import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import UnitConverter from '../components/UnitConverter';

export const metadata: Metadata = {
  title: 'Unit Converter | EVERY DAY',
  description: 'Convert length, weight, temperature, volume, speed and area units instantly. Metric and imperial. Supports 50+ units.',
  alternates: { canonical: '/unit-converter' },
  openGraph: {
    title: 'Unit Converter | EVERY DAY',
    description: 'Instant unit conversion — length, weight, temperature, volume, speed and area. 50+ units.',
  alternates: { canonical: '/unit-converter' },
    url: 'https://everyday-app.vercel.app/unit-converter',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unit Converter | EVERY DAY',
    description: 'Instant unit conversion — 50+ units across 6 categories.',
  alternates: { canonical: '/unit-converter' },
    images: ['/og-image.png'],
  },
};

export default function UnitConverterPage() {
  return (
    <PageShell>
      <UnitConverter />
    </PageShell>
  );
}
