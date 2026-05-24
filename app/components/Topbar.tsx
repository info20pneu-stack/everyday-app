'use client';

export default function Topbar() {
  return (
    <header style={{
      height: '54px',
      background: 'var(--bg2)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        width: '270px',
        padding: '0 1.5rem',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '1.5px',
        color: '#fff',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        EVERY <span style={{ color: 'var(--purple2)', marginLeft: '6px' }}>DAY</span>
      </div>

      <nav style={{ display: 'flex', height: '100%', padding: '0 .75rem' }}>
        {['Home', 'World Time', 'Converters', 'Weather', 'Sports', 'More'].map((item) => (
          <button key={item} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text3)',
            fontSize: '12.5px',
            padding: '0 14px',
            height: '100%',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, sans-serif',
          }}>
            {item}
          </button>
        ))}
      </nav>

      <div style={{
        marginLeft: 'auto',
        marginRight: '1rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '50px',
        padding: '7px 18px',
        fontSize: '12px',
        color: 'var(--text3)',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        width: '220px',
      }}>
        🔍 Search anything...
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 1rem',
      }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '14px',
        }}>☀️</div>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--purple), var(--purple2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: '#fff',
        }}>D</div>
      </div>
    </header>
  );
}