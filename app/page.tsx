import type { Metadata } from 'next';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';
import AdBanner from './components/AdBanner';
import Dashboard from './components/Dashboard';

export const metadata: Metadata = {
  title: 'EVERY DAY | Time, Weather, Sports, Converter and More',
  description: 'Everything you need every day: world clocks, weather forecast, crypto prices, sports scores, currency converter, unit converter, BMI, speed test, daily games and more.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'EVERY DAY | Time, Weather, Sports, Converter and More',
    description: 'World clocks, weather, crypto, sports, currency converter, BMI, speed test, daily games — all in one place.',
    url: 'https://everyday-app.vercel.app/',
    siteName: 'EVERY DAY',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EVERY DAY — All your daily tools in one place' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EVERY DAY | Time, Weather, Sports, Converter and More',
    description: 'World clocks, weather, crypto, sports, currency converter and more — all in one place.',
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
        <Sidebar />

        <main className="main-content" style={{
          flex: 1,
          background: 'var(--bg1)',
          padding: '1.25rem',
          minWidth: 0,
        }}>
          <Dashboard />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
