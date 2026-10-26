import { TIME_SLACK_MS, type LeaderboardConfig } from '../gamesCatalog';
import { buildPairs, ROUNDS as HL_ROUNDS } from '../games/higherLowerData';
import { wordleTarget } from '../games/wordleWords';
import type { Session } from './session';

/* Is a submitted result believable? Checks the real play time (server clock, from the session
   token), the limits of the game (lib/gamesCatalog.ts) and — for the daily games with a fixed
   solution — recomputes the result from the moves the client sends. */

export type Verdict =
  | { ok: true; score?: number; moves?: number }
  | { ok: false; reason: string; detail: string };

const bad = (reason: string, detail: string): Verdict => ({ ok: false, reason, detail });

const DAY_MS = 86_400_000;

/** yyyymmdd of a UTC date. */
function ymd(d: Date): number {
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/** A daily board's date must be today or yesterday (UTC). Wordle uses the player's local day, so ±1. */
function dayAllowed(day: number, now: number, wide = false): boolean {
  const days = [ymd(new Date(now)), ymd(new Date(now - DAY_MS))];
  if (wide) days.push(ymd(new Date(now + DAY_MS)));
  return days.includes(day);
}

export interface Claim {
  game: string;
  timeMs: number;
  score?: number;
  moves?: number;
  proof?: unknown;
}

export function checkResult(cfg: LeaderboardConfig, claim: Claim, session: Session, now = Date.now()): Verdict {
  const realMs = now - session.start;
  const { limits } = cfg;
  const { timeMs } = claim;

  if (!Number.isFinite(timeMs) || timeMs <= 0 || timeMs > DAY_MS * 2) return bad('bad_time', `timeMs=${timeMs}`);
  if (realMs < limits.minPlayMs) return bad('too_fast', `real ${realMs} ms < ${limits.minPlayMs} ms`);
  if (timeMs > realMs + TIME_SLACK_MS) return bad('time_exceeds_real', `claimed ${Math.round(timeMs)} ms > real ${realMs} ms`);

  // Daily boards: only today's (or yesterday's, for a game started before midnight)
  if (cfg.daily) {
    const day = Number(claim.game.slice(-8));
    if (!/_\d{8}$/.test(claim.game) || !dayAllowed(day, now)) return bad('wrong_day', claim.game);
  }

  let score = claim.score, moves = claim.moves;
  if (cfg.verified) {
    const v = verifyMoves(cfg.verified, claim, now);
    if (!v.ok) return v;
    if (v.score !== undefined) {
      if (claim.score !== undefined && claim.score !== v.score) return bad('proof_mismatch', `claimed ${claim.score}, moves give ${v.score}`);
      score = v.score;
    }
    if (v.moves !== undefined) moves = v.moves;
  }

  if (cfg.scoreType === 'time') {
    if (limits.minTimeMs !== undefined && timeMs < limits.minTimeMs) return bad('time_too_low', `${Math.round(timeMs)} ms < ${limits.minTimeMs} ms`);
  } else {
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) return bad('bad_score', `score=${String(score)}`);
    if (limits.maxScore !== undefined && score > limits.maxScore) return bad('score_too_high', `${score} > ${limits.maxScore}`);
    if (limits.maxScorePerSec !== undefined && score / Math.max(1, realMs / 1000) > limits.maxScorePerSec) {
      return bad('score_rate', `${score} in ${Math.round(realMs / 1000)} s > ${limits.maxScorePerSec}/s`);
    }
  }
  if (moves !== undefined && (!Number.isInteger(moves) || moves < 0 || moves > 100000)) return bad('bad_moves', `moves=${moves}`);
  return { ok: true, score, moves };
}

/* ── daily games with a fixed solution ── */

function verifyMoves(kind: NonNullable<LeaderboardConfig['verified']>, claim: Claim, now: number): Verdict {
  const proof = (claim.proof && typeof claim.proof === 'object' ? claim.proof : {}) as Record<string, unknown>;
  if (kind === 'wordle') return verifyWordle(claim.game, proof, now);
  if (kind === 'connectfour') return verifyConnectFour(proof);
  return verifyHigherLower(claim.game, proof);
}

/** wordle_<mode>: { day: local yyyymmdd, guesses: ["CRANE", …] } — the last guess must be the day's word. */
function verifyWordle(game: string, p: Record<string, unknown>, now: number): Verdict {
  const mode = game.replace(/^wordle_/, '');
  const day = Number(p.day);
  const guesses = p.guesses;
  if (!Number.isInteger(day) || !dayAllowed(day, now, true)) return bad('wrong_day', `wordle day ${String(p.day)}`);
  if (!Array.isArray(guesses) || guesses.length < 1 || guesses.length > 6 || !guesses.every(g => typeof g === 'string' && /^[A-Z]{5}$/.test(g))) {
    return bad('bad_proof', 'wordle guesses');
  }
  const target = wordleTarget(mode, day);
  const hit = guesses.indexOf(target);
  if (hit !== guesses.length - 1) return bad('proof_mismatch', 'wordle not solved by the last guess');
  return { ok: true, score: 7 - guesses.length, moves: guesses.length };
}

/** connectfour_<region>_<day>: { guesses: [[tile ids]] }. Tile id = group × 4 + word, so a guess
 *  is right when all four ids are in the same group. The game ends at 4 groups or 4 mistakes. */
function verifyConnectFour(p: Record<string, unknown>): Verdict {
  const guesses = p.guesses;
  if (!Array.isArray(guesses) || guesses.length < 4 || guesses.length > 7) return bad('bad_proof', 'connect four guesses');
  const solved = new Set<number>();
  const seen = new Set<string>();
  let mistakes = 0;
  for (let i = 0; i < guesses.length; i++) {
    const g = guesses[i];
    if (!Array.isArray(g) || g.length !== 4 || !g.every(x => Number.isInteger(x) && x >= 0 && x < 16) || new Set(g).size !== 4) {
      return bad('bad_proof', `guess ${i + 1}`);
    }
    const key = [...g].sort((a, b) => a - b).join('-');
    if (seen.has(key)) return bad('proof_mismatch', 'repeated guess');
    seen.add(key);
    const groups = new Set(g.map(x => Math.floor(x / 4)));
    if ([...groups].some(gr => solved.has(gr))) return bad('proof_mismatch', 'tile of a solved group');
    if (groups.size === 1) solved.add(g[0] >> 2);
    else if (++mistakes >= 4) return bad('proof_mismatch', 'lost game submitted');
    if (solved.size === 4 && i !== guesses.length - 1) return bad('proof_mismatch', 'guesses after the win');
  }
  if (solved.size !== 4) return bad('proof_mismatch', 'not solved');
  return { ok: true, moves: guesses.length };
}

/** higherlower_<yyyymmdd>: { answers: [true = "higher", …] } for the day's 10 pairs. */
function verifyHigherLower(game: string, p: Record<string, unknown>): Verdict {
  const m = /_(\d{4})(\d{2})(\d{2})$/.exec(game);
  const answers = p.answers;
  if (!m || !Array.isArray(answers) || answers.length !== HL_ROUNDS || !answers.every(a => typeof a === 'boolean')) {
    return bad('bad_proof', 'higher-lower answers');
  }
  const pairs = buildPairs(`${m[1]}-${m[2]}-${m[3]}`);
  const score = pairs.reduce((n, pr, i) => n + (answers[i] === (pr.b.value > pr.a.value) ? 1 : 0), 0);
  return { ok: true, score };
}
