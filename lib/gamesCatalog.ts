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
  /** With `daily`: one daily board per region (or other variant, e.g. a difficulty),
   *  stored as `<id>_<region>_<yyyymmdd>`. */
  regional?: boolean;
  /** Plausibility limits checked by the server before a score is saved (lib/antiCheat). */
  limits: ScoreLimits;
  /** The server recomputes the result from the moves the client sends (daily games with a fixed solution). */
  verified?: 'wordle' | 'connectfour' | 'higherlower';
}

/* ═══════════════════════ Anti-cheat limits ═══════════════════════
   Every save needs a session token from POST /api/game/start. "Real time" is the time between
   that call and the save, measured on the server. The token is fetched when the game page opens,
   so the real time is never shorter than the round itself. */
export interface ScoreLimits {
  /** Shortest believable real time of one round (ms). */
  minPlayMs: number;
  /** Time games: fastest believable result (ms). */
  minTimeMs?: number;
  /** Points games: highest believable score. */
  maxScore?: number;
  /** Points games: highest believable score per second of real time. */
  maxScorePerSec?: number;
}

/** The claimed time may exceed the real time only by this much (clock and network jitter). */
export const TIME_SLACK_MS = 5000;

const POINTS = { scoreType: 'points', order: 'desc' } as const;
const TIME = { scoreType: 'time', order: 'asc' } as const;

function time(minPlayMs: number, minTimeMs: number, extra: Partial<LeaderboardConfig> = {}): LeaderboardConfig {
  return { ...TIME, limits: { minPlayMs, minTimeMs }, ...extra };
}
function points(minPlayMs: number, maxScore: number, maxScorePerSec: number, extra: Partial<LeaderboardConfig> = {}): LeaderboardConfig {
  return { ...POINTS, limits: { minPlayMs, maxScore, maxScorePerSec }, ...extra };
}
const wordle = () => points(3000, 6, 2, { verified: 'wordle' });

export const LEADERBOARD_GAMES = {
  /* Daily challenge + speed games */
  sliding: time(3000, 3000),               // the small board can be solved in a few seconds
  memory: time(5000, 5000),                // 4×4 = 8 pairs, at least 16 flips with animations
  flagquiz: points(5000, 10, 1),           // 10 questions, 1 point each
  wordchain: points(2000, 1000, 3),        // words clicked in order; sequences get longer
  mathrush: points(58000, 200, 3),         // fixed 60 s round
  reflex: time(20000, 5),                  // 5 × stopping a timer at 5 s; average deviation (ms)
  reaction: time(5000, 100),               // average of 5 reactions; under 100 ms is not human
  felixjump: points(1000, 100000, 11),     // 10 points per second survived
  typing: points(14000, 250, 25),          // WPM over a 15–120 s test
  // Retired (replaced by Sky Tower) — kept so its stored scores stay readable and in the admin summary
  stack: points(2000, 500, 3),
  /* Human Benchmark */
  hb_reaction: time(5000, 100),
  hb_numbermem: points(3000, 40, 1),       // digits remembered
  hb_visualmem: points(3000, 50, 0.5),     // level reached
  hb_verbalmem: points(2000, 1000, 2),     // words
  hb_seqmem: points(3000, 60, 0.5),        // sequence length
  hb_aimtrainer: time(4000, 4500),         // 30 targets, total time
  hb_mentalmath: points(58000, 200, 3),    // fixed 60 s
  /* Wordle (score = 7 − guesses, so fewer guesses rank higher); the server checks the guesses */
  wordle_classic: wordle(), wordle_football: wordle(), wordle_hockey: wordle(), wordle_car: wordle(),
  wordle_crypto: wordle(), wordle_animal: wordle(), wordle_plant: wordle(), wordle_city: wordle(),
  /* New games */
  skytower: points(2000, 3000, 3),         // floors; at most a block every ~0.35 s
  dailyblocks: points(5000, 5_000_000, 6000, { variants: true, daily: true }), // up to 800 × level per tetris
  higherlower: points(8000, 10, 1, { variants: true, daily: true, verified: 'higherlower' }), // 10 animated reveals
  // One daily board per region: connectfour_<region>_<yyyymmdd>
  connectfour: time(6000, 6000, { variants: true, daily: true, regional: true, verified: 'connectfour' }),
  // One daily board per difficulty: sudokucube_<easy|mid|hard>_<yyyymmdd>
  sudokucube: time(8000, 8000, { variants: true, daily: true, regional: true }),
} satisfies Record<string, LeaderboardConfig>;

