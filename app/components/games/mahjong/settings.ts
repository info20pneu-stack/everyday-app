import type { SetId } from '../../../../lib/games/mahjongSymbols';
import type { SkinId, TableId } from '../../../../lib/games/mahjongI18n';
import { SKIN_IDS, TABLE_IDS } from './theme';

/* Mahjong settings and progress, kept in localStorage (`everyday-mahjong-v1`, as in the original). */

export interface MjSettings {
  set: SetId | 'mix';
  mix: SetId[];
  sound: boolean;
  skin: SkinId;
  table: TableId;
  dim: boolean;
  /** Level → best stars and score. */
  levels: Record<string, { stars: number; best: number }>;
  /** UTC day → best time (ms) and score of the daily challenge. */
  daily: Record<string, { ms: number; score: number }>;
  streak: number;
  lastDaily: string | null;
  /** UTC day of the first daily attempt (only that one goes to the leaderboard). */
  dailyTried: string | null;
}

const KEY = 'everyday-mahjong-v1';

export const DEFAULT_SETTINGS: MjSettings = {
  set: 'mahjong', mix: ['mahjong', 'karty', 'vlajky'], sound: true, skin: 'porcelan', table: 'more', dim: true,
  levels: {}, daily: {}, streak: 0, lastDaily: null, dailyTried: null,
};

export function loadSettings(): MjSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<MjSettings> & { daily?: Record<string, unknown> } | null;
    if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
    const s: MjSettings = { ...DEFAULT_SETTINGS, ...raw } as MjSettings;
    if (!SKIN_IDS.includes(s.skin)) s.skin = 'porcelan';
    if (!TABLE_IDS.includes(s.table)) s.table = 'more';
    // Old format stored the daily best as a number (score)
    const daily: MjSettings['daily'] = {};
    Object.entries(raw.daily ?? {}).forEach(([k, v]) => {
      if (v && typeof v === 'object' && typeof (v as { ms?: unknown }).ms === 'number') daily[k] = v as { ms: number; score: number };
    });
    s.daily = daily;
    return s;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: MjSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export function totalStars(s: MjSettings): number {
  return Object.values(s.levels).reduce((a, l) => a + (l.stars || 0), 0);
}

export function levelUnlocked(s: MjSettings, n: number): boolean {
  return n === 1 || (s.levels[n - 1]?.stars ?? 0) > 0;
}

/** mm:ss */
export function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
