'use client';

import { useState } from 'react';
import { useLang } from '../../lib/LanguageContext';

export default function Sidebar() {
  const { t, rtl } = useLang();
  const [active, setActive] = useState('home');

  const navItems = [
    { icon: '🏠', label: t.nav.home,              id: 'home' },
    { icon: '🕐', label: t.nav.worldTime,          id: 'worldtime' },
    { icon: '💵', label: t.nav.currency,           id: 'currency' },
    { icon: '📏', label: t.nav.unitConverter,      id: 'units' },
    { icon: '📅', label: t.nav.dateCounter,        id: 'date' },
    { icon: '🌤️', label: t.nav.weather,            id: 'weather' },
    { icon: '👤', label: t.nav.ageCalculator,      id: 'age' },
    { icon: '🏆', label: t.nav.sports,             id: 'sports' },
    { icon: '📈', label: t.nav.trending,           id: 'trending' },
    { icon: '₿',  label: t.nav.crypto,             id: 'crypto' },
    { icon: '⚡', label: t.nav.dailyBoost,         id: 'boost' },
    { icon: '🎮', label: t.nav.dailyGames,         id: 'games' },
    { icon: '📊', label: t.nav.markets,            id: 'markets' },
    { icon: '🌐', label: t.nav.ipAddress,          id: 'ip' },
    { icon: '⚡', label: t.nav.speedTest,          id: 'speed' },
    { icon: '🔑', label: t.nav.passwordGenerator,  id: 'password' },
    { icon: '🌅', label: t.nav.sunriseSunset,      id: 'sunrise' },
    { icon: '⚖️', label: t.nav.bmi,               id: 'bmi' },
  ];

  return (
    <aside style={{
      width: '270px',
      background: 'var(--sidebar)',
      borderRight: rtl ? 'none' : '1px solid rgba(255,255,255,0.04)',
      borderLeft: rtl ? '1px solid rgba(255,255,255,0.04)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0',
      minHeight: '100vh',
      flexShrink: 0,
    }}>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        padding: '0 .75rem',
        flex: 1,
        overflowY: 'auto',
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: rtl ? 'row-reverse' : 'row',
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
              textAlign: rtl ? 'right' : 'left',
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Premium box */}
      <div style={{
        margin: '.75rem',
        background: 'linear-gradient(135deg, #1a1060, #0a0b20)',
        border: '1px solid rgba(93,76,255,0.3)',
        borderRadius: '16px',
        padding: '1rem',
        textAlign: rtl ? 'right' : 'center',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', fontFamily: 'Poppins', marginBottom: '4px' }}>
          {t.premium.title}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '.75rem', lineHeight: '1.5' }}>
          {t.premium.description}
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
          {t.buttons.upgradeNow}
        </button>
      </div>
    </aside>
  );
}
