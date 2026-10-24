import { redis } from '../../../lib/redis';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { LEADERBOARD_GAME_IDS, getLeaderboardConfig, toSortValue } from '../../../lib/gamesCatalog';

/** Leaderboard id: a key of LEADERBOARD_GAMES in lib/gamesCatalog.ts, or `<id>_<variant>` for games with variants. */
export type GameId = string;

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
  device?: 'mobile' | 'desktop';
  date: number;
}

/** Base game ids (without variants) — used by the admin summary. */
export const VALID_GAMES: GameId[] = LEADERBOARD_GAME_IDS;
const MAX_ENTRIES = 1000;

export function lbKey(game: GameId) { return `lb2:${game}`; }
function ipsKey(game: GameId) { return `lb2:ips:${game}`; }

// ISO-8601 week number (Monday-based, UTC) — e.g. "2026-W42". Resets every Monday 00:00 UTC.
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function lbWeekKey(game: GameId, weekKey: string) { return `lb2:week:${weekKey}:${game}`; }
function ipsWeekKey(game: GameId, weekKey: string) { return `lb2:week:${weekKey}:ips:${game}`; }

// Best-effort upsert into this week's season leaderboard. Independent of the all-time dataset/outcome.
async function upsertWeekly(game: GameId, ipHash: string, sortVal: number, entry: LBEntry) {
  try {
    const weekKey = isoWeekKey(new Date());
    const wLbKey  = lbWeekKey(game, weekKey);
    const wIpsKey = ipsWeekKey(game, weekKey);
    interface IpRecord { member: string; sortVal: number; }
    const existing = await redis.hget<IpRecord>(wIpsKey, ipHash);
    if (existing && sortVal >= existing.sortVal) return;
    if (existing) await redis.zrem(wLbKey, existing.member);
    const member = JSON.stringify(entry);
    await redis.zadd(wLbKey, { score: sortVal, member });
    await redis.zremrangebyrank(wLbKey, MAX_ENTRIES, -1);
    await redis.hset(wIpsKey, { [ipHash]: { member, sortVal } });
  } catch (err) {
    console.error('[leaderboard POST] Weekly season write failed:', err);
  }
}

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
  const season  = sp.get('season'); // 'week' | 'all' — new weekly-season leaderboards
  const period  = sp.get('period') ?? 'all';
  const country = sp.get('country') ?? '';
  const city    = sp.get('city') ?? '';

  if (!game || !getLeaderboardConfig(game)) {
    return NextResponse.json({ error: 'Missing game param' }, { status: 400 });
  }

  try {
    const key = season === 'week' ? lbWeekKey(game, isoWeekKey(new Date())) : lbKey(game);
    const raw = await redis.zrange<LBEntry[]>(key, 0, MAX_ENTRIES - 1);
    const entries = (raw ?? []).filter((e): e is LBEntry => !!e && typeof e === 'object');

    let filtered = season ? entries : entries.filter(e => periodFilter(e, period));
    if (country) filtered = filtered.filter(e => e.country === country);
    if (city)    filtered = filtered.filter(e => e.city === city);

    // Collect distinct countries present in this game's leaderboard
    const countries = [...new Set(entries.map(e => e.country).filter(Boolean))].sort();

    return NextResponse.json({ entries: filtered.slice(0, 100), countries });
  } catch (err) {
    console.error('[leaderboard GET] Redis error:', err);
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
  device?: 'mobile' | 'desktop';
}

export async function POST(req: NextRequest) {
  let body: PostBody | null = null;
  try {
    body = await req.json() as PostBody;
    const { game, name, country, city, timeMs, score, moves, diff, device } = body;

    const config = typeof game === 'string' ? getLeaderboardConfig(game) : null;
    if (!config || !name?.trim() || typeof timeMs !== 'number' || timeMs <= 0) {
      console.error('[leaderboard POST] Validation failed:', { game, name, timeMs });
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown';
    const ipHash  = hashIp(ip, game);
    const roundMs = Math.round(timeMs * 10) / 10;
    const sortVal = toSortValue(config, roundMs, score);

    console.log('[leaderboard POST] Writing entry:', { game, name: name.trim(), roundMs, sortVal, ip: ip.slice(0, 8) + '...' });

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
      device: device === 'mobile' ? 'mobile' : 'desktop',
      date: Date.now(),
    };

    interface IpRecord { member: string; sortVal: number; }
    const existing = await redis.hget<IpRecord>(ipsKey(game), ipHash);

    if (existing && sortVal >= existing.sortVal) {
      await upsertWeekly(game, ipHash, sortVal, entry);
      const rank = await redis.zcount(lbKey(game), '-inf', String(existing.sortVal - 0.0001));
      return NextResponse.json({ notBetter: true, rank: rank + 1 }, { status: 200 });
    }

    const currentCard = await redis.zcard(lbKey(game));
    const betterCount = await redis.zcount(lbKey(game), '-inf', `(${sortVal}`);
    const adjustedCard = existing ? Math.max(0, currentCard - 1) : currentCard;
    const rank = betterCount + 1;

    if (adjustedCard >= MAX_ENTRIES && rank > MAX_ENTRIES) {
      await upsertWeekly(game, ipHash, sortVal, entry);
      return NextResponse.json({ notInTop: true, rank }, { status: 200 });
    }

    if (existing) await redis.zrem(lbKey(game), existing.member);

    const member = JSON.stringify(entry);
    await redis.zadd(lbKey(game), { score: sortVal, member });
    await redis.zremrangebyrank(lbKey(game), MAX_ENTRIES, -1);
    await redis.hset(ipsKey(game), { [ipHash]: { member, sortVal } });

    await upsertWeekly(game, ipHash, sortVal, entry);

    console.log('[leaderboard POST] Success, rank:', rank);
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err) {
    console.error('[leaderboard POST] Error. Body:', body, '| Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
