'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import AdBanner from './AdBanner';

const COLLAPSED_W = 60;
const EXPANDED_W  = 270;

function useWindowWidth() {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

export default function Sidebar() {
  const { t, rtl } = useLang();
  const [active,    setActive]    = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const windowWidth = useWindowWidth();

  // tablet (481–768 px): always force collapsed, but don't overwrite user preference
  const isTabletForced = windowWidth !== null && windowWidth <= 768 && windowWidth > 480;
  const effectiveCollapsed = isTabletForced || collapsed;

  // Restore preference from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }

  const navItems = [
    { icon: '🏠', label: t.nav.home,              id: 'home'     },
    { icon: '🕐', label: t.nav.worldTime,          id: 'worldtime'},
    { icon: '💵', label: t.nav.currency,           id: 'currency' },
    { icon: '📏', label: t.nav.unitConverter,      id: 'units'    },
    { icon: '📅', label: t.nav.dateCounter,        id: 'date'     },
    { icon: '🌤️', label: t.nav.weather,            id: 'weather'  },
    { icon: '👤', label: t.nav.ageCalculator,      id: 'age'      },
    { icon: '🏆', label: t.nav.sports,             id: 'sports'   },
    { icon: '📈', label: t.nav.trending,           id: 'trending' },
    { icon: '₿',  label: t.nav.crypto,             id: 'crypto'   },
    { icon: '⚡', label: t.nav.dailyBoost,         id: 'boost'    },
    { icon: '🎮', label: t.nav.dailyGames,         id: 'games'    },
    { icon: '📊', label: t.nav.markets,            id: 'markets'  },
    { icon: '🌐', label: t.nav.ipAddress,          id: 'ip'       },
    { icon: '🚀', label: t.nav.speedTest,          id: 'speed'    },
    { icon: '🔑', label: t.nav.passwordGenerator,  id: 'password' },
    { icon: '🌅', label: t.nav.sunriseSunset,      id: 'sunrise'  },
    { icon: '⚖️', label: t.nav.bmi,               id: 'bmi'      },
    { icon: '💡', label: t.nav.suggest ?? 'Suggest & Vote', id: 'suggest', href: '/suggest' },
  ];

  const w = effectiveCollapsed ? COLLAPSED_W : EXPANDED_W;

  // Arrow direction respects RTL + collapse state
  const arrowIcon = (() => {
    if (!rtl) return effectiveCollapsed ? '›' : '‹';
    return effectiveCollapsed ? '‹' : '›';
  })();

  return (
    <aside
      className="app-sidebar"
      style={{
        width: w,
        minWidth: w,
        background: 'var(--sidebar)',
        borderRight: rtl ? 'none' : '1px solid rgba(255,255,255,0.04)',
        borderLeft:  rtl ? '1px solid rgba(255,255,255,0.04)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0',
        minHeight: '100vh',
        flexShrink: 0,
        position: 'relative',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Toggle button — hidden when tablet forces collapse ── */}
      <button
        onClick={toggle}
        title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: '50%',
          right: rtl ? undefined : '-12px',
          left:  rtl ? '-12px'  : undefined,
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: '24px',
          height: '48px',
          borderRadius: rtl ? '6px 0 0 6px' : '0 6px 6px 0',
          background: 'var(--sidebar)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderLeft:  rtl ? '1px solid rgba(255,255,255,0.08)' : 'none',
          borderRight: rtl ? 'none' : '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text3)',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          display: isTabletForced ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s, color 0.2s',
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(93,76,255,0.25)';
          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
        }}
      >
        {arrowIcon}
      </button>

      {/* ── Nav items ── */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          padding: effectiveCollapsed ? '0 6px' : '0 .75rem',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'padding 0.3s ease',
        }}
      >
        {navItems.map(item => {
          const isActive = active === item.id;
          const itemStyle: React.CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            flexDirection: rtl ? 'row-reverse' : 'row',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            gap: effectiveCollapsed ? 0 : '10px',
            padding: effectiveCollapsed ? '10px 0' : '10px 14px',
            borderRadius: '14px',
            fontSize: '13px',
            color: isActive ? '#fff' : 'var(--text3)',
            background: isActive
              ? 'linear-gradient(90deg, var(--purple), #7A3FFF)'
              : 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: rtl ? 'right' : 'left',
            transition: 'background 0.15s, padding 0.3s ease, gap 0.3s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textDecoration: 'none',
          };
          const inner = (
            <>
              <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>
                {item.icon}
              </span>
              <span style={{
                opacity: effectiveCollapsed ? 0 : 1,
                maxWidth: effectiveCollapsed ? 0 : '200px',
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
                overflow: 'hidden',
                display: 'inline-block',
              }}>
                {item.label}
              </span>
            </>
          );
          if ('href' in item && item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                title={effectiveCollapsed ? item.label : undefined}
                style={itemStyle}
                onClick={() => setActive(item.id)}
              >
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              title={effectiveCollapsed ? item.label : undefined}
              style={itemStyle}
            >
              {inner}
            </button>
          );
        })}
      </nav>

      {/* ── Premium box ── */}
      {!effectiveCollapsed && (
        <div style={{
          margin: '.75rem',
          background: 'linear-gradient(135deg, #1a1060, #0a0b20)',
          border: '1px solid rgba(93,76,255,0.3)',
          borderRadius: '16px',
          padding: '1rem',
          textAlign: rtl ? 'right' : 'center',
          animation: 'fadeIn 0.2s ease',
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
      )}

      {/* Collapsed — premium icon only */}
      {collapsed && (
        <div style={{
          padding: '8px 6px',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            title={t.buttons.upgradeNow}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⭐
          </button>
        </div>
      )}

      {/* ── Sidebar banner — hidden when collapsed ── */}
      {!effectiveCollapsed && (
        <div style={{
          margin: '0 .75rem .75rem',
          overflow: 'hidden',
          borderRadius: '12px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <AdBanner variant="sidebar" slot="5555555555" />
        </div>
      )}
    </aside>
  );
}
