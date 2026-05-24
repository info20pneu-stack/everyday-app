import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, background: 'var(--bg1)', padding: '1.25rem' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
