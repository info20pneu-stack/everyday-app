import type { Translations } from '../i18n';
import {
  GAMES_CATALOG, LEADERBOARD_GAMES, gameText, getLeaderboardConfig, toSortValue, type CatalogGame, type LeaderboardGameId,
} from '../gamesCatalog';

/* What a shared result belongs to: the game (name, icon, colour, page) behind a leaderboard id,
   the "accept the challenge" link and the way its value is written. Used by the API, the
   /s/<id> page, the preview image and the share window. */

const has = (key: string) => Object.prototype.hasOwnProperty.call(LEADERBOARD_GAMES, key);

/** The base leaderboard id without variant / day: `connectfour_cz_20261024` → `connectfour`. */
export function baseBoard(board: string): LeaderboardGameId | null {
  if (has(board)) return board as LeaderboardGameId;
  const parts = board.split('_');
  for (const n of [1, 2]) {
    const base = parts.slice(0, -n).join('_');
    if (base && has(base)) return base as LeaderboardGameId;
  }
  return null;
}

/** `yyyy-mm-dd` of a daily board, else null. */
export function boardDay(board: string): string | null {
  const m = /_(\d{4})(\d{2})(\d{2})$/.exec(board);
  const cfg = getLeaderboardConfig(board);
  return m && cfg?.daily ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Region / level of a daily board with variants (`connectfour_cz_20261024` → `cz`). */
export function boardVariant(board: string): string | null {
  const cfg = getLeaderboardConfig(board);
  if (!cfg?.regional) return null;
  const parts = board.split('_');
  return parts.length >= 3 ? parts[parts.length - 2] : null;
}

/** The same board on another day (`dailyblocks_20261024` → today's). */
export function boardOnDay(board: string, dayKey: string): string {
  return board.replace(/_\d{8}$/, `_${dayKey.replace(/-/g, '')}`);
}

const WORDLE_ICON: Record<string, string> = {
  classic: '🔤', football: '⚽', hockey: '🏒', car: '🚗', crypto: '₿', animal: '🦁', plant: '🌿', city: '🌆',
};
const HB_TESTS: Record<string, { icon: string; name: string }> = {
  reaction: { icon: '⚡', name: 'Reaction Time' },
  numbermem: { icon: '🔢', name: 'Number Memory' },
  visualmem: { icon: '👁', name: 'Visual Memory' },
  verbalmem: { icon: '📖', name: 'Verbal Memory' },
  seqmem: { icon: '🎵', name: 'Sequence Memory' },
  aimtrainer: { icon: '🎯', name: 'Aim Trainer' },
  mentalmath: { icon: '🧮', name: 'Mental Math' },
};

export interface ShareGame {
  /** Catalog entry the board belongs to. */
  catalog: CatalogGame;
  icon: string;
  color: string;
  /** Page the "accept the challenge" button opens (without the challenge id). */
  route: string;
  name: (t: Translations) => string;
}

function catalog(id: string): CatalogGame {
  return GAMES_CATALOG.find(g => g.id === id) ?? GAMES_CATALOG[0];
}

export function shareGame(board: string): ShareGame | null {
  const base = baseBoard(board);
  if (!base) return null;
  if (base.startsWith('wordle_')) {
    const mode = base.slice(7);
    const c = catalog('wordle');
    return {
      catalog: c, icon: WORDLE_ICON[mode] ?? c.icon, color: c.color,
      route: `/daily-games?cat=wordle&mode=${mode}`,
      name: t => {
        const v = (t.wordle as Record<string, unknown>)[`var_${mode}`];
        return typeof v === 'string' ? `Wordle · ${v}` : 'Wordle';
      },
    };
  }
  if (base.startsWith('hb_')) {
    const test = base.slice(3);
    const c = catalog('human-benchmark');
    const info = HB_TESTS[test];
    return {
      catalog: c, icon: info?.icon ?? c.icon, color: c.color,
      route: `/daily-games?cat=hb&test=${test}`,
      name: () => info?.name ?? 'Human Benchmark',
    };
  }
  const daily = GAMES_CATALOG.find(g => g.dailyLeaderboard === base);
  if (daily) {
    return { catalog: daily, icon: daily.icon, color: daily.color, route: `${daily.route}?mode=daily`, name: t => gameText(t, daily.nameKey) };
  }
  const c = GAMES_CATALOG.find(g => g.leaderboard === base) ?? (base === 'stack' ? catalog('sky-tower') : null);
  if (!c) return null;
  return { catalog: c, icon: c.icon, color: c.color, route: c.route, name: t => gameText(t, c.nameKey) };
}

/** Link of the "accept the challenge" button. */
export function challengeHref(board: string, id: string): string {
  const g = shareGame(board);
  const route = g?.route ?? '/games';
  return `${route}${route.includes('?') ? '&' : '?'}ch=${encodeURIComponent(id)}`;
}

export interface ShareValue { timeMs: number; score?: number; moves?: number }

/** 45.23 s / 1:23.45 */
export function shortTime(ms: number): string {
  const cs = Math.max(0, Math.round(ms / 10));
  const s = Math.floor(cs / 100), frac = String(cs % 100).padStart(2, '0');
  if (s < 60) return `${s}.${frac} s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${frac}`;
}

/** The result as people read it: "4/6", "212 ms", "1:23.45", "58 WPM", "12 340". */
export function formatShareValue(board: string, v: ShareValue, lang = 'en'): string {
  const base = baseBoard(board) ?? '';
  const cfg = getLeaderboardConfig(board);
  if (base.startsWith('wordle_')) return `${v.moves ?? 7 - (v.score ?? 0)}/6`;
  if (base === 'reflex') return `±${Math.round(v.timeMs)} ms`;
  if (base === 'reaction' || base === 'hb_reaction') return `${Math.round(v.timeMs)} ms`;
  if (base === 'typing') return `${v.score ?? 0} WPM`;
  if (base === 'higherlower' || base === 'flagquiz') return `${v.score ?? 0}/10`;
  if (cfg?.scoreType === 'time') return shortTime(v.timeMs);
  return (v.score ?? 0).toLocaleString(lang);
}

/** Is the value a time (lower wins)? */
export function isTimeBoard(board: string): boolean {
  return getLeaderboardConfig(board)?.scoreType === 'time';
}

/** -1 when `a` is better than `b`, 1 when worse, 0 for a tie (same rules as the leaderboard). */
export function compareResults(board: string, a: ShareValue, b: ShareValue): number {
  const cfg = getLeaderboardConfig(board);
  if (!cfg) return 0;
  const base = baseBoard(board) ?? '';
  // Ties on points are decided by time on the leaderboard; a challenge compares the points only
  // when the time is just the length of the round
  const pointsOnly = cfg.scoreType === 'points' && ['mathrush', 'hb_mentalmath', 'typing', 'felixjump'].includes(base);
  const sa = pointsOnly ? -(a.score ?? 0) : toSortValue(cfg, a.timeMs, a.score);
  const sb = pointsOnly ? -(b.score ?? 0) : toSortValue(cfg, b.timeMs, b.score);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}
