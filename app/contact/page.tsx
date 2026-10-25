import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import { ContactContent } from '../components/InfoPages';

export const metadata: Metadata = {
  title: 'Contact | EVERY DAY',
  description: 'How to contact EVERY DAY: e-mail, feature ideas, bug reports and partnerships.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact | EVERY DAY',
    description: 'How to contact EVERY DAY: e-mail, feature ideas, bug reports and partnerships.',
    url: 'https://www.everyday1234567.com/contact',
    siteName: 'EVERY DAY',
    type: 'website',
  },
};

export default function Page() {
  return (
    <PageShell>
      <ContactContent />
    </PageShell>
  );
}
