import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import SpeedTest from '../components/SpeedTest';

export const metadata: Metadata = {
  title: 'Internet Speed Test | EVERY DAY',
  description: 'Test your internet connection speed — download, upload and ping. Free online speed test, no plugins required.',
  openGraph: {
    title: 'Internet Speed Test | EVERY DAY',
    description: 'Free online speed test — measure download, upload and ping instantly.',
    url: 'https://everyday-app.vercel.app/speed-test',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Internet Speed Test | EVERY DAY',
    description: 'Free online speed test — download, upload and ping.',
    images: ['/og-image.png'],
  },
};

export default function SpeedTestPage() {
  return (
    <PageShell>
      <SpeedTest />
    </PageShell>
  );
}
