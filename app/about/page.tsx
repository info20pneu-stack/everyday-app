import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import { AboutContent } from '../components/InfoPages';

export const metadata: Metadata = {
  title: 'About the project | EVERY DAY',
  description: 'What EVERY DAY is, who it is for, the daily games and how the site is funded.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About the project | EVERY DAY',
    description: 'What EVERY DAY is, who it is for, the daily games and how the site is funded.',
    url: 'https://www.everyday1234567.com/about',
    siteName: 'EVERY DAY',
    type: 'website',
  },
};

export default function Page() {
  return (
    <PageShell>
      <AboutContent />
    </PageShell>
  );
}
