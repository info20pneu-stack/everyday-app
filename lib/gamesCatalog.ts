import type { Translations } from './i18n';

/* ═══════════════════════ Leaderboard config ═══════════════════════
   One entry per leaderboard game id. The API derives validation and sort order from this.
   - points + desc: higher score wins, ties broken by faster time
   - time   + asc:  lower time wins (timeMs, shown as mm:ss.ffff)
   The values for the pre-existing games reproduce the old SCORE_BASED / time-based split exactly,
   so stored Redis scores keep their meaning. */

export type ScoreType = 'points' | 'time';
export type SortOrder = 'desc' | 'asc';

export interface LeaderboardConfig {
  scoreType: ScoreType;
  order: SortOrder;
  /** Allows per-variant boards stored as `<id>_<variant>` (e.g. a region or difficulty). */
  variants?: boolean;
  /** One board per UTC day, stored as `<id>_<yyyymmdd>` (see dailyLeaderboardId). Implies variants. */
  daily?: boolean;
}

const POINTS: LeaderboardConfig = { scoreType: 'points', order: 'desc' };
const TIME: LeaderboardConfig = { scoreType: 'time', order: 'asc' };

export const LEADERBOARD_GAMES = {
  // Daily challenge + speed games
  sliding: TIME, memory: TIME, flagquiz: POINTS, wordchain: POINTS, mathrush: POINTS,
  reflex: TIME, reaction: TIME, felixjump: POINTS, typing: POINTS,
  // Retired (replaced by Sky Tower) — kept so its stored scores stay readable and in the admin summary
  stack: POINTS,
  // Human Benchmark
  hb_reaction: TIME, hb_numbermem: POINTS, hb_visualmem: POINTS, hb_verbalmem: POINTS,
  hb_seqmem: POINTS, hb_aimtrainer: TIME, hb_mentalmath: POINTS,
  // Wordle (score = 7 − guesses, so fewer guesses rank higher)
  wordle_classic: POINTS, wordle_football: POINTS, wordle_hockey: POINTS, wordle_car: POINTS,
  wordle_crypto: POINTS, wordle_animal: POINTS, wordle_plant: POINTS, wordle_city: POINTS,
  // New games
  skytower: POINTS,
  dailyblocks: { ...POINTS, variants: true, daily: true },
  higherlower: POINTS,
  connectfour: { ...TIME, variants: true },
  sudokucube: { ...TIME, variants: true },
} satisfies Record<string, LeaderboardConfig>;

export type LeaderboardGameId = keyof typeof LEADERBOARD_GAMES;

export const LEADERBOARD_GAME_IDS = Object.keys(LEADERBOARD_GAMES) as LeaderboardGameId[];

const VARIANT_RE = /^[a-z0-9]{1,16}$/;
const has = (key: string) => Object.prototype.hasOwnProperty.call(LEADERBOARD_GAMES, key);

/** Config for a leaderboard id, including variant ids like `connectfour_cz`. Null when unknown. */
export function getLeaderboardConfig(game: string): LeaderboardConfig | null {
  if (has(game)) return LEADERBOARD_GAMES[game as LeaderboardGameId];
  const cut = game.lastIndexOf('_');
  if (cut <= 0) return null;
  const base = game.slice(0, cut);
  const variant = game.slice(cut + 1);
  if (!has(base) || !VARIANT_RE.test(variant)) return null;
  const cfg: LeaderboardConfig = LEADERBOARD_GAMES[base as LeaderboardGameId];
  return cfg.variants ? cfg : null;
}

/** UTC date key `yyyy-mm-dd` — the same for every player on Earth at the same moment. */
export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Today's board id for a daily game, e.g. `dailyblocks_20261024`. */
export function dailyLeaderboardId(game: LeaderboardGameId, dayKey = utcDayKey()): string {
  return `${game}_${dayKey.replace(/-/g, '')}`;
}

/** Redis sort value — ascending order means best first. */
export function toSortValue(cfg: LeaderboardConfig, timeMs: number, score?: number): number {
  const sign = cfg.order === 'desc' ? -1 : 1;
  if (cfg.scoreType === 'points') return sign * (score ?? 0) * 1e6 + timeMs;
  return sign * timeMs;
}

