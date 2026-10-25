import type { Metadata } from 'next';
import { headers } from 'next/headers';
import PageShell from '../../components/PageShell';
import ConnectFour from '../../components/games/ConnectFour';
import { regionFromCountry } from '../../../lib/games/connectSets';

export const metadata: Metadata = {
  title: 'Connect Four Words | EVERY DAY',
  description: 'A daily word puzzle: find four groups of four words that belong together. One set a day for your region, timed to the ten-thousandth of a second.',
  alternates: { canonical: '/games/connect-four' },
  openGraph: {
    title: 'Connect Four Words | EVERY DAY',
    description: 'Find four groups of four words. A new set every day.',
    url: 'https://www.everyday1234567.com/games/connect-four',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connect Four Words | EVERY DAY',
    description: 'Find four groups of four words. A new set every day.',
    images: ['/og-image.png'],
  },
};

export default async function ConnectFourPage() {
  // Vercel geolocation picks the word set (see regionFromCountry; Switzerland also looks at the
  // browser language). Locally the header is missing, so the game falls back to the UI language.
  // A region the player picked always wins.
  const h = await headers();
  const country = h.get('x-vercel-ip-country');
  const geoRegion = regionFromCountry(country, h.get('accept-language'));
  return (
    <PageShell>
      <ConnectFour geoRegion={geoRegion} country={country} />
    </PageShell>
  );
}
