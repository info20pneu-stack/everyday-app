import { redis } from '../../../lib/redis';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { LEADERBOARD_GAME_IDS, getLeaderboardConfig, toSortValue } from '../../../lib/gamesCatalog';
import { K } from '../../../lib/antiCheat/keys';
import { readDevice } from '../../../lib/antiCheat/device';
import { checkNick, normalizeNick } from '../../../lib/antiCheat/nick';
import { readSession } from '../../../lib/antiCheat/session';
import { checkResult } from '../../../lib/antiCheat/verify';
import {
  banState, claimNick, countNewNick, isTokenSpent, listBans, logRecent, logReject, newNickAllowed, nickOwner,
  overSubmitLimit, spendToken,
} from '../../../lib/antiCheat/store';

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
  /** Device id of the saving browser (never sent to the public, see GET). */
  dev?: string;
}

/** Base game ids (without variants) — used by the admin summary. */
export const VALID_GAMES: GameId[] = LEADERBOARD_GAME_IDS;
const MAX_ENTRIES = 1000;

export function lbKey(game: GameId) { return K.board(game); }
export function ipsKey(game: GameId) { return K.boardIps(game); }

// ISO-8601 week number (Monday-based, UTC) — e.g. "2026-W42". Resets every Monday 00:00 UTC.
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function lbWeekKey(game: GameId, weekKey: string) { return K.week(game, weekKey); }
function ipsWeekKey(game: GameId, weekKey: string) { return K.weekIps(game, weekKey); }

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

const DAILY_TTL_SECONDS = 30 * 24 * 60 * 60;

/* Daily boards (e.g. `dailyblocks_20261024`) expire 30 days after the day's first write.
   EXPIRE … NX only sets a TTL when the key has none, so later writes that day don't extend it. */
async function expireDaily(game: GameId) {
  try {
    await Promise.all([
      redis.expire(lbKey(game), DAILY_TTL_SECONDS, 'NX'),
      redis.expire(ipsKey(game), DAILY_TTL_SECONDS, 'NX'),
    ]);
  } catch (err) {
    console.error('[leaderboard POST] Daily expiry failed:', err);
  }
}

function hashIp(ip: string, game: string): string {
  return createHash('sha256').update(ip + 'ea-lb-2025-' + game).digest('hex').slice(0, 24);
}

/** An entry as the public sees it (without the device id). */
function publicEntry(e: LBEntry): LBEntry {
  const out = { ...e };
  delete out.dev;
  return out;
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
    const [raw, bans] = await Promise.all([redis.zrange<LBEntry[]>(key, 0, MAX_ENTRIES - 1), listBans()]);
    // Banned nicks and devices are hidden; the device id never leaves the server
    const bannedNicks = new Set(bans.nicks), bannedDevs = new Set(bans.devices);
    const entries = (raw ?? [])
      .filter((e): e is LBEntry => !!e && typeof e === 'object')
      .filter(e => !bannedNicks.has(normalizeNick(e.name ?? '')) && !(e.dev && bannedDevs.has(e.dev)))
      .map(publicEntry);

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
  /** Session token from POST /api/game/start. */
  token?: string;
  /** Moves of a daily game with a fixed solution (the server recomputes the result). */
  proof?: unknown;
}

/** Error answer; `code` is shown to the player through lib/leaderboardI18n.ts. */
function refuse(code: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: code, code, ...extra }, { status });
}

/* Saving a score, in this order (cheapest checks first):
   device cookie → hourly rate limit → nick rules → bans → session token (signature, game, device,
   not used) → nick ownership → plausibility / recomputed result → save.
   Refused cheating attempts (and tokens of implausible results) are logged for the admin. */
