import { redis } from '../../../lib/redis';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export type GameId = 'sliding' | 'memory' | 'flagquiz' | 'wordchain';

export interface LBEntry {
  id: string;
  game: GameId;
  name: string;
  country: string;
  city: string;
  timeMs: number;
  score?: number;
  moves?: number;
  diff?: string;
  date: number;
}

const VALID_GAMES: GameId[] = ['sliding', 'memory', 'flagquiz', 'wordchain'];
const MAX_ENTRIES = 1000;

// Score-based games rank by highest score then fastest time.
// We encode as: (-score * 1e6 + timeMs) so ascending sort = best first.
function toSortScore(game: GameId, timeMs: number, score?: number): number {
  if (game === 'flagquiz' || game === 'wordchain') {
    return -(score ?? 0) * 1e6 + timeMs;
  }
  return timeMs;
}

function lbKey(game: GameId) { return `lb2:${game}`; }
function ipsKey(game: GameId) { return `lb2:ips:${game}`; }

function hashIp(ip: string, game: string): string {
  return createHash('sha256').update(ip + 'ea-lb-2025-' + game).digest('hex').slice(0, 24);
}

function periodFilter(entry: LBEntry, period: string): boolean {
  const now = Date.now();
  if (period === 'today') return now - entry.date < 86_400_000;
  if (period === 'week')  return now - entry.date < 7 * 86_400_000;
  if (period === 'month') return now - entry.date < 30 * 86_400_000;
  return true; // all-time
}

export async function GET(req: NextRequest) {
  const sp      = req.nextUrl.searchParams;
  const game    = sp.get('game') as GameId | null;
  const period  = sp.get('period') ?? 'all';
  const country = sp.get('country') ?? '';
  const city    = sp.get('city') ?? '';

  if (!game || !VALID_GAMES.includes(game)) {
    return NextResponse.json({ error: 'Missing game param' }, { status: 400 });
  }

  try {
    const raw = await redis.zrange<LBEntry[]>(lbKey(game), 0, MAX_ENTRIES - 1);
    const entries = (raw ?? []).filter((e): e is LBEntry => !!e && typeof e === 'object');

    let filtered = entries.filter(e => periodFilter(e, period));
    if (country) filtered = filtered.filter(e => e.country === country);
    if (city)    filtered = filtered.filter(e => e.city === city);

    // Collect distinct countries present in this game's leaderboard
    const countries = [...new Set(entries.map(e => e.country).filter(Boolean))].sort();

    return NextResponse.json({ entries: filtered.slice(0, 100), countries });
  } catch {
    return NextResponse.json({ entries: [], countries: [] });
  }
}

interface PostBody {
  game: GameId;
  name: string;
  country: string;
  city: string;
  timeMs: number;
  score?: number;
  moves?: number;
  diff?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PostBody;
    const { game, name, country, city, timeMs, score, moves, diff } = body;

    if (!VALID_GAMES.includes(game) || !name?.trim() || typeof timeMs !== 'number' || timeMs <= 0) {
      return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown';
    const ipHash  = hashIp(ip, game);
    const roundMs = Math.round(timeMs * 10) / 10;
    const sortVal = toSortScore(game, roundMs, score);

    interface IpRecord { member: string; sortVal: number; }
    const existing = await redis.hget<IpRecord>(ipsKey(game), ipHash);

    // For score-based games, "better" means lower sortVal (higher score / faster time)
    // For time-based games, "better" means lower sortVal (faster time)
    if (existing && sortVal >= existing.sortVal) {
      const rank = await redis.zcount(lbKey(game), '-inf', String(existing.sortVal - 0.0001));
      return NextResponse.json({ notBetter: true, rank: rank + 1 }, { status: 200 });
    }

    const currentCard = await redis.zcard(lbKey(game));
    const betterCount = await redis.zcount(lbKey(game), '-inf', `(${sortVal}`);
    const adjustedCard = existing ? Math.max(0, currentCard - 1) : currentCard;
    const rank = betterCount + 1;

    if (adjustedCard >= MAX_ENTRIES && rank > MAX_ENTRIES) {
      return NextResponse.json({ notInTop: true, rank }, { status: 200 });
    }

    if (existing) await redis.zrem(lbKey(game), existing.member);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: LBEntry = {
      id, game,
      name:    name.trim().slice(0, 30),
      country: (country ?? '').toUpperCase().slice(0, 2),
      city:    (city ?? '').trim().slice(0, 60),
      timeMs:  roundMs,
      score,
      moves,
      diff,
      date: Date.now(),
    };
    const member = JSON.stringify(entry);

    await redis.zadd(lbKey(game), { score: sortVal, member });
    await redis.zremrangebyrank(lbKey(game), MAX_ENTRIES, -1);
    await redis.hset(ipsKey(game), { [ipHash]: { member, sortVal } });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 });
  }
}
