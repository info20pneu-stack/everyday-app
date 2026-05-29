import { redis } from '../../../lib/redis';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const MAX_ENTRIES = 1000;
const LB_KEY  = 'sliding:lb';
const IPS_KEY = 'sliding:ips';

export interface LBEntry {
  id: string;
  name: string;
  country: string;
  city: string;
  timeMs: number;
  moves: number;
  date: number;
}

// Stored per IP hash in a Redis hash — tracks their best sorted-set member string
interface IpRecord {
  member: string;  // exact JSON string used as the sorted-set member
  timeMs: number;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + 'ea-sliding-2025').digest('hex').slice(0, 24);
}

export async function GET() {
  try {
    const entries = await redis.zrange<LBEntry[]>(LB_KEY, 0, MAX_ENTRIES - 1);
    return NextResponse.json(entries ?? []);
  } catch (err) {
    console.error('[sliding-puzzle GET] Redis error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  let body: { name: string; timeMs: number; moves: number } | null = null;
  try {
    body = await req.json() as { name: string; timeMs: number; moves: number };
    const { name, timeMs, moves } = body;

    if (
      !name?.trim() ||
      typeof timeMs !== 'number' || timeMs <= 0 ||
      typeof moves !== 'number' || moves < 1
    ) {
      console.error('[sliding-puzzle POST] Validation failed:', body);
      return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown';
    const ipHash = hashIp(ip);

    const country = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2);
    const rawCity = req.headers.get('x-vercel-ip-city') ?? '';
    const city    = rawCity ? decodeURIComponent(rawCity).slice(0, 60) : '';

    // Round to 0.1 ms (ten-thousandths of a second)
    const roundedMs = Math.round(timeMs * 10) / 10;

    // One entry per IP — look up their previous best
    const existing = await redis.hget<IpRecord>(IPS_KEY, ipHash);

    if (existing && roundedMs >= existing.timeMs) {
      const rank = await redis.zcount(LB_KEY, '-inf', String(existing.timeMs));
      return NextResponse.json({ notBetter: true, currentBestMs: existing.timeMs, rank }, { status: 200 });
    }

    // Estimate rank in the leaderboard after replacing old entry
    const currentCard = await redis.zcard(LB_KEY);
    let betterCount   = await redis.zcount(LB_KEY, '-inf', `(${roundedMs}`);
    let adjustedCard  = currentCard;

    if (existing) {
      adjustedCard = Math.max(0, currentCard - 1);
      if (existing.timeMs < roundedMs) betterCount = Math.max(0, betterCount - 1);
    }

    const rank = betterCount + 1;
    if (adjustedCard >= MAX_ENTRIES && rank > MAX_ENTRIES) {
      return NextResponse.json({ notInTop: true, rank }, { status: 200 });
    }

    // Remove superseded entry from the sorted set
    if (existing) {
      await redis.zrem(LB_KEY, existing.member);
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: LBEntry = {
      id,
      name:    name.trim().slice(0, 30),
      country,
      city,
      timeMs:  roundedMs,
      moves,
      date:    Date.now(),
    };

    // Member must be a stable string so we can zrem it later via IpRecord
    const member = JSON.stringify(entry);

    await redis.zadd(LB_KEY, { score: roundedMs, member });
    await redis.zremrangebyrank(LB_KEY, MAX_ENTRIES, -1);
    await redis.hset(IPS_KEY, { [ipHash]: { member, timeMs: roundedMs } });

    console.log('[sliding-puzzle POST] Success, rank:', rank);
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err) {
    console.error('[sliding-puzzle POST] Error. Body:', body, '| Error:', err);
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 });
  }
}