/** mm:ss.ffff — ffff are ten-thousandths of a second (the API keeps 0.1 ms precision). */
export function formatTimeMs(ms: number): string {
  const tenThousandths = Math.max(0, Math.round(ms * 10));
  const totalSec = Math.floor(tenThousandths / 10000);
  const frac = tenThousandths % 10000;
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(frac).padStart(4, '0')}`;
}

/** Display value for a leaderboard entry or personal best. */
export function formatLeaderboardValue(
  cfg: LeaderboardConfig, value: { timeMs: number; score?: number }, lang = 'en',
): string {
  if (cfg.scoreType === 'time') return formatTimeMs(value.timeMs);
  return (value.score ?? 0).toLocaleString(lang);
}

/* ═══════════════════════ Game cards for /games ═══════════════════════ */

export type GameSection = 'relax' | 'mini' | 'quiz' | 'curious';
export type GameDuration = '2' | '5' | '10+';

export const GAME_SECTIONS: GameSection[] = ['relax', 'mini', 'quiz', 'curious'];
export const GAME_DURATIONS: GameDuration[] = ['2', '5', '10+'];

/** i18n path into `t`, e.g. 'games.memory' or 'gamesHub.name_skyTower'. */
export type GameTextKey =
  | `games.${Extract<keyof Translations['games'], string>}`
  | `gamesHub.${Extract<keyof Translations['gamesHub'], string>}`;

export interface CatalogGame {
  id: string;
  section: GameSection;
  duration: GameDuration;
  icon: string;
  /** Where the card leads. Ignored while `soon` is true. */
  route: string;
  nameKey: GameTextKey;
  descKey: GameTextKey;
  /** Not built yet — shown as a "Soon" card. */
  soon?: boolean;
  /** Leaderboard id the game reports to. */
  leaderboard?: LeaderboardGameId;
}

export const GAMES_CATALOG: CatalogGame[] = [
  /* ── Relax ── */
  { id: 'breathing', section: 'relax', duration: '2', icon: '🫁', route: '/relax/breathing',
    nameKey: 'gamesHub.name_breathing', descKey: 'gamesHub.desc_breathing', soon: true },

  /* ── Mini games ── */
  { id: 'sky-tower', section: 'mini', duration: '2', icon: '🗼', route: '/games/sky-tower',
    nameKey: 'gamesHub.name_skyTower', descKey: 'gamesHub.desc_skyTower', leaderboard: 'skytower' },
  { id: 'daily-blocks', section: 'mini', duration: '10+', icon: '🧱', route: '/games/daily-blocks',
    nameKey: 'gamesHub.name_dailyBlocks', descKey: 'gamesHub.desc_dailyBlocks', leaderboard: 'dailyblocks' },
  { id: 'sudoku-cube', section: 'mini', duration: '10+', icon: '🧊', route: '/games/sudoku-cube',
    nameKey: 'gamesHub.name_sudokuCube', descKey: 'gamesHub.desc_sudokuCube', soon: true, leaderboard: 'sudokucube' },
  { id: 'memory', section: 'mini', duration: '5', icon: '🃏', route: '/daily-games?play=memory',
    nameKey: 'games.memory', descKey: 'gamesHub.desc_memory', leaderboard: 'memory' },
  { id: 'sliding', section: 'mini', duration: '5', icon: '🧩', route: '/daily-games?play=sliding',
    nameKey: 'games.sliding', descKey: 'gamesHub.desc_sliding', leaderboard: 'sliding' },
  { id: 'wordchain', section: 'mini', duration: '2', icon: '📝', route: '/daily-games?play=wordchain',
    nameKey: 'games.wordchain', descKey: 'gamesHub.desc_wordchain', leaderboard: 'wordchain' },
  { id: 'felixjump', section: 'mini', duration: '2', icon: '🏃', route: '/daily-games?play=felixjump',
    nameKey: 'games.felixJump', descKey: 'gamesHub.desc_felixjump', leaderboard: 'felixjump' },
  { id: 'reaction', section: 'mini', duration: '2', icon: '⚡', route: '/daily-games?play=reaction',
    nameKey: 'games.reaction', descKey: 'gamesHub.desc_reaction', leaderboard: 'reaction' },
  { id: 'reflex', section: 'mini', duration: '2', icon: '⏱', route: '/daily-games?play=reflex',
    nameKey: 'games.reflex', descKey: 'gamesHub.desc_reflex', leaderboard: 'reflex' },

  /* ── Quizzes ── */
  { id: 'higher-lower', section: 'quiz', duration: '2', icon: '↕️', route: '/games/higher-lower',
    nameKey: 'gamesHub.name_higherLower', descKey: 'gamesHub.desc_higherLower', soon: true, leaderboard: 'higherlower' },
  { id: 'connect-four', section: 'quiz', duration: '5', icon: '🔗', route: '/games/connect-four',
    nameKey: 'gamesHub.name_connectFour', descKey: 'gamesHub.desc_connectFour', soon: true, leaderboard: 'connectfour' },
  { id: 'flagquiz', section: 'quiz', duration: '2', icon: '🌍', route: '/daily-games?play=flagquiz',
    nameKey: 'games.flagquiz', descKey: 'gamesHub.desc_flagquiz', leaderboard: 'flagquiz' },
  { id: 'mathrush', section: 'quiz', duration: '2', icon: '🔢', route: '/daily-games?play=mathrush',
    nameKey: 'games.mathrush', descKey: 'gamesHub.desc_mathrush', leaderboard: 'mathrush' },
  { id: 'wordle', section: 'quiz', duration: '5', icon: '🟩', route: '/daily-games?cat=wordle',
    nameKey: 'gamesHub.name_wordle', descKey: 'gamesHub.desc_wordle' },

  /* ── Curiosities ── */
  { id: 'human-benchmark', section: 'curious', duration: '5', icon: '🧠', route: '/daily-games?cat=hb',
    nameKey: 'gamesHub.name_humanBenchmark', descKey: 'gamesHub.desc_humanBenchmark' },
  { id: 'typing', section: 'curious', duration: '2', icon: '⌨️', route: '/daily-games?play=typing',
    nameKey: 'gamesHub.name_typing', descKey: 'gamesHub.desc_typing', leaderboard: 'typing' },
];

export function getCatalogGame(id: string): CatalogGame | undefined {
  return GAMES_CATALOG.find(g => g.id === id);
}

/** Resolves a GameTextKey against the active translations. */
export function gameText(t: Translations, key: GameTextKey): string {
  const [ns, field] = key.split('.') as ['games' | 'gamesHub', string];
  const value = (t[ns] as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : field;
}
