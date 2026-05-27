import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import BMI from '../components/BMI';

export const metadata: Metadata = {
  title: 'BMI Calculator | EVERY DAY',
  description: 'Calculate your Body Mass Index (BMI). Get your category, ideal weight range and personalised health recommendations. Metric and imperial.',
  alternates: { canonical: '/bmi' },
  openGraph: {
    title: 'BMI Calculator | EVERY DAY',
    description: 'Calculate BMI, find your ideal weight range and get personalised health tips.',
  alternates: { canonical: '/bmi' },
    url: 'https://everyday-app.vercel.app/bmi',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMI Calculator | EVERY DAY',
    description: 'Calculate BMI and get personalised health recommendations.',
  alternates: { canonical: '/bmi' },
    images: ['/og-image.png'],
  },
};

export default function BMIPage() {
  return (
    <PageShell>
      <BMI />
    </PageShell>
  );
}
