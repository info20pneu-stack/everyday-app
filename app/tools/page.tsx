import type { Metadata } from 'next';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import ToolsGrid from '../components/ToolsGrid';
import { getCardImageIds } from '../../lib/cardImages';

export const metadata: Metadata = {
  title: 'All Tools | EVERY DAY',
  description: 'All EVERY DAY tools in one place: daily games, converters, calculators, news, weather, speed test and more.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'All Tools | EVERY DAY',
    description: 'All EVERY DAY tools in one place.',
    url: 'https://www.everyday1234567.com/tools',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
};

export default function ToolsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <main className="main-content" style={{ flex: 1, background: 'var(--bg1)', padding: '1.25rem', minWidth: 0 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <ToolsGrid imageIds={getCardImageIds()} heading="h1" />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
