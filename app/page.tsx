export default function Home() {
  return (
    <main style={{
      background: '#02040E',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '600',
          letterSpacing: '4px',
          color: '#fff',
          marginBottom: '1rem',
        }}>
          EVERY <span style={{ color: '#7262FF' }}>DAY</span>
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#A1A1AA',
          marginBottom: '2rem',
        }}>
          Everything you need. Every day.
        </p>
        <div style={{
          background: 'rgba(93,76,255,0.1)',
          border: '1px solid rgba(93,76,255,0.3)',
          borderRadius: '12px',
          padding: '1rem 2rem',
          color: '#7262FF',
          fontSize: '0.9rem',
        }}>
          🚀 Coming soon — building in progress
        </div>
      </div>
    </main>
  );
}