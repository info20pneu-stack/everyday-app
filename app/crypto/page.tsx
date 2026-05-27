import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import Crypto from '../components/Crypto';

export const metadata: Metadata = {
  title: 'Crypto Prices | EVERY DAY',
  description: 'Live cryptocurrency prices and market data. Bitcoin, Ethereum, and top altcoins — prices, 24h change and market cap.',
  alternates: { canonical: '/crypto' },
  openGraph: {
    title: 'Crypto Prices | EVERY DAY',
    description: 'Live crypto prices — Bitcoin, Ethereum and top altcoins with 24h change and market cap.',
  alternates: { canonical: '/crypto' },
    url: 'https://everyday-app.vercel.app/crypto',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Prices | EVERY DAY',
    description: 'Live Bitcoin, Ethereum and top altcoin prices.',
  alternates: { canonical: '/crypto' },
    images: ['/og-image.png'],
  },
};

export default function CryptoPage() {
  return (
    <PageShell>
      <Crypto />
    </PageShell>
  );
}
