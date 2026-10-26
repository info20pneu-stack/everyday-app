import { utcDayKey, type CatalogGame } from './gamesCatalog';
import { readBlocks, readHigherLower, readPuzzle, HL_BEST_KEY } from './dailyTrio';

/* The player's own progress for the games page, read from what each game already saves in
   localStorage (browser only): personal records, daily games finished today, best rank today. */

export type GameRecord =
  | { kind: 'points'; value: number }
  | { kind: 'time'; ms: number }
  | { kind: 'ms'; ms: number }
  | { kind: 'moves'; value: number }
  | { kind: 'wpm'; value: number };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch { return null; }
}

/** Keys of all localStorage entries starting with `prefix`. */
function keysWith(prefix: string): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) out.push(k);
    }
  } catch {}
  return out;
}

const todayCompact = () => utcDayKey().replace(/-/g, '');

/** Personal record of a game, or null when the player has none yet (or the game keeps none). */
export function readRecord(game: CatalogGame): GameRecord | null {
  switch (game.id) {
    case 'higher-lower': {
      const n = Number(read<number>(HL_BEST_KEY) ?? 0);
      return n > 0 ? { kind: 'points', value: n } : null;
    }
    case 'daily-blocks': {
      const b = readBlocks();
      return b.done ? { kind: 'points', value: b.score } : null;
    }
    case 'connect-four': {
      // Today's best time on any region's daily board
      const times = keysWith('everyday-best-connectfour_')
        .filter(k => k.endsWith(`_${todayCompact()}`))
        .map(k => read<{ timeMs: number }>(k)?.timeMs ?? 0)
        .filter(t => t > 0);
      return times.length ? { kind: 'time', ms: Math.min(...times) } : null;
    }
    case 'memory': {
      const best = Object.values(read<Record<string, number>>('mem_best') ?? {}).filter(n => n > 0);
      return best.length ? { kind: 'moves', value: Math.min(...best) } : null;
    }
    case 'sliding': {
      const ms = read<number>('sp_best_ms');
      return ms ? { kind: 'time', ms } : null;
    }
    case 'wordchain': {
      const n = read<number>('wc_best_words');
      return n ? { kind: 'points', value: n } : null;
    }
    case 'flagquiz': {
      const recs = read<{ score: number }[]>('fq_records') ?? [];
      const best = Math.max(0, ...recs.map(r => r.score ?? 0));
      return best > 0 ? { kind: 'points', value: best } : null;
    }
    case 'typing': {
      const n = Number(read<number>('typing_best_wpm') ?? 0);
      return n > 0 ? { kind: 'wpm', value: n } : null;
    }
    case 'human-benchmark': {
      const ms = read<number>('hb_best_reaction');
      return ms ? { kind: 'ms', ms } : null;
    }
  }
  // Games inside GameShell keep { timeMs, score } under everyday-best-<leaderboard>
  if (game.leaderboard) {
    const b = read<{ timeMs: number; score?: number }>(`everyday-best-${game.leaderboard}`);
    if (b) return b.score != null ? { kind: 'points', value: b.score } : { kind: 'time', ms: b.timeMs };
  }
  return null;
}

/** Daily games finished today. */
export function isDoneToday(game: CatalogGame): boolean {
  switch (game.id) {
    case 'daily-puzzle': return readPuzzle().done;
    case 'higher-lower': return readHigherLower().done;
    case 'daily-blocks': return readBlocks().done;
    case 'connect-four':
      return keysWith('cf-state-')
        .filter(k => k.endsWith(`-${utcDayKey()}`))
        .some(k => read<{ over?: boolean }>(k)?.over === true);
  }
  return false;
}

/** Best (lowest) rank saved today on any daily leaderboard, or null. */
export function bestRankToday(): number | null {
  const ranks = keysWith('everyday-rank-')
    .filter(k => k.endsWith(todayCompact()))
    .map(k => Number(read<number>(k)))
    .filter(n => Number.isFinite(n) && n > 0);
  return ranks.length ? Math.min(...ranks) : null;
}
