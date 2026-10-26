/* Which Daily Boost activities are on today's list, and marking one of them done from elsewhere
   (e.g. the box-breathing exercise ticks off "Box breathing" when it is on today's list).
   DailyBoost.tsx picks its four cards with the same functions, so both always agree. */

import { recordDailyBoostActivity } from './streak';

/** Order of the activity bank in DailyBoost.tsx (the daily pick depends on it). */
export const BOOST_ACTIVITY_IDS = [
  'walk', 'squats', 'plank', 'breathing', 'stretch', 'pushups', 'water', 'steps', 'eyes', 'praise', 'catcow', 'jumps',
] as const;
export type BoostActivityId = typeof BOOST_ACTIVITY_IDS[number];

export const DAILY_BOOST_DONE_PREFIX = 'db_done_';
export const DAILY_BOOST_ACTIVITY_COUNT = 4;

export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dateSeed(d = new Date()) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Local date key YYYY-MM-DD (Daily Boost days follow the visitor's clock). */
export function boostDayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Index of each of today's four cards in the bank. */
export function todaysBoostIndexes(d = new Date()): number[] {
  return seededShuffle(BOOST_ACTIVITY_IDS.map((_, i) => i), dateSeed(d)).slice(0, DAILY_BOOST_ACTIVITY_COUNT);
}

/** Marks `id` done in today's Daily Boost when it is on today's list. Returns whether it is (now) done. */
export function markBoostActivityDone(id: BoostActivityId): boolean {
  const slot = todaysBoostIndexes().findIndex(i => BOOST_ACTIVITY_IDS[i] === id);
  if (slot < 0) return false;
  const key = `${DAILY_BOOST_DONE_PREFIX}${boostDayKey()}`;
  let done: boolean[] = [false, false, false, false];
  try { const raw = localStorage.getItem(key); if (raw) done = JSON.parse(raw); } catch {}
  if (done[slot]) return true;
  done[slot] = true;
  try { localStorage.setItem(key, JSON.stringify(done)); } catch { return false; }
  recordDailyBoostActivity();
  return true;
}
