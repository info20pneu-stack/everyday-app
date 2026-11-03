/* Shells (Skořápky) — rules shared by the game and the server. Ported from games-reference/shells.
   Every game runs on a seeded random generator: the daily challenge uses the UTC date (the same
   ball positions and swaps for everybody), a normal game a random seed that travels with a
   challenge link, so a friend gets the same shuffles. */

export interface LevelCfg {
  /** Number of cups: 3, from level 6 four, from level 11 five. */
  n: 3 | 4 | 5;
  swaps: number;
  /** Length of one swap (ms). */
  dur: number;
}

export function levelCfg(level: number): LevelCfg {
  return {
    n: level < 6 ? 3 : level < 11 ? 4 : 5,
    swaps: Math.min(4 + level, 22),
    dur: Math.max(190, 600 - level * 26),
  };
}

/** Speed indicator, 1–5 dots. */
export function speedDots(level: number): number {
  return Math.min(5, 1 + Math.floor((level - 1) / 3));
}

export const LIVES = 3;
export const SLOWS = 2;
export const HINTS = 1;
export const BASE_POINTS = 100;
export const MAX_MULT = 5;
/** Highest believable number of cleared levels. */
export const MAX_LEVELS = 150;

/** Points for a right guess: 100 × streak multiplier (max ×5), half with the hint. */
export function pointsFor(streak: number, hinted: boolean): number {
  return Math.round(BASE_POINTS * Math.min(MAX_MULT, 1 + streak) * (hinted ? 0.5 : 1));
}

/* ── seeded random ── */

export function mulberry(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str: string): number {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Seed of the daily challenge (`yyyy-mm-dd`, UTC). */
export const dailySeed = (dayKey: string) => hashSeed(`everyday-skorapky-${dayKey}`);

/* ── timing (anti-cheat) ── */

/** Ball shown under the lifted cup before the shuffle (ms). */
export const SHOW_MS = 150 + 1000 + 380;

/** Shortest possible length of one round (show + all swaps at full speed). */
export function minRoundMs(level: number): number {
  const c = levelCfg(level);
  return SHOW_MS + c.swaps * c.dur;
}

/** Server check of a claimed result (`moves` = levels cleared). Null when believable. */
export function checkShells({ score, moves, realMs }: { score: number; moves?: number; realMs: number }): string | null {
  if (moves === undefined || !Number.isInteger(moves) || moves < 0 || moves > MAX_LEVELS) return `levels=${String(moves)}`;
  if (score % 50 !== 0) return `score ${score} not a multiple of 50`;
  // every cleared level gives 50 (hint, no streak) … 500 points (×5)
  if (score < moves * 50 || score > moves * BASE_POINTS * MAX_MULT) return `score ${score} for ${moves} levels`;
  let min = 0;
  for (let l = 1; l <= moves; l++) min += minRoundMs(l);
  min = Math.floor(min * 0.85);
  if (realMs < min) return `${moves} levels need ${min} ms, real ${realMs} ms`;
  return null;
}
