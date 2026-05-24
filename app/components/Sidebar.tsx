'use client';

import { useState } from 'react';

const navItems = [
  { icon: '🏠', label: 'Home', id: 'home' },
  { icon: '🕐', label: 'World Time', id: 'worldtime' },
  { icon: '💵', label: 'Currency', id: 'currency' },
  { icon: '📏', label: 'Unit Converter', id: 'units' },
  { icon: '📅', label: 'Date Counter', id: 'date' },
  { icon: '🌤️', label: 'Weather', id: 'weather' },
  { icon: '👤', label: 'Age Calculator', id: 'age' },
  { icon: '🏆', label: 'Sports Center', id: 'sports' },
  { icon: '📈', label: 'Trending', id: 'trending' },
  { icon: '₿', label: 'Crypto', id: 'crypto' },
  { icon: '⚡', label: 'Daily Boost', id: 'boost' },
];

export default function Sidebar() {
  const [active, setActive] = useState('home');

  return (
    <aside style={{
      width: '270px',
      background: 'var(--sidebar)',
      borderRight: '1px solid rgba(255,255,255,0.04)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0',
      minHeight: '100vh',
      flexShrink: 0,
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '0 .75rem', flex: 1 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '14px',
              fontSize: '13px',
              color: active === item.id ? '#fff' : 'var(--text3)',
              background: active === item.id
                ? 'linear-gradient(90deg, var(--purple), #7A3FFF)'
                : 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{
        margin: '.75rem',
        background: 'linear-gradient(135deg, #1a1060, #0a0b20)',
        border: '1px solid rgba(93,76,255,0.3)',
        borderRadius: '16px',
        padding: '1rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', fontFamily: 'Poppins', marginBottom: '4px' }}>
          GO PREMIUM
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '.75rem', lineHeight: '1.5' }}>
          Ad-free experience and more powerful features
        </div>
        <button style={{
          background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
          border: 'none',
          color: '#fff',
          fontSize: '12px',
          fontWeight: '500',
          padding: '9px 0',
          borderRadius: '10px',
          cursor: 'pointer',
          width: '100%',
        }}>
          Upgrade Now
        </button>
      </div>
    </aside>
  );
}