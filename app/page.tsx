import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
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

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{
          flex: 1,
          background: 'var(--bg1)',
          padding: '1.25rem',
        }}>
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1.25rem',
          }}>
            <WorldTime />
            <Currency />
            <UnitConverter />
            <DateCounter />
            <AgeCalculator />
            <Weather />
            <Sports />
            <Rankings />
            <Crypto />
            <DailyBoost />
          </div>

        </main>
      </div>
    </div>
  );
}