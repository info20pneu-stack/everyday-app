import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import AgeCalculator from '../components/AgeCalculator';

export const metadata: Metadata = {
  title: 'Age Calculator | EVERY DAY',
  description: 'Calculate your exact age in years, months, days, hours and seconds. Find your zodiac sign, day of birth and days until your next birthday.',
  alternates: { canonical: '/age-calculator' },
  openGraph: {
    title: 'Age Calculator | EVERY DAY',
    description: 'Calculate your exact age down to the second. Zodiac sign, birth weekday and birthday countdown.',
  alternates: { canonical: '/age-calculator' },
    url: 'https://everyday-app.vercel.app/age-calculator',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Age Calculator | EVERY DAY',
    description: 'Calculate your exact age down to the second.',
  alternates: { canonical: '/age-calculator' },
    images: ['/og-image.png'],
  },
};

export default function AgeCalculatorPage() {
  return (
    <PageShell>
      <AgeCalculator />
    </PageShell>
  );
}
