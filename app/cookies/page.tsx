import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import { CookiesContent } from '../components/InfoPages';

export const metadata: Metadata = {
  title: 'Cookie Policy | EVERY DAY',
  description: 'Which cookies and browser storage EVERY DAY uses: AdSense, visit statistics, localStorage and leaderboards.',
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: 'Cookie Policy | EVERY DAY',
    description: 'Which cookies and browser storage EVERY DAY uses: AdSense, visit statistics, localStorage and leaderboards.',
    url: 'https://www.everyday1234567.com/cookies',
    siteName: 'EVERY DAY',
    type: 'website',
  },
};

export default function Page() {
  return (
    <PageShell>
      <CookiesContent />
    </PageShell>
  );
}
