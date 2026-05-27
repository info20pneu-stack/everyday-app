import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import PasswordGenerator from '../components/PasswordGenerator';

export const metadata: Metadata = {
  title: 'Password Generator | EVERY DAY',
  description: 'Generate strong, secure passwords with custom length, uppercase, numbers and symbols. 100% client-side — your passwords never leave your device.',
  alternates: { canonical: '/password-generator' },
  openGraph: {
    title: 'Password Generator | EVERY DAY',
    description: 'Generate secure passwords with custom options — 100% private, runs in your browser.',
  alternates: { canonical: '/password-generator' },
    url: 'https://everyday-app.vercel.app/password-generator',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Password Generator | EVERY DAY',
    description: 'Generate secure passwords — 100% private, client-side.',
  alternates: { canonical: '/password-generator' },
    images: ['/og-image.png'],
  },
};

export default function PasswordGeneratorPage() {
  return (
    <PageShell>
      <PasswordGenerator />
    </PageShell>
  );
}
