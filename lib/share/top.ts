import { redis } from '../redis';
import { K } from '../antiCheat/keys';
import { listBans } from '../antiCheat/store';
import { normalizeNick } from '../antiCheat/nick';
import { utcDayKey } from '../gamesCatalog';
import { boardDay, boardOnDay } from './games';

/* The best three of today's leaderboard for the game of a share (server only).
   Daily games: today's board of the same variant. Other games: entries saved in the last 24 h,
   the same as the leaderboard's "today" filter. */

export interface TopEntry { name: string; country: string; timeMs: number; score?: number; moves?: number }

type Stored = TopEntry & { date: number; dev?: string };

export async function todayTop3(board: string): Promise<{ board: string; entries: TopEntry[] }> {
  const daily = boardDay(board) !== null;
  const key = daily ? boardOnDay(board, utcDayKey()) : board;
  try {
    const [raw, bans] = await Promise.all([redis.zrange<Stored[]>(K.board(key), 0, daily ? 49 : 499), listBans()]);
    const nicks = new Set(bans.nicks), devs = new Set(bans.devices);
    const now = Date.now();
    const entries = (raw ?? [])
      .filter((e): e is Stored => !!e && typeof e === 'object')
      .filter(e => !nicks.has(normalizeNick(e.name ?? '')) && !(e.dev && devs.has(e.dev)))
      .filter(e => daily || now - e.date < 86_400_000)
      .slice(0, 3)
      .map(e => ({ name: e.name, country: e.country, timeMs: e.timeMs, score: e.score, moves: e.moves }));
    return { board: key, entries };
  } catch (err) {
    console.error('[share] top 3 read failed:', err);
    return { board: key, entries: [] };
  }
}
