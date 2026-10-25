import type { Lang } from './i18n';
import { getDailyPuzzleWords } from './dailyPuzzleWords';
import { utcDayKey, dailyLeaderboardId } from './gamesCatalog';

/* Today's state of the three daily games, read from what the games already save in localStorage.
   Used by the "Today's Trio" cards on the dashboard. Browser only. */

/* ── Daily Puzzle (Wordle) ── keys shared with app/components/DailyPuzzle.tsx */
export const PUZZLE_EPOCH_UTC = Date.UTC(2026, 0, 1); // Puzzle #1
export const PUZZLE_STATE_KEY = 'daily_puzzle_state_v1';
export const PUZZLE_STATS_KEY = 'daily_puzzle_stats_v1';
export const PUZZLE_MAX = 6;

export function puzzleDayIndex(now = Date.now()): number {
  return Math.floor((now - PUZZLE_EPOCH_UTC) / 86400000);
}

/* ── Higher or Lower ── keys shared with app/components/games/HigherLower.tsx */
export const HL_BEST_KEY = 'vn-best';
export const HL_DAYS_KEY = 'vn-days';
export const hlDoneKey = (day: string) => `vn-done-${day}`;

/* ── Daily Blocks ── GameShell keeps the best score per daily board: everyday-best-<board id> */
const blocksBestKey = (day: string) => `everyday-best-${dailyLeaderboardId('dailyblocks', day)}`;

/** Rank saved by the score form after submitting to a leaderboard (see ScoreSubmitModal). */
export const rankKey = (board: string) => `everyday-rank-${board}`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch { return null; }
}

function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDayKey(d);
}

export type TrioStatus = {
  done: boolean;
  /** Day streak (0 = none) */
  streak: number;
  /** Today's rank on the daily leaderboard, when the player submitted a score */
  rank: number | null;
};

export type PuzzleStatus = TrioStatus & {
  number: number;
  won: boolean;
  attempts: number;
  /** 🟩🟨⬛ rows, for sharing */
  grid: string;
};
export type HLStatus = TrioStatus & { score: number; results: boolean[] };
export type BlocksStatus = TrioStatus & { score: number };

function evaluate(guess: string, target: string): ('correct' | 'present' | 'absent')[] {
  const result: ('correct' | 'present' | 'absent')[] = Array(5).fill('absent');
  const remaining = target.split('');
  for (let i = 0; i < 5; i++) if (guess[i] === target[i]) { result[i] = 'correct'; remaining[i] = ''; }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'absent') continue;
    const j = remaining.indexOf(guess[i]);
    if (j !== -1) { result[i] = 'present'; remaining[j] = ''; }
  }
  return result;
}

export function readPuzzle(): PuzzleStatus {
  const dayIndex = puzzleDayIndex();
  const number = dayIndex + 1;
  const state = read<{ puzzleNum: number; lang: string; guesses: string[]; phase: string }>(PUZZLE_STATE_KEY);
  const stats = read<{ currentStreak: number; lastPuzzleNum: number }>(PUZZLE_STATS_KEY);
  // The streak is still alive when the last finished puzzle is today's or yesterday's
  const streak = stats && stats.lastPuzzleNum >= number - 1 ? stats.currentStreak : 0;
  const finished = !!state && state.puzzleNum === number && (state.phase === 'won' || state.phase === 'lost');
  if (!finished) return { number, done: false, won: false, attempts: 0, grid: '', streak, rank: null };

  const words = getDailyPuzzleWords(state.lang as Lang);
  const target = words[((dayIndex % words.length) + words.length) % words.length].toUpperCase();
  const grid = state.guesses
    .map(g => evaluate(g, target).map(s => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛')).join(''))
    .join('\n');
  return { number, done: true, won: state.phase === 'won', attempts: state.guesses.length, grid, streak, rank: null };
}

export function readHigherLower(): HLStatus {
  const day = utcDayKey();
  const done = read<{ score: number; results: boolean[] }>(hlDoneKey(day));
  const days = read<{ n: number; last: string | null }>(HL_DAYS_KEY);
  const streak = days && (days.last === day || days.last === previousDay(day)) ? days.n : 0;
  const rank = read<number>(rankKey(dailyLeaderboardId('higherlower', day)));
  return { done: !!done, score: done?.score ?? 0, results: done?.results ?? [], streak, rank };
}

export function readBlocks(): BlocksStatus {
  const day = utcDayKey();
  const best = read<{ score?: number }>(blocksBestKey(day));
  // Streak = consecutive days (ending today or yesterday) with a saved daily best
  let streak = 0;
  let d = best ? day : previousDay(day);
  while (streak < 366 && read(blocksBestKey(d))) { streak++; d = previousDay(d); }
  const rank = read<number>(rankKey(dailyLeaderboardId('dailyblocks', day)));
  return { done: !!best, score: best?.score ?? 0, streak, rank };
}

/** Re-read when a game writes (same tab events) or another tab changes storage. */
export const TRIO_EVENTS = ['storage', 'everyday-hl-change', 'everyday-best-change', 'everyday-rank-change', 'focus'];