export type LeaderboardGameId = keyof typeof LEADERBOARD_GAMES;

export const LEADERBOARD_GAME_IDS = Object.keys(LEADERBOARD_GAMES) as LeaderboardGameId[];

const VARIANT_RE = /^[a-z0-9]{1,16}$/;
const has = (key: string) => Object.prototype.hasOwnProperty.call(LEADERBOARD_GAMES, key);

/** Config for a leaderboard id, including variant ids like `dailyblocks_20261024`
 *  or `connectfour_cz_20261024` (region + day). Null when unknown. */
export function getLeaderboardConfig(game: string): LeaderboardConfig | null {
  if (has(game)) return LEADERBOARD_GAMES[game as LeaderboardGameId];
  const parts = game.split('_');
  // Try one variant segment, then two (a daily board of a game with regions)
  for (const n of [1, 2]) {
    if (parts.length <= n) break;
    const base = parts.slice(0, -n).join('_');
    const variants = parts.slice(-n);
    if (!has(base) || !variants.every(v => VARIANT_RE.test(v))) continue;
    const cfg: LeaderboardConfig = LEADERBOARD_GAMES[base as LeaderboardGameId];
    if (n === 1 && cfg.variants && !cfg.regional) return cfg;
    if (n === 2 && cfg.daily && cfg.regional) return cfg;
  }
  return null;
}

/** UTC date key `yyyy-mm-dd` — the same for every player on Earth at the same moment. */
export function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Today's board id for a daily game, e.g. `dailyblocks_20261024`. */
export function dailyLeaderboardId(game: LeaderboardGameId, dayKey = utcDayKey()): string {
  return `${game}_${dayKey.replace(/-/g, '')}`;
}

