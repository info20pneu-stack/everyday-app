import type { Translations } from './i18n';

export type NavRoute = { id: string; icon: string; href: string; label: string };

/** Every page reachable from the Sidebar / Topbar, in sidebar order. */
export function getNavRoutes(t: Translations): NavRoute[] {
  return [
    { id: 'home',      icon: '🏠', href: '/',                   label: t.nav.home },
    { id: 'worldtime', icon: '🕐', href: '/world-time',         label: t.nav.worldTime },
    { id: 'currency',  icon: '💵', href: '/currency',           label: t.nav.currency },
    { id: 'units',     icon: '📏', href: '/unit-converter',     label: t.nav.unitConverter },
    { id: 'date',      icon: '📅', href: '/date-counter',       label: t.nav.dateCounter },
    { id: 'weather',   icon: '🌤️', href: '/weather',            label: t.nav.weather },
    { id: 'age',       icon: '👤', href: '/age-calculator',     label: t.nav.ageCalculator },
    { id: 'sports',    icon: '🏆', href: '/sports',             label: t.nav.sports },
    { id: 'trending',  icon: '📈', href: '/rankings',           label: t.nav.trending },
    { id: 'crypto',    icon: '₿',  href: '/crypto',             label: t.nav.crypto },
    { id: 'boost',     icon: '⚡', href: '/daily-boost',        label: t.nav.dailyBoost },
    { id: 'games',     icon: '🎮', href: '/daily-games',        label: t.nav.dailyGames },
    { id: 'markets',   icon: '📊', href: '/markets',            label: t.nav.markets },
    { id: 'news',      icon: '📰', href: '/news',               label: t.dashboard.label_news },
    { id: 'ip',        icon: '🌐', href: '/ip-address',         label: t.nav.ipAddress },
    { id: 'speed',     icon: '🚀', href: '/speed-test',         label: t.nav.speedTest },
    { id: 'password',  icon: '🔑', href: '/password-generator', label: t.nav.passwordGenerator },
    { id: 'sunrise',   icon: '🌅', href: '/sunrise-sunset',     label: t.nav.sunriseSunset },
    { id: 'bmi',       icon: '⚖️', href: '/bmi',                label: t.nav.bmi },
    { id: 'suggest',   icon: '💡', href: '/suggest',            label: t.nav.suggest ?? 'Suggest & Vote' },
  ];
}

/** True when `pathname` is `href` or one of its sub-pages (/currency/usd-eur, /time/prague → world time). */
export function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/world-time' && pathname.startsWith('/time/')) return true;
  return pathname === href || pathname.startsWith(href + '/');
}
