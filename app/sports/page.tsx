import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import Sports from '../components/Sports';

export const metadata: Metadata = {
  title: 'Sports Scores & Results | EVERY DAY',
  description: 'Live sports scores, results and standings. NFL, NBA, NHL, MLB, soccer and more — powered by ESPN.',
  openGraph: {
    title: 'Sports Scores & Results | EVERY DAY',
    description: 'Live scores, results and standings for NFL, NBA, NHL, MLB and soccer.',
    url: 'https://everyday-app.vercel.app/sports',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sports Scores & Results | EVERY DAY',
    description: 'Live scores and standings for NFL, NBA, NHL, MLB and soccer.',
    images: ['/og-image.png'],
  },
};

export default function SportsPage() {
  return (
    <PageShell>
      <Sports />
    </PageShell>
  );
}
