import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import CelebrityBirthdays from '../components/CelebrityBirthdays';

export const metadata: Metadata = {
  title: 'Celebrity Birthdays Today | EVERY DAY',
  description: 'See which celebrities are celebrating their birthday today.',
  alternates: { canonical: '/celebrity-birthdays' },
  openGraph: {
    title: 'Celebrity Birthdays Today | EVERY DAY',
    description: 'See which celebrities are celebrating their birthday today.',
    url: 'https://www.everyday1234567.com/celebrity-birthdays',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
};

export default function CelebrityBirthdaysPage() {
  return (
    <PageShell>
      <CelebrityBirthdays />
    </PageShell>
  );
}
