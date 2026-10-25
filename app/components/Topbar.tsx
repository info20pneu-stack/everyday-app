'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { getNavRoutes, isRouteActive, type NavRoute } from '../../lib/navRoutes';
import { useLang } from '../../lib/LanguageContext';
import { LANGUAGES, type Translations } from '../../lib/i18n';
import { useTheme, type AppTheme } from '../../lib/ThemeContext';
import { useInstallPrompt } from '../../lib/useInstallPrompt';
import { GAMES_CATALOG, gameText } from '../../lib/gamesCatalog';
import { useIsClient } from '../../lib/games/useIsClient';
import Flag from './Flag';

/* Main navigation: 64 px glass bar on desktop (≥ 1024 px), compact 54 px bar + drawer below. */

type Menu = 'lang' | 'settings' | 'more' | 'search' | 'install' | 'msearch' | 'drawer' | null;

/** Primary items shown in the bar (in this order); everything else lives under "More". */
const PRIMARY_IDS = ['home', 'worldtime', 'units', 'currency', 'weather', 'sports', 'games'];

function primaryLabel(t: Translations, r: NavRoute): string {
  switch (r.id) {
    case 'home': return t.topbar.home;
    case 'worldtime': return t.topbar.worldTime;
    case 'units': return t.topbar.converters;
    case 'weather': return t.topbar.weather;
    case 'sports': return t.topbar.sports;
    default: return r.label;
  }
}

function themeLabel(t: Translations, id: AppTheme): string {
  switch (id) {
    case 'dark': return t.topbar.darkMode;
    case 'light': return t.topbar.lightMode;
    case 'xp': return 'Windows XP';
    case 'win98': return 'Windows 98';
    case 'win2000': return 'Windows 2000';
  }
}
const THEMES: { id: AppTheme; icon: string }[] = [
  { id: 'dark', icon: '🌙' }, { id: 'light', icon: '☀️' },
  { id: 'xp', icon: '🪟' }, { id: 'win98', icon: '💾' }, { id: 'win2000', icon: '🖥️' },
];

/** Case- and accent-insensitive text for search matching. */
function fold(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/* ───────────────────────────── icons ───────────────────────────── */

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z" />
  </svg>
);
const GearIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
const InstallIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
  </svg>
);
const BurgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/* ───────────────────────────── component ───────────────────────────── */