/** Today's board for one variant of a daily game, e.g. `connectfour_cz_20261024`. */
export function dailyVariantLeaderboardId(game: LeaderboardGameId, variant: string, dayKey = utcDayKey()): string {
  return `${game}_${variant}_${dayKey.replace(/-/g, '')}`;
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
  | `gamesHub.${Extract<keyof Translations['gamesHub'], string>}`
  | `dailyPuzzle.${Extract<keyof Translations['dailyPuzzle'], string>}`;

export interface CatalogGame {
  id: string;
  section: GameSection;
  duration: GameDuration;
  icon: string;
  /** Accent colour of the game: banner gradient, icon glow and page glow (see GameFrame). */
  color: string;
  /** Day the game was added (YYYY-MM-DD); the games page marks it "New" for 14 days. */
  addedAt?: string;
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
  { id: 'breathing', section: 'relax', duration: '2', icon: '🫁', color: '#14B8A6', addedAt: '2026-10-26', route: '/relax/breathing',
    nameKey: 'gamesHub.name_breathing', descKey: 'gamesHub.desc_breathing' },

  /* ── Mini games ── */
  { id: 'sky-tower', section: 'mini', duration: '2', icon: '🗼', color: '#FFC94D', addedAt: '2026-10-24', route: '/games/sky-tower',
    nameKey: 'gamesHub.name_skyTower', descKey: 'gamesHub.desc_skyTower', leaderboard: 'skytower' },
  { id: 'daily-blocks', section: 'mini', duration: '10+', icon: '🧱', color: '#38BDF8', addedAt: '2026-10-24', route: '/games/daily-blocks',
    nameKey: 'gamesHub.name_dailyBlocks', descKey: 'gamesHub.desc_dailyBlocks', leaderboard: 'dailyblocks' },
  { id: 'sudoku-cube', section: 'mini', duration: '10+', icon: '🧊', color: '#40AAFF', addedAt: '2026-10-26', route: '/games/sudoku-cube',
    nameKey: 'gamesHub.name_sudokuCube', descKey: 'gamesHub.desc_sudokuCube', leaderboard: 'sudokucube' },
  { id: 'memory', section: 'mini', duration: '5', icon: '🃏', color: '#A78BFA', addedAt: '2026-05-24', route: '/daily-games?play=memory',
    nameKey: 'games.memory', descKey: 'gamesHub.desc_memory', leaderboard: 'memory' },
  { id: 'sliding', section: 'mini', duration: '5', icon: '🧩', color: '#F472B6', addedAt: '2026-05-24', route: '/daily-games?play=sliding',
    nameKey: 'games.sliding', descKey: 'gamesHub.desc_sliding', leaderboard: 'sliding' },
  { id: 'wordchain', section: 'mini', duration: '2', icon: '📝', color: '#34D399', addedAt: '2026-05-24', route: '/daily-games?play=wordchain',
    nameKey: 'games.wordchain', descKey: 'gamesHub.desc_wordchain', leaderboard: 'wordchain' },
  { id: 'felixjump', section: 'mini', duration: '2', icon: '🏃', color: '#FB923C', addedAt: '2026-05-24', route: '/daily-games?play=felixjump',
    nameKey: 'games.felixJump', descKey: 'gamesHub.desc_felixjump', leaderboard: 'felixjump' },
  { id: 'reaction', section: 'mini', duration: '2', icon: '⚡', color: '#FACC15', addedAt: '2026-05-24', route: '/daily-games?play=reaction',
    nameKey: 'games.reaction', descKey: 'gamesHub.desc_reaction', leaderboard: 'reaction' },
  { id: 'reflex', section: 'mini', duration: '2', icon: '⏱', color: '#F87171', addedAt: '2026-05-24', route: '/daily-games?play=reflex',
    nameKey: 'games.reflex', descKey: 'gamesHub.desc_reflex', leaderboard: 'reflex' },

  /* ── Quizzes ── */
  { id: 'daily-puzzle', section: 'quiz', duration: '2', icon: '🧩', color: '#2FE39A', addedAt: '2026-10-15', route: '/games/daily-puzzle',
    nameKey: 'dailyPuzzle.title', descKey: 'dailyPuzzle.subtitle' },
  { id: 'higher-lower', section: 'quiz', duration: '2', icon: '↕️', color: '#8B5CF6', addedAt: '2026-10-25', route: '/games/higher-lower',
    nameKey: 'gamesHub.name_higherLower', descKey: 'gamesHub.desc_higherLower', leaderboard: 'higherlower' },
  { id: 'connect-four', section: 'quiz', duration: '5', icon: '🔗', color: '#8B5CF6', addedAt: '2026-10-25', route: '/games/connect-four',
    nameKey: 'gamesHub.name_connectFour', descKey: 'gamesHub.desc_connectFour', leaderboard: 'connectfour' },
  { id: 'flagquiz', section: 'quiz', duration: '2', icon: '🌍', color: '#22D3EE', addedAt: '2026-05-24', route: '/daily-games?play=flagquiz',
    nameKey: 'games.flagquiz', descKey: 'gamesHub.desc_flagquiz', leaderboard: 'flagquiz' },
  { id: 'mathrush', section: 'quiz', duration: '2', icon: '🔢', color: '#FB7185', addedAt: '2026-05-24', route: '/daily-games?play=mathrush',
    nameKey: 'games.mathrush', descKey: 'gamesHub.desc_mathrush', leaderboard: 'mathrush' },
  { id: 'wordle', section: 'quiz', duration: '5', icon: '🟩', color: '#22C55E', addedAt: '2026-05-30', route: '/daily-games?cat=wordle',
    nameKey: 'gamesHub.name_wordle', descKey: 'gamesHub.desc_wordle' },

  /* ── Curiosities ── */
  { id: 'human-benchmark', section: 'curious', duration: '5', icon: '🧠', color: '#3B82F6', addedAt: '2026-05-29', route: '/daily-games?cat=hb',
    nameKey: 'gamesHub.name_humanBenchmark', descKey: 'gamesHub.desc_humanBenchmark' },
  { id: 'typing', section: 'curious', duration: '2', icon: '⌨️', color: '#818CF8', addedAt: '2026-06-01', route: '/daily-games?play=typing',
    nameKey: 'gamesHub.name_typing', descKey: 'gamesHub.desc_typing', leaderboard: 'typing' },
];

export function getCatalogGame(id: string): CatalogGame | undefined {
  return GAMES_CATALOG.find(g => g.id === id);
}

/** Resolves a GameTextKey against the active translations. */
export function gameText(t: Translations, key: GameTextKey): string {
  const [ns, field] = key.split('.') as ['games' | 'gamesHub' | 'dailyPuzzle', string];
  const value = (t[ns] as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : field;
}

/** True for 14 days after the game's addedAt. */
export function isNewGame(g: CatalogGame, now = Date.now()): boolean {
  if (!g.addedAt) return false;
  const added = Date.parse(`${g.addedAt}T00:00:00Z`);
  return now - added >= 0 && now - added < 14 * 86_400_000;
}
