import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import PrivacyPolicyContent from '../components/PrivacyPolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | EVERY DAY',
  description: 'Privacy Policy for EVERY DAY — how we collect, use and protect your data, including cookies and Google AdSense.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy | EVERY DAY',
    description: 'Privacy Policy for EVERY DAY — how we collect, use and protect your data.',
    url: 'https://everyday-app.vercel.app/privacy-policy',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | EVERY DAY',
    description: 'Privacy Policy for EVERY DAY — how we collect and protect your data.',
    images: ['/og-image.png'],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <PrivacyPolicyContent />
    </PageShell>
  );
}
