import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import Currency from '../components/Currency';

export const metadata: Metadata = {
  title: 'Currency Exchange Rates | EVERY DAY',
  description: 'Live currency exchange rates and converter. Convert USD, EUR, GBP, JPY, CZK and 20+ currencies instantly.',
  openGraph: {
    title: 'Currency Exchange Rates | EVERY DAY',
    description: 'Live currency exchange rates — convert USD, EUR, GBP and 20+ world currencies.',
    url: 'https://everyday-app.vercel.app/currency',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Currency Exchange Rates | EVERY DAY',
    description: 'Live currency exchange rates — convert 20+ world currencies.',
    images: ['/og-image.png'],
  },
};

export default function CurrencyPage() {
  return (
    <PageShell>
      <Currency />
    </PageShell>
  );
}
