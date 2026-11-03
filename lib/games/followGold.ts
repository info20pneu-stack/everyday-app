/* Follow the Gold (Sleduj zlatou) — progression shared by the game and the server.
   Ported from games-reference/follow-gold: everything grows smoothly with the round. */

export interface Ring { n: number; r: number; off: number }

/** Ball layouts on concentric rings: 6 → 10 → 14 balls. */
export const LAYOUTS: Record<6 | 10 | 14, Ring[]> = {
  6: [{ n: 6, r: 0.6, off: -Math.PI / 2 }],
  10: [{ n: 4, r: 0.3, off: Math.PI / 4 }, { n: 6, r: 0.66, off: -Math.PI / 2 }],
  14: [{ n: 4, r: 0.24, off: Math.PI / 4 }, { n: 4, r: 0.47, off: 0 }, { n: 6, r: 0.73, off: -Math.PI / 2 }],
};

export interface RoundCfg {
  count: 6 | 10 | 14;
  /** Number of shuffle moves. */
  moves: number;
  /** Length of one move (ms): 760 → ~260. */
  dur: number;
  /** Most simultaneous swaps / rotations in one move. */
  ops: number;
  /** Chance that an operation rotates a whole ring. */
  rotP: number;
  /** Countdown step (ms). */
  step: number;
}

export function roundCfg(round: number): RoundCfg {
  const k = round - 1;
  return {
    count: round <= 6 ? 6 : round <= 13 ? 10 : 14,
    moves: Math.min(24, Math.round(4 + k * 0.75)),
    dur: Math.round(260 + 500 * Math.exp(-k / 9)),
    ops: round < 8 ? 1 : round < 15 ? 2 : 3,
    rotP: Math.min(0.45, 0.2 + k * 0.02),
    step: Math.round(560 + 300 * Math.exp(-k / 8)),
  };
}

/** 0 easy, 1 medium, 2 hard, 3 very hard. */
export function tierIndex(round: number): 0 | 1 | 2 | 3 {
  return round <= 4 ? 0 : round <= 9 ? 1 : round <= 15 ? 2 : 3;
}

/** Fade of the gold ball into the decoys (ms). */
export const BLEND_MS = 350;
export const MAX_LIVES = 3;
/** Highest believable score (rounds cleared). */
export const MAX_ROUNDS = 60;

/** Shortest possible play time of one round: countdown + fade + all moves. */
export function minRoundMs(round: number): number {
  const c = roundCfg(round);
  return 3 * c.step + BLEND_MS + c.moves * c.dur;
}

/** Shortest believable real time for `score` cleared rounds (anti-cheat), with 15 % slack. */
export function minPlayMsForScore(score: number): number {
  let ms = 0;
  for (let r = 1; r <= Math.min(score, MAX_ROUNDS); r++) ms += minRoundMs(r);
  return Math.floor(ms * 0.85);
}
