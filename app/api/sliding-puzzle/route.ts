import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const MAX_ENTRIES = 1000;
const KV_KEY  = 'sliding:lb';
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

interface IpRecord {
  member: string;
  timeMs: number;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + 'ea-sliding-2025').digest('hex').slice(0, 24);
}

export async function GET() {
  try {
    const raw = await kv.zrange(KV_KEY, 0, MAX_ENTRIES - 1) as string[];
    const entries = raw
      .map(r => { try { return JSON.parse(r) as LBEntry; } catch { return null; } })
      .filter((e): e is LBEntry => e !== null);
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name: string; timeMs: number; moves: number };
    const { name, timeMs, moves } = body;

    if (!name?.trim() || typeof timeMs !== 'number' || timeMs <= 0 || typeof moves !== 'number' || moves < 1) {
      return NextResponse.json({ error: 'Neplatná data' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown';
    const ipHash = hashIp(ip);

    const country = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2);
    const rawCity = req.headers.get('x-vercel-ip-city') ?? '';
    const city    = rawCity ? decodeURIComponent(rawCity).slice(0, 60) : '';

    const roundedMs = Math.round(timeMs * 10) / 10;

    const existingRaw = await kv.hget(IPS_KEY, ipHash) as string | null;
    const existing: IpRecord | null = existingRaw
      ? (() => { try { return JSON.parse(existingRaw) as IpRecord; } catch { return null; } })()
      : null;

    // Existing IP entry with equal or better time — don't update
    if (existing && roundedMs >= existing.timeMs) {
      const count = await kv.zcount(KV_KEY, '-inf', String(existing.timeMs)) as number;
      return NextResponse.json({ notBetter: true, currentBestMs: existing.timeMs, rank: count }, { status: 200 });
    }

    // Estimate rank after hypothetical removal of old entry and insertion of new one
    const currentCard  = await kv.zcard(KV_KEY) as number;
    let   betterCount  = await kv.zcount(KV_KEY, '-inf', `(${roundedMs}`) as number;
    let   adjustedCard = currentCard;

    if (existing) {
      adjustedCard = Math.max(0, currentCard - 1);
      if (existing.timeMs < roundedMs) betterCount--;
    }

    const rank = betterCount + 1;
    if (adjustedCard >= MAX_ENTRIES && rank > MAX_ENTRIES) {
      return NextResponse.json({ notInTop: true, rank }, { status: 200 });
    }

    // Remove old entry (no-op if already trimmed out)
    if (existing) {
      await kv.zrem(KV_KEY, existing.member);
    }

    const id    = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: LBEntry = {
      id,
      name:    name.trim().slice(0, 30),
      country,
      city,
      timeMs:  roundedMs,
      moves,
      date:    Date.now(),
    };
    const member = JSON.stringify(entry);

    await kv.zadd(KV_KEY, { score: roundedMs, member });
    await kv.zremrangebyrank(KV_KEY, MAX_ENTRIES, -1);

    const ipRecord: IpRecord = { member, timeMs: roundedMs };
    await kv.hset(IPS_KEY, { [ipHash]: JSON.stringify(ipRecord) });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Chyba serveru' }, { status: 500 });
  }
}
