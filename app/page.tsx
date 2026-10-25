import type { Metadata } from 'next';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';
import AdBanner from './components/AdBanner';
import Dashboard from './components/Dashboard';
import DashboardRightPanel from './components/DashboardRightPanel';
import { getCardImageIds } from '../lib/cardImages';

export const metadata: Metadata = {
  title: 'EVERY DAY | Time, Weather, Sports, Converter and More',
  description: 'Everything you need every day: world clocks, weather, sports, converters, countdowns and more.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'EVERY DAY | Time, Weather, Sports, Converter and More',
    description: 'Everything you need every day: world clocks, weather, sports, converters, countdowns and more.',
    url: 'https://www.everyday1234567.com/',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EVERY DAY | Time, Weather, Sports, Converter and More',
    description: 'Everything you need every day: world clocks, weather, sports, converters, countdowns and more.',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />

      {/* Top leaderboard — hidden on mobile */}
      <div className="ad-top-wrapper" style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '10px 1.25rem',
      }}>
        <AdBanner variant="top" slot="1111111111" />
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        <main className="main-content" style={{
          flex: 1,
          background: 'var(--bg1)',
          padding: '1.25rem',
          minWidth: 0,
        }}>
          <Dashboard imageIds={getCardImageIds()} />
        </main>

        <DashboardRightPanel />
      </div>


      <BottomNav />
    </div>
  );
}
