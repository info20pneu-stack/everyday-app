'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getNavRoutes, isRouteActive } from '../../lib/navRoutes';
import { useLang } from '../../lib/LanguageContext';
import { LANGUAGES } from '../../lib/i18n';
import { useTheme, type AppTheme } from '../../lib/ThemeContext';
import StreakBadge from './StreakBadge';
import { useInstallPrompt } from '../../lib/useInstallPrompt';

const THEMES: { id: AppTheme; label: string; icon: string }[] = [
  { id: 'dark',  label: 'Dark',      icon: '🌙' },
  { id: 'light', label: 'Light',     icon: '☀️' },
  { id: 'xp',    label: 'Windows XP', icon: '🪟' },
  { id: 'win98', label: 'Win 98',    icon: '💾' },
  { id: 'win2000', label: 'Windows 2000', icon: '🖥️' },
];

export default function Topbar() {
  const { lang, setLang, t, rtl } = useLang();
  const { theme, setTheme } = useTheme();
  const { canInstall, promptInstall, showIosHint } = useInstallPrompt();
  // Position of the iOS install hint (viewport coords), null while closed
  const [iosHintPos, setIosHintPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const iosHintOpen = iosHintPos !== null;
  const installRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === lang)!;

  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: t.topbar.home,       href: '/' },
    { label: t.topbar.worldTime,  href: '/world-time' },
    { label: t.topbar.converters, href: '/unit-converter' },
    { label: t.topbar.weather,    href: '/weather' },
    { label: t.topbar.sports,     href: '/sports' },
  ];
  // "More" lists every other page
  const moreItems = getNavRoutes(t).filter(r => !navItems.some(n => n.href === r.href));
  const moreActive = moreItems.some(r => isRouteActive(pathname, r.href));

  useEffect(() => {
    function handler(e: Event) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (installRef.current && !installRef.current.contains(e.target as Node)) setIosHintPos(null);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIosHintPos(null); }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Centre the hint under the button, but keep it fully on screen
  function toggleIosHint(btn: HTMLElement) {
    if (iosHintPos) { setIosHintPos(null); return; }
    const r = btn.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - 8 - width);
    setIosHintPos({ top: r.bottom + 8, left, width });
  }

  const currentTheme = THEMES.find(th => th.id === theme) ?? THEMES[0];

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
        {navItems.map(item => {
          const active = isRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={active ? 'topbar-link topbar-link-active' : 'topbar-link'}
            >
              {item.label}
            </Link>
          );
        })}
        <div ref={moreRef} style={{ position: 'relative', height: '100%' }}>
          <button
            onClick={() => setMoreOpen(o => !o)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={moreActive || moreOpen ? 'topbar-link topbar-link-active' : 'topbar-link'}
          >
            {t.topbar.more}
            <span style={{ fontSize: '12px', marginInlineStart: '4px', display: 'inline-block', transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
          </button>
          {moreOpen && (
            <div role="menu" className="topbar-more-menu" style={{ [rtl ? 'right' : 'left']: 0 }}>
              {moreItems.map(r => {
                const active = isRouteActive(pathname, r.href);
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
                    className={active ? 'topbar-more-item topbar-more-item-active' : 'topbar-more-item'}
                    onClick={() => setMoreOpen(false)}
                  >
                    <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{r.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Search */}
      <div className="topbar-search" style={{
        marginLeft: rtl ? undefined : 'auto',
        marginRight: rtl ? 'auto' : '1rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '50px',
        padding: '7px 18px',
        fontSize: '12px',
        color: 'var(--text3)',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        width: '220px',
        cursor: 'text',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      >
        🔍 {t.topbar.search}
      </div>

      {/* Right icons + lang switcher */}
      <div className="topbar-actions" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 1rem',
        flexShrink: 0,
      }}>
        {/* Install PWA — native prompt where offered; on iOS a "Share → Add to Home Screen" hint */}
        {(canInstall || showIosHint) && (
          <div ref={installRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={e => { if (canInstall) promptInstall(); else toggleIosHint(e.currentTarget); }}
              aria-expanded={canInstall ? undefined : iosHintOpen}
              className="topbar-btn topbar-install"
              title={t.topbar.install}
              aria-label={t.topbar.install}
              style={{
                display: 'flex', alignItems: 'center',
                background: 'rgba(93,76,255,0.14)', border: '1px solid rgba(93,76,255,0.4)',
                borderRadius: '8px', color: '#C4BAFF', padding: '4px 8px', cursor: 'pointer', height: '32px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </button>
            {iosHintPos && !canInstall && (
              <div role="status" className="topbar-ios-hint" style={{
                position: 'fixed', top: iosHintPos.top, left: iosHintPos.left, width: iosHintPos.width,
                boxSizing: 'border-box', textAlign: 'center',
                background: '#0f1428', border: '1px solid rgba(93,76,255,0.4)',
                borderRadius: '12px', padding: '10px 12px', zIndex: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                color: '#fff', fontSize: '13px', lineHeight: 1.45, whiteSpace: 'normal',
              }}>
                {t.topbar.installIosHint}
              </div>
            )}
          </div>
        )}

        {/* Language dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            className="topbar-btn"
            aria-label="Language"
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
            <span className="topbar-lang-code" style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '500' }}>
              {current.code.toUpperCase()}
            </span>
            <span className="topbar-lang-caret" style={{
              fontSize: '12px',
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
              maxWidth: 'calc(100vw - 16px)',
              maxHeight: 'calc(100dvh - 70px)',
              overflowY: 'auto',
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
                    minHeight: '40px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>{l.flag}</span>
                  <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme selector */}
        <div ref={themeRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setThemeOpen(o => !o)}
            title="Change theme"
            className="topbar-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: themeOpen ? 'rgba(93,76,255,0.18)' : 'rgba(255,255,255,0.04)',
              border: themeOpen ? '1px solid rgba(93,76,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: '#fff', padding: '4px 8px',
              fontSize: '14px', cursor: 'pointer', height: '32px',
            }}
          >
            <span>{currentTheme.icon}</span>
          </button>
          {themeOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)',
              right: rtl ? undefined : 0, left: rtl ? 0 : undefined,
              background: '#0f1428', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '6px', zIndex: 200,
              width: '150px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
              {THEMES.map(th => (
                <button key={th.id} onClick={() => { setTheme(th.id); setThemeOpen(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: theme === th.id ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'transparent',
                  border: 'none', borderRadius: '8px',
                  color: theme === th.id ? '#fff' : 'var(--text2)',
                  padding: '7px 10px', minHeight: '40px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', width: '100%',
                }}>
                  <span style={{ fontSize: '14px' }}>{th.icon}</span>
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Streak badge */}
        <StreakBadge />

        {/* Avatar */}
        <div className="topbar-avatar" style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--purple), var(--purple2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#fff',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 14px rgba(93,76,255,0.5)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
        >D</div>
      </div>
    </header>
  );
}
