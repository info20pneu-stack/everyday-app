import { NextRequest, NextResponse } from 'next/server';
import { redis } from '../../../../lib/redis';
import { isAdminAuthed } from '../../../../lib/adminAuth';
import { getLeaderboardConfig } from '../../../../lib/gamesCatalog';
import { K, LB_PREFIX } from '../../../../lib/antiCheat/keys';
import { normalizeNick } from '../../../../lib/antiCheat/nick';
import { listBans, readRecent, readRejects, setBan } from '../../../../lib/antiCheat/store';
import type { LBEntry } from '../../leaderboard/route';

/* Leaderboard moderation for /admin.
   GET                 → recent saves (all boards), refused attempts, bans
   GET ?board=<id>     → every entry of one board (also entries saved before the protection existed)
   POST { action: 'delete', board, id }                  removes an entry
   POST { action: 'ban' | 'unban', kind: 'nick' | 'device', value } */

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const board = req.nextUrl.searchParams.get('board');
  try {
    if (board) {
      if (!getLeaderboardConfig(board)) return NextResponse.json({ error: 'Unknown board' }, { status: 400 });
      const entries = (await redis.zrange<LBEntry[]>(K.board(board), 0, 999)) ?? [];
      return NextResponse.json({ board, entries });
    }
    const [recent, rejects, bans] = await Promise.all([readRecent(300), readRejects(300), listBans()]);
    return NextResponse.json({ prefix: LB_PREFIX, recent, rejects, bans });
  } catch (err) {
    console.error('[admin/moderation GET]', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

/** Removes an entry (by id) from a board, its per-IP record and this week's season board. */
async function deleteEntry(board: string, id: string): Promise<boolean> {
  const entries = (await redis.zrange<LBEntry[]>(K.board(board), 0, 999)) ?? [];
  const hit = entries.find(e => e?.id === id);
  if (!hit) return false;
  const member = JSON.stringify(hit);
  await redis.zrem(K.board(board), member);
  const ips = await redis.hgetall<Record<string, { member: string }>>(K.boardIps(board));
  const fields = Object.entries(ips ?? {}).filter(([, v]) => v?.member === member).map(([k]) => k);
  if (fields.length) await redis.hdel(K.boardIps(board), ...fields);
  return true;
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { action?: string; board?: string; id?: string; kind?: string; value?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  try {
    if (body.action === 'delete') {
      if (!body.board || !body.id || !getLeaderboardConfig(body.board)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      const ok = await deleteEntry(body.board, body.id);
      return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
    }
    if ((body.action === 'ban' || body.action === 'unban') && (body.kind === 'nick' || body.kind === 'device') && body.value) {
      const value = body.kind === 'nick' ? normalizeNick(body.value) : body.value.trim();
      if (!value) return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
      await setBan(body.kind, value, body.action === 'ban');
      return NextResponse.json({ ok: true, value });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[admin/moderation POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
