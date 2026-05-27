import type { Metadata } from 'next';
import PageShell from '../components/PageShell';
import IPAddress from '../components/IPAddress';

export const metadata: Metadata = {
  title: 'My IP Address | EVERY DAY',
  description: 'Find your public IP address, geolocation, ISP, city and country instantly. IPv4 and IPv6 support.',
  alternates: { canonical: '/ip-address' },
  openGraph: {
    title: 'My IP Address | EVERY DAY',
    description: 'Instantly find your public IP, location, ISP and network details.',
  alternates: { canonical: '/ip-address' },
    url: 'https://everyday-app.vercel.app/ip-address',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My IP Address | EVERY DAY',
    description: 'Instantly find your public IP, location and ISP.',
  alternates: { canonical: '/ip-address' },
    images: ['/og-image.png'],
  },
};

export default function IPAddressPage() {
  return (
    <PageShell>
      <IPAddress />
    </PageShell>
  );
}
