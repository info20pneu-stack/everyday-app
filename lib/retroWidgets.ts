import type { Translations } from './i18n';

export type RetroWidget = {
  id: string;
  icon: string;
  labelKey: keyof Translations['dashboard'];
  href: string;
};

export const RETRO_WIDGETS: RetroWidget[] = [
  { id: 'worldTime',      icon: '🕐', labelKey: 'label_worldTime',      href: '/world-time' },
  { id: 'currency',       icon: '💵', labelKey: 'label_currency',       href: '/currency' },
  { id: 'unitConverter',  icon: '📏', labelKey: 'label_unitConverter',  href: '/unit-converter' },
  { id: 'dateCounter',    icon: '📅', labelKey: 'label_dateCounter',    href: '/date-counter' },
  { id: 'weather',        icon: '🌤️', labelKey: 'label_weather',        href: '/weather' },
  { id: 'ageCalculator',  icon: '👤', labelKey: 'label_ageCalculator',  href: '/age-calculator' },
  { id: 'sports',         icon: '🏆', labelKey: 'label_sports',         href: '/sports' },
  { id: 'rankings',       icon: '📈', labelKey: 'label_rankings',       href: '/rankings' },
  { id: 'crypto',         icon: '₿',  labelKey: 'label_crypto',         href: '/crypto' },
  { id: 'dailyBoost',     icon: '⚡', labelKey: 'label_dailyBoost',     href: '/daily-boost' },
  { id: 'dailyGames',     icon: '🎮', labelKey: 'label_dailyGames',     href: '/daily-games' },
  { id: 'markets',        icon: '📊', labelKey: 'label_markets',        href: '/markets' },
  { id: 'ipAddress',      icon: '🌐', labelKey: 'label_ipAddress',      href: '/ip-address' },
  { id: 'speedTest',      icon: '🚀', labelKey: 'label_speedTest',      href: '/speed-test' },
  { id: 'passwordGen',    icon: '🔑', labelKey: 'label_passwordGen',    href: '/password-generator' },
  { id: 'sunriseSunset',  icon: '🌅', labelKey: 'label_sunriseSunset',  href: '/sunrise-sunset' },
  { id: 'bmi',            icon: '⚖️', labelKey: 'label_bmi',            href: '/bmi' },
  { id: 'suggestVote',    icon: '💡', labelKey: 'label_suggestVote',    href: '/suggest' },
];

export function findRetroWidgetByHref(pathname: string): RetroWidget | undefined {
  return RETRO_WIDGETS.find(w => pathname === w.href || pathname.startsWith(w.href + '/'));
}
