import { Metadata } from 'next';
import SuggestClient from './SuggestClient';

export const metadata: Metadata = {
  title: 'Suggest & Vote | EVERY DAY',
  description: 'Suggest a new feature or vote for existing ideas. Help us improve EVERY DAY.',
  alternates: { canonical: '/suggest' },
  openGraph: {
    title: 'Suggest & Vote | EVERY DAY',
    description: 'Suggest a new feature or vote for existing ideas. Help us improve EVERY DAY.',
    url: 'https://everyday-app.vercel.app/suggest',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suggest & Vote | EVERY DAY',
    description: 'Suggest a new feature or vote for existing ideas.',
    images: ['/og-image.png'],
  },
};

export default function SuggestPage() {
  return <SuggestClient />;
}