export default function Topbar() {
  const { lang, setLang, t, rtl } = useLang();
  const { theme, setTheme } = useTheme();
  const { canInstall, promptInstall, showIosHint } = useInstallPrompt();
  const pathname = usePathname();
  const router = useRouter();
  const isClient = useIsClient();

  const [menu, setMenu] = useState<Menu>(null);
  const [query, setQuery] = useState('');
  const toggle = (m: Exclude<Menu, null>) => setMenu(cur => (cur === m ? null : m));

  const routes = getNavRoutes(t);
  const primary = PRIMARY_IDS.map(id => routes.find(r => r.id === id)).filter((r): r is NavRoute => !!r);
  const secondary = routes.filter(r => !PRIMARY_IDS.includes(r.id));
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  /* ── fit as many primary items as possible; the rest moves into "More" ── */
  const navRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(primary.length);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    if (!nav || !measure) return;
    function fit() {
      const items = Array.from(measure!.querySelectorAll<HTMLElement>('[data-measure="item"]')).map(el => el.offsetWidth);
      const moreW = measure!.querySelector<HTMLElement>('[data-measure="more"]')?.offsetWidth ?? 90;
      const avail = nav!.clientWidth - moreW;
      let used = 0, n = 0;
      for (const w of items) { if (used + w > avail) break; used += w; n++; }
      setVisibleCount(n);
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [lang]);

  const shown = primary.slice(0, visibleCount);
  const overflow = [...primary.slice(visibleCount), ...secondary];
  const moreActive = overflow.some(r => isRouteActive(pathname, r.href));

  /* ── close menus on outside click / Escape / navigation ── */
  useEffect(() => {
    if (!menu) return;
    function onDown(e: Event) {
      const target = e.target as Element | null;
      if (!target?.closest(`[data-menu="${menu}"]`)) setMenu(null);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenu(null); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMenu(null); setQuery(''); }

  /* ── search over pages and games ── */
  const results = (() => {
    const q = fold(query.trim());
    if (!q) return [];
    const pages = routes.map(r => ({ key: r.href, icon: r.icon, label: PRIMARY_IDS.includes(r.id) ? primaryLabel(t, r) : r.label, href: r.href }));
    const games = GAMES_CATALOG.filter(g => !g.soon).map(g => ({ key: `g-${g.id}`, icon: g.icon, label: gameText(t, g.nameKey), href: g.route }));
    return [...pages, ...games].filter(x => fold(x.label).includes(q)).slice(0, 8);
  })();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (results[0]) router.push(results[0].href);
  }

  /* ── install ── */
  const [hintPos, setHintPos] = useState<{ top: number; left: number; width: number } | null>(null);
  function onInstall(btn: HTMLElement) {
    if (canInstall) { promptInstall(); return; }
    if (menu === 'install') { setMenu(null); return; }
    const r = btn.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 16);
    setHintPos({ top: r.bottom + 8, left: Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - 8 - width), width });
    setMenu('install');
  }
  const showInstall = canInstall || showIosHint;

  const searchResults = (id: 'search' | 'msearch') => (menu === id && query.trim()) ? (
    <div className="tb-results" role="listbox">
      {results.length === 0
        ? <div className="tb-results-empty">{t.topbar.noResults}</div>
        : results.map(r => (
          <Link key={r.key} href={r.href} className="tb-result" role="option" aria-selected={false}>
            <span aria-hidden="true">{r.icon}</span><span>{r.label}</span>
          </Link>
        ))}
    </div>
  ) : null;

  const langMenu = (
    <div className="tb-drop tb-lang-drop" role="menu">
      {LANGUAGES.map(l => (
        <button key={l.code} type="button" role="menuitemradio" aria-checked={lang === l.code}
          className={`tb-lang-item${lang === l.code ? ' is-active' : ''}`}
          onClick={() => { setLang(l.code); setMenu(null); }}>
          <span className="tb-flag"><Flag code={l.country} size={20} /></span><span className="tb-ellipsis">{l.name}</span>
        </button>
      ))}
    </div>
  );

  const themeList = (
    <div className="tb-theme-list">
      {THEMES.map(th => (
        <button key={th.id} type="button" role="menuitemradio" aria-checked={theme === th.id}
          className={`tb-theme-item${theme === th.id ? ' is-active' : ''}`}
          onClick={() => { setTheme(th.id); if (menu === 'settings') setMenu(null); }}>
          <span aria-hidden="true">{th.icon}</span><span>{themeLabel(t, th.id)}</span>
        </button>
      ))}
    </div>
  );

  const modeToggle = (
    <div className="tb-mode" role="group" aria-label={t.topbar.appearance}>
      <button type="button" aria-pressed={theme === 'light'} title={t.topbar.lightMode} aria-label={t.topbar.lightMode}
        className={theme === 'light' ? 'is-active' : ''} onClick={() => setTheme('light')}><SunIcon /></button>
      <button type="button" aria-pressed={theme === 'dark'} title={t.topbar.darkMode} aria-label={t.topbar.darkMode}
        className={theme === 'dark' ? 'is-active' : ''} onClick={() => setTheme('dark')}><MoonIcon /></button>
    </div>
  );

  return (
    <header className="tb">
      {/* Logo */}
      <Link href="/" className="tb-logo" aria-label="EVERY DAY">
        <span className="tb-globe" aria-hidden="true" />
        <span className="tb-logo-text">EVERY <span>DAY</span></span>
      </Link>

      {/* Desktop navigation */}
      <nav className="tb-nav" ref={navRef} aria-label="Main">
        {shown.map(r => {
          const active = isRouteActive(pathname, r.href);
          return (
            <Link key={r.id} href={r.href} className={`tb-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span aria-hidden="true" className="tb-link-icon">{r.icon}</span>{primaryLabel(t, r)}
            </Link>
          );
        })}
        <div className="tb-more" data-menu="more">
          <button type="button" className={`tb-link${moreActive || menu === 'more' ? ' is-active' : ''}`}
            aria-expanded={menu === 'more'} aria-haspopup="menu" onClick={() => toggle('more')}>
            {t.topbar.more} <span aria-hidden="true" className={`tb-caret${menu === 'more' ? ' is-open' : ''}`}>▾</span>
          </button>
          {menu === 'more' && (
            <div className="tb-drop tb-more-drop" role="menu">
              {overflow.map(r => {
                const active = isRouteActive(pathname, r.href);
                return (
                  <Link key={r.id} href={r.href} role="menuitem" className={`tb-menu-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                    <span aria-hidden="true" className="tb-menu-icon">{r.icon}</span>
                    <span className="tb-ellipsis">{PRIMARY_IDS.includes(r.id) ? primaryLabel(t, r) : r.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Hidden copy of the nav used only to measure item widths */}
      <div className="tb-measure" ref={measureRef} aria-hidden="true">
        {primary.map(r => (
          <span key={r.id} data-measure="item" className="tb-link"><span className="tb-link-icon">{r.icon}</span>{primaryLabel(t, r)}</span>
        ))}
        <span data-measure="more" className="tb-link">{t.topbar.more} <span className="tb-caret">▾</span></span>
      </div>

      <div className="tb-right">
        {/* Desktop search */}
        <form className="tb-search tb-desktop" data-menu="search" role="search" onSubmit={submitSearch}>
          <SearchIcon />
          <input type="search" value={query} placeholder={t.topbar.search} aria-label={t.topbar.search}
            onChange={e => { setQuery(e.target.value); setMenu('search'); }}
            onFocus={() => setMenu('search')} />
          {searchResults('search')}
        </form>

        {/* Mobile search button */}
        <button type="button" className="tb-icon-btn tb-mobile" aria-label={t.topbar.search} onClick={() => { setQuery(''); setMenu('msearch'); }}>
          <SearchIcon />
        </button>

        {/* Language */}
        <div className="tb-pos" data-menu="lang">
          <button type="button" className={`tb-chip${menu === 'lang' ? ' is-open' : ''}`} aria-label={t.topbar.language}
            aria-expanded={menu === 'lang'} aria-haspopup="menu" onClick={() => toggle('lang')}>
            <span className="tb-flag"><Flag code={current.country} size={20} /></span>
            <span className="tb-lang-code">{current.code.toUpperCase()}</span>
          </button>
          {menu === 'lang' && langMenu}
        </div>

        {/* Light / dark */}
        <div className="tb-desktop">{modeToggle}</div>

        {/* Settings: all skins incl. retro */}
        <div className="tb-pos tb-desktop" data-menu="settings">
          <button type="button" className={`tb-icon-btn${menu === 'settings' ? ' is-open' : ''}`} aria-label={t.topbar.settings} title={t.topbar.settings}
            aria-expanded={menu === 'settings'} aria-haspopup="menu" onClick={() => toggle('settings')}>
            <GearIcon />
          </button>
          {menu === 'settings' && (
            <div className="tb-drop tb-settings-drop" role="menu">
              <div className="tb-drop-title">{t.topbar.appearance}</div>
              {themeList}
            </div>
          )}
        </div>

        {/* Install app */}
        {showInstall && (
          <div className="tb-desktop" data-menu="install">
            <button type="button" className="tb-icon-btn tb-install" title={t.topbar.install} aria-label={t.topbar.install}
              aria-expanded={canInstall ? undefined : menu === 'install'} onClick={e => onInstall(e.currentTarget)}>
              <InstallIcon />
            </button>
            {/* Fixed overlays go to <body>: the bar's backdrop-filter would trap them */}
            {menu === 'install' && hintPos && !canInstall && isClient && createPortal(
              <div role="status" className="tb-hint" data-menu="install" style={{ top: hintPos.top, left: hintPos.left, width: hintPos.width }}>
                {t.topbar.installIosHint}
              </div>,
              document.body,
            )}
          </div>
        )}

        {/* Mobile menu button */}
        <button type="button" className="tb-icon-btn tb-mobile" aria-label={t.topbar.menu} aria-expanded={menu === 'drawer'}
          onClick={() => setMenu('drawer')}>
          <BurgerIcon />
        </button>
      </div>

      {/* Mobile full-width search */}
      {menu === 'msearch' && (
        <form className="tb-msearch" data-menu="msearch" role="search" onSubmit={submitSearch}>
          <SearchIcon />
          <input type="search" autoFocus value={query} placeholder={t.topbar.search} aria-label={t.topbar.search}
            onChange={e => setQuery(e.target.value)} />
          <button type="button" className="tb-icon-btn" aria-label={t.topbar.close} onClick={() => setMenu(null)}><CloseIcon /></button>
          {searchResults('msearch')}
        </form>
      )}

      {/* Mobile drawer */}
      {menu === 'drawer' && isClient && createPortal(
        <div className="tb-drawer-backdrop" dir={rtl ? 'rtl' : 'ltr'} onClick={e => { if (e.target === e.currentTarget) setMenu(null); }}>
          <aside className={`tb-drawer${rtl ? ' is-rtl' : ''}`} data-menu="drawer" aria-label={t.topbar.menu}>
            <div className="tb-drawer-head">
              <span className="tb-logo-text">EVERY <span>DAY</span></span>
              <button type="button" className="tb-icon-btn" aria-label={t.topbar.close} onClick={() => setMenu(null)}><CloseIcon /></button>
            </div>
            <nav className="tb-drawer-nav">
              {[...primary, ...secondary].map(r => {
                const active = isRouteActive(pathname, r.href);
                return (
                  <Link key={r.id} href={r.href} className={`tb-menu-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}
                    onClick={() => setMenu(null)}>
                    <span aria-hidden="true" className="tb-menu-icon">{r.icon}</span>
                    <span className="tb-ellipsis">{PRIMARY_IDS.includes(r.id) ? primaryLabel(t, r) : r.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="tb-drawer-section">
              <div className="tb-drop-title">{t.topbar.settings}</div>
              <div className="tb-drawer-row">{modeToggle}</div>
              <div className="tb-drop-title tb-sub">{t.topbar.appearance}</div>
              {themeList}
              {showInstall && (
                <>
                  <button type="button" className="tb-theme-item tb-drawer-install" onClick={() => { if (canInstall) promptInstall(); }}>
                    <InstallIcon /><span>{t.topbar.install}</span>
                  </button>
                  {!canInstall && <p className="tb-drawer-hint">{t.topbar.installIosHint}</p>}
                </>
              )}
            </div>
          </aside>
        </div>,
        document.body,
      )}

    </header>
  );
}
