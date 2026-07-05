import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import AdBanner from './AdBanner';
import Dashboard from './Dashboard';
import DashboardRightPanel from './DashboardRightPanel';
import Footer from './Footer';

/**
 * Original homepage dashboard — preserved here while app/page.tsx shows the
 * maintenance page. Swap page.tsx back to render <DashboardBackup /> to restore it.
 */
export default function DashboardBackup() {
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

        <DashboardRightPanel />
      </div>

      <Footer />

      <BottomNav />
    </div>
  );
}
