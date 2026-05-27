import type { Metadata } from 'next';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';
import AdBanner from './components/AdBanner';
import MainContent from './components/MainContent';

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

      {/* ── TOP BANNER 728×90 — hidden on mobile via .ad-top-wrapper ── */}
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
          {/* Hero */}
          <div className="hero-section" style={{
            background: 'linear-gradient(135deg, #0D1324, #050816)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            marginBottom: '1.25rem',
          }}>
            <h1 className="hero-title" style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '3rem',
              fontWeight: '600',
              letterSpacing: '3px',
              color: '#fff',
            }}>
              EVERY <span style={{ color: 'var(--purple2)' }}>DAY</span>
            </h1>
            <p style={{ color: 'var(--text2)', marginTop: '.5rem', fontSize: '1rem' }}>
              Everything you need. Every day.
            </p>
          </div>

          {/* Responsive: tile grid on mobile/tablet, widget grid on desktop */}
          <MainContent />

          {/* ── MOBILE BANNER 320×100 — visible only on mobile ── */}
          <div className="ad-mobile-wrapper">
            <AdBanner variant="mobile" slot="4444444444" />
          </div>
        </main>
      </div>

      {/* Fixed bottom navigation — visible only on mobile */}
      <BottomNav />
    </div>
  );
}
