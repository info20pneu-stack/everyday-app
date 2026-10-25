import type { Metadata } from 'next';
import { CURRENCY_COUNT } from '../../lib/currencies';
import PageShell from '../components/PageShell';
import Currency from '../components/Currency';

export const metadata: Metadata = {
  title: 'Currency Exchange Rates | EVERY DAY',
  description: `Live currency exchange rates and converter. Convert USD, EUR, GBP, JPY, CZK and ${CURRENCY_COUNT - 5} more currencies instantly.`,
  alternates: { canonical: '/currency' },
  openGraph: {
    title: 'Currency Exchange Rates | EVERY DAY',
    description: `Live currency exchange rates — convert USD, EUR, GBP and ${CURRENCY_COUNT - 3} more world currencies.`,
    url: 'https://www.everyday1234567.com/currency',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Currency Exchange Rates | EVERY DAY',
    description: `Live currency exchange rates — convert ${CURRENCY_COUNT} world currencies.`,
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
