import type { Translations } from './i18n';

type DashKey = keyof Translations['dashboard'];

export type ToolEntry = {
  /** Also the image name: public/images/cards/<id>.webp */
  id: string;
  color: string;
  icon: string;
  href: string;
  labelKey: DashKey;
  descKey: DashKey;
};

/** Dashboard tool cards, in display order. */
export const TOOLS: ToolEntry[] = [
  { id: 'hry',        color: '#3B82F6', icon: '🎮', href: '/games',              labelKey: 'label_dailyGames',     descKey: 'desc_dailyGames' },
  { id: 'boost',      color: '#F59E0B', icon: '⚡', href: '/daily-boost',        labelKey: 'label_dailyBoost',     descKey: 'desc_dailyBoost' },
  { id: 'zebricky',   color: '#8B5CF6', icon: '📈', href: '/rankings',           labelKey: 'label_rankings',       descKey: 'desc_rankings' },
  { id: 'vek',        color: '#3B82F6', icon: '👤', href: '/age-calculator',     labelKey: 'label_ageCalculator',  descKey: 'desc_ageCalculator' },
  { id: 'dny',        color: '#F97316', icon: '📅', href: '/date-counter',       labelKey: 'label_dateCounter',    descKey: 'desc_dateCounter' },
  { id: 'prevodnik',  color: '#EAB308', icon: '📐', href: '/unit-converter',     labelKey: 'label_unitConverter',  descKey: 'desc_unitConverter' },
  { id: 'zpravy',     color: '#3B82F6', icon: '📰', href: '/news',               labelKey: 'label_news',           descKey: 'desc_news' },
  { id: 'narozeniny', color: '#D946EF', icon: '🎂', href: '/celebrity-birthdays', labelKey: 'label_celebBirthdays', descKey: 'desc_celebBirthdays' },
  { id: 'slunce',     color: '#F97316', icon: '🌅', href: '/sunrise-sunset',     labelKey: 'label_sunriseSunset',  descKey: 'desc_sunriseSunset' },
  { id: 'ip',         color: '#0EA5E9', icon: '🌐', href: '/ip-address',         labelKey: 'label_ipAddress',      descKey: 'desc_ipAddress' },
  { id: 'rychlost',   color: '#8B5CF6', icon: '🚀', href: '/speed-test',         labelKey: 'label_speedTest',      descKey: 'desc_speedTest' },
  { id: 'hesla',      color: '#EAB308', icon: '🔑', href: '/password-generator', labelKey: 'label_passwordGen',    descKey: 'desc_passwordGen' },
  /* Other existing tools — no illustration yet, they use the fallback */
  { id: 'cas',        color: '#6366F1', icon: '🕐', href: '/world-time',         labelKey: 'label_worldTime',      descKey: 'desc_worldTime' },
  { id: 'meny',       color: '#22C55E', icon: '💵', href: '/currency',           labelKey: 'label_currency',       descKey: 'desc_currency' },
  { id: 'pocasi',     color: '#38BDF8', icon: '🌤️', href: '/weather',            labelKey: 'label_weather',        descKey: 'desc_weather' },
  { id: 'sport',      color: '#EF4444', icon: '🏆', href: '/sports',             labelKey: 'label_sports',         descKey: 'desc_sports' },
  { id: 'krypto',     color: '#F7931A', icon: '₿',  href: '/crypto',             labelKey: 'label_crypto',         descKey: 'desc_crypto' },
  { id: 'trhy',       color: '#10B981', icon: '📊', href: '/markets',            labelKey: 'label_markets',        descKey: 'desc_markets' },
  { id: 'bmi',        color: '#14B8A6', icon: '⚖️', href: '/bmi',                labelKey: 'label_bmi',            descKey: 'desc_bmi' },
  { id: 'navrhy',     color: '#FACC15', icon: '💡', href: '/suggest',            labelKey: 'label_suggestVote',    descKey: 'desc_suggestVote' },
];

/** Ad banner goes after this many cards. */
export const TOOLS_AD_AFTER = 8;