export async function POST(req: NextRequest) {
  let body: PostBody | null = null;
  try {
    body = await req.json() as PostBody;
    const { game, name, country, city, timeMs, score, moves, diff, device: deviceType } = body;

    const config = typeof game === 'string' ? getLeaderboardConfig(game) : null;
    if (!config || typeof name !== 'string' || typeof timeMs !== 'number' || timeMs <= 0) {
      return refuse('invalid', 400);
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown';
    const ipHash = hashIp(ip, game);
    const ipKey = hashIp(ip, 'any');
    const base = { at: Date.now(), game, ip: ipKey, name: typeof name === 'string' ? name.slice(0, 40) : undefined, timeMs, score };

    const dev = readDevice(req);
    if (!dev) {
      await logReject({ ...base, reason: 'no_device', device: null });
      return refuse('no_device', 403);
    }
    if (await overSubmitLimit(dev, ipKey)) {
      await logReject({ ...base, reason: 'rate_limited', device: dev });
      return refuse('rate_limited', 429);
    }

    const nick = checkNick(name);
    if (!nick.ok) {
      if (nick.reason === 'nick_rude') await logReject({ ...base, reason: 'nick_rude', device: dev });
      return refuse(nick.reason, 422);
    }

    const ban = await banState(nick.norm, dev);
    if (ban.nick || ban.device) {
      await logReject({ ...base, reason: 'banned', detail: ban.device ? 'device' : 'nick', device: dev });
      return refuse('banned', 403);
    }

    const token = readSession(body.token);
    if (!token.ok) {
      await logReject({ ...base, reason: `token_${token.reason}`, device: dev });
      return refuse('no_session', 403);
    }
    const session = token.session;
    if (session.game !== game || session.device !== dev) {
      await logReject({ ...base, reason: session.game !== game ? 'token_game' : 'token_device', detail: session.game, device: dev });
      return refuse('no_session', 403);
    }
    if (await isTokenSpent(session.nonce)) {
      await logReject({ ...base, reason: 'token_reused', device: dev });
      return refuse('token_used', 409);
    }

    // The nick belongs to the first device that used it
    const owner = await nickOwner(nick.norm, dev);
    if (owner === 'taken') return refuse('nick_taken', 409);
    if (owner === 'new' && !(await newNickAllowed(ipKey))) {
      await logReject({ ...base, reason: 'nick_limit', device: dev });
      return refuse('nick_limit', 429);
    }

    const verdict = checkResult(config, { game, timeMs, score, moves, proof: body.proof }, session);
    if (!verdict.ok) {
      await spendToken(session.nonce);
      await logReject({ ...base, reason: verdict.reason, detail: verdict.detail, device: dev, realMs: Date.now() - session.start });
      return refuse('implausible', 422);
    }
    if (!(await spendToken(session.nonce))) {
      await logReject({ ...base, reason: 'token_reused', device: dev });
      return refuse('token_used', 409);
    }
    if (owner === 'new') {
      if (!(await claimNick(nick.norm, dev))) return refuse('nick_taken', 409);
      await countNewNick(ipKey);
    }

    const finalScore = verdict.score;
    const finalMoves = verdict.moves;
    const roundMs = Math.round(timeMs * 10) / 10;
    const sortVal = toSortValue(config, roundMs, finalScore);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: LBEntry = {
      id, game,
      name:    nick.display,
      country: (typeof country === 'string' ? country : '').toUpperCase().slice(0, 2),
      city:    (typeof city === 'string' ? city : '').trim().slice(0, 60),
      timeMs:  roundMs,
      score:   finalScore,
      moves:   finalMoves,
      diff:    typeof diff === 'string' ? diff.slice(0, 20) : undefined,
      device:  deviceType === 'mobile' ? 'mobile' : 'desktop',
      date:    Date.now(),
      dev,
    };
    await logRecent({ game, id, name: entry.name, norm: nick.norm, device: dev, ip: ipKey, timeMs: roundMs, score: finalScore, at: entry.date });

    interface IpRecord { member: string; sortVal: number; }
    const existing = await redis.hget<IpRecord>(ipsKey(game), ipHash);

    const weekly = config.daily ? async () => {} : () => upsertWeekly(game, ipHash, sortVal, entry);

    if (existing && sortVal >= existing.sortVal) {
      await weekly();
      const rank = await redis.zcount(lbKey(game), '-inf', String(existing.sortVal - 0.0001));
      return NextResponse.json({ notBetter: true, rank: rank + 1 }, { status: 200 });
    }

    const currentCard = await redis.zcard(lbKey(game));
    const betterCount = await redis.zcount(lbKey(game), '-inf', `(${sortVal}`);
    const adjustedCard = existing ? Math.max(0, currentCard - 1) : currentCard;
    const rank = betterCount + 1;

    if (adjustedCard >= MAX_ENTRIES && rank > MAX_ENTRIES) {
      await weekly();
      return NextResponse.json({ notInTop: true, rank }, { status: 200 });
    }

    if (existing) await redis.zrem(lbKey(game), existing.member);

    const member = JSON.stringify(entry);
    await redis.zadd(lbKey(game), { score: sortVal, member });
    await redis.zremrangebyrank(lbKey(game), MAX_ENTRIES, -1);
    await redis.hset(ipsKey(game), { [ipHash]: { member, sortVal } });
    if (config.daily) await expireDaily(game);

    await weekly();

    return NextResponse.json({ success: true, entry: publicEntry(entry) }, { status: 201 });
  } catch (err) {
    console.error('[leaderboard POST] Error. Game:', body?.game, '| Error:', err);
    return refuse('server', 500);
  }
}
