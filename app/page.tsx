import type { Metadata } from 'next';
import MaintenancePage from './components/MaintenancePage';

export const metadata: Metadata = {
  title: 'EVERY DAY | Coming Soon',
  description: "We're building something amazing. Coming soon.",
  alternates: { canonical: '/' },
};

export default function Home() {
  return <MaintenancePage />;
}
