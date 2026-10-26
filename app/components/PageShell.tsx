import Topbar from './Topbar';
import RetroWindow from './RetroWindow';
import BottomNav from './BottomNav';

export default function PageShell({ children, maxWidth = 680 }: { children: React.ReactNode; maxWidth?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <main className="main-content" style={{ flex: 1, background: 'var(--bg1)', padding: '1.25rem', minWidth: 0 }}>
          <div style={{ maxWidth: `${maxWidth}px`, margin: '0 auto' }}>
            <RetroWindow>{children}</RetroWindow>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
