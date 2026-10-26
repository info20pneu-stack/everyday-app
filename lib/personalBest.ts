import { getLeaderboardConfig, toSortValue } from './gamesCatalog';

/* Personal records, one per leaderboard id: localStorage `everyday-best-<id>` = { timeMs, score? }.
   Written by GameShell and the daily / speed games, read by the games page and the game headers.
   "Better" follows the leaderboard's scoreType (points: higher score, ties by time; time: lower). */

export type StoredBest = { timeMs: number; score?: number };

/** Fired on window whenever a record changes (same tab); other tabs get a `storage` event. */
export const BEST_EVENT = 'everyday-best-change';

export const bestKey = (lbId: string) => `everyday-best-${lbId}`;

export function readBestRaw(lbId: string | undefined): string | null {
  if (!lbId) return null;
  try { return localStorage.getItem(bestKey(lbId)); } catch { return null; }
}

export function parseBest(raw: string | null): StoredBest | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredBest;
    return typeof v?.timeMs === 'number' ? v : null;
  } catch { return null; }
}

export function readBest(lbId: string): StoredBest | null {
  return parseBest(readBestRaw(lbId));
}

/** Saves the result when it beats the stored record; returns whether it did. */
export function saveBest(lbId: string, timeMs: number, score?: number): boolean {
  const cfg = getLeaderboardConfig(lbId);
  if (!cfg) return false;
  const prev = readBest(lbId);
  const better = !prev || toSortValue(cfg, timeMs, score) < toSortValue(cfg, prev.timeMs, prev.score);
  if (!better) return false;
  try { localStorage.setItem(bestKey(lbId), JSON.stringify({ timeMs, score })); } catch { return false; }
  window.dispatchEvent(new Event(BEST_EVENT));
  return true;
}
