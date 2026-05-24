'use client';

import { useState, useRef, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { LANGUAGES } from '../../lib/i18n';

export default function Topbar() {
  const { lang, setLang, t, rtl } = useLang();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === lang)!;

  const navItems = [
    t.topbar.home,
    t.topbar.worldTime,
    t.topbar.converters,
    t.topbar.weather,
    t.topbar.sports,
    t.topbar.more,
  ];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      flexDirection: rtl ? 'row-reverse' : 'row',
    }}>
      {/* Logo */}
      <div className="topbar-logo-section" style={{
        width: '270px',
        padding: '0 1.5rem',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '1.5px',
        color: '#fff',
        borderRight: rtl ? 'none' : '1px solid rgba(255,255,255,0.05)',
        borderLeft: rtl ? '1px solid rgba(255,255,255,0.05)' : 'none',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        EVERY <span style={{ color: 'var(--purple2)', marginLeft: '6px' }}>DAY</span>
      </div>

      {/* Nav */}
      <nav className="topbar-nav" style={{ display: 'flex', height: '100%', padding: '0 .75rem' }}>
        {navItems.map((item) => (
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

      {/* Search */}
      <div className="topbar-search" style={{
        marginLeft: rtl ? undefined : 'auto',
        marginRight: rtl ? 'auto' : '1rem',
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
        🔍 {t.topbar.search}
      </div>

      {/* Right icons + lang switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 1rem',
        flexShrink: 0,
      }}>
        {/* Language dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: open ? 'rgba(93,76,255,0.18)' : 'rgba(255,255,255,0.04)',
              border: open ? '1px solid rgba(93,76,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: '8px',
              color: '#fff',
              padding: '4px 9px',
              fontSize: '13px',
              cursor: 'pointer',
              height: '32px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '16px' }}>{current.flag}</span>
            <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: '500' }}>
              {current.code.toUpperCase()}
            </span>
            <span style={{
              fontSize: '8px',
              color: 'var(--text3)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform .15s',
              display: 'inline-block',
            }}>▼</span>
          </button>

          {open && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: rtl ? undefined : 0,
              left: rtl ? 0 : undefined,
              background: '#0f1428',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '6px',
              zIndex: 200,
              width: '180px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2px',
            }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: lang === l.code
                      ? 'linear-gradient(135deg, var(--purple), #7A3FFF)'
                      : 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: lang === l.code ? '#fff' : 'var(--text2)',
                    padding: '6px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>{l.flag}</span>
                  <span style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '14px',
        }}>☀️</div>

        {/* Avatar */}
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
