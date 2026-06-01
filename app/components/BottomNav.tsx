'use client';

import { useState, useRef } from 'react';
import { useLang } from '../../lib/LanguageContext';

const NAV_ITEMS = [
  { id: 'home',    icon: '🏠', key: 'home'      as const },
  { id: 'time',    icon: '🕐', key: 'worldTime'  as const },
  { id: 'weather', icon: '🌤️', key: 'weather'    as const },
  { id: 'sports',  icon: '🏆', key: 'sports'     as const },
  { id: 'crypto',  icon: '₿',  key: 'crypto'     as const },
] as const;

export default function BottomNav() {
  const { t } = useLang();
  const [active, setActive] = useState<string>('home');
  const touchStartX = useRef(0);

  const NAV_IDS = NAV_ITEMS.map(i => i.id);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 50) return;
    const curr = NAV_IDS.findIndex(id => id === active);
    if (delta < 0 && curr < NAV_IDS.length - 1) setActive(NAV_IDS[curr + 1]);
    else if (delta > 0 && curr > 0) setActive(NAV_IDS[curr - 1]);
  }

  return (
    <nav
      className="bottom-nav"
      aria-label="Mobile navigation"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {NAV_ITEMS.map(item => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              flex: 1,
              height: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              position: 'relative',
            }}
          >
            {/* Active indicator pill */}
            {isActive && (
              <span style={{
                position: 'absolute',
                top: '6px',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(93,76,255,0.2)',
                border: '1px solid rgba(93,76,255,0.35)',
              }} />
            )}
            <span style={{
              fontSize: '20px',
              lineHeight: 1,
              position: 'relative',
              zIndex: 1,
              filter: isActive ? 'drop-shadow(0 0 6px rgba(93,76,255,0.8))' : 'none',
              transition: 'filter .15s',
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '9px',
              color: isActive ? 'var(--purple3)' : 'var(--text3)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: isActive ? '600' : '400',
              letterSpacing: '.2px',
              transition: 'color .15s',
              maxWidth: '54px',
              textAlign: 'center',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {t.nav[item.key]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
