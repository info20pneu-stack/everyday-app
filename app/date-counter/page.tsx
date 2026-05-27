import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import DateCounter from '../components/DateCounter';

export const metadata: Metadata = {
  title: 'Date Counter & Countdown | EVERY DAY',
  description: 'Count days between two dates, create event countdowns and calculate precise time differences in days, weeks and months.',
  alternates: { canonical: '/date-counter' },
  openGraph: {
    title: 'Date Counter & Countdown | EVERY DAY',
    description: 'Days between dates, event countdowns and time difference calculator.',
    url: 'https://everyday-app.vercel.app/date-counter',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Date Counter & Countdown | EVERY DAY',
    description: 'Days between dates and event countdown calculator.',
    images: ['/og-image.png'],
  },
};

export default function DateCounterPage() {
  return (
    <PageShell>
      <DateCounter />
    </PageShell>
  );
}
