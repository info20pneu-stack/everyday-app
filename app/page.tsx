import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AdBanner from './components/AdBanner';
import WorldTime from './components/WorldTime';
import Currency from './components/Currency';
import UnitConverter from './components/UnitConverter';
import DateCounter from './components/DateCounter';
import AgeCalculator from './components/AgeCalculator';
import Weather from './components/Weather';
import Sports from './components/Sports';
import Rankings from './components/Rankings';
import Crypto from './components/Crypto';
import DailyBoost from './components/DailyBoost';
import DailyGames from './components/DailyGames';
import IPAddress from './components/IPAddress';
import SpeedTest from './components/SpeedTest';
import PasswordGenerator from './components/PasswordGenerator';
import SunriseSunset from './components/SunriseSunset';
import BMI from './components/BMI';
import Markets from './components/Markets';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />

      {/* ── TOP BANNER 728×90 ── */}
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '10px 1.25rem',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <AdBanner variant="top" slot="1111111111" />
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />

        <main style={{
          flex: 1,
          background: 'var(--bg1)',
          padding: '1.25rem',
          minWidth: 0,
        }}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #0D1324, #050816)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '2rem',
            marginBottom: '1.25rem',
          }}>
            <h1 style={{
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

          {/* Widget grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1.25rem',
          }}>
            {/* Row 1 */}
            <WorldTime />
            <Currency />
            <UnitConverter />

            {/* ── INLINE BANNER 728×90 after row 1 ── */}
            <div style={{ gridColumn: '1 / -1' }}>
              <AdBanner variant="inline" slot="2222222222" />
            </div>

            {/* Row 2 */}
            <DateCounter />
            <AgeCalculator />
            <Weather />

            {/* Row 3 */}
            <Sports />
            <Rankings />
            <Crypto />

            {/* ── INLINE BANNER 728×90 after row 3 ── */}
            <div style={{ gridColumn: '1 / -1' }}>
              <AdBanner variant="inline" slot="3333333333" />
            </div>

            {/* Row 4 */}
            <DailyBoost />
            <DailyGames />
            <Markets />

            {/* Row 5 */}
            <IPAddress />
            <SpeedTest />
            <PasswordGenerator />

            {/* Row 6 */}
            <SunriseSunset />
            <BMI />
          </div>

          {/* ── MOBILE BANNER 320×100 at bottom ── */}
          <div style={{ marginTop: '1.25rem' }}>
            <AdBanner variant="mobile" slot="4444444444" />
          </div>
        </main>
      </div>
    </div>
  );
}
