import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardConfig } from '../../../../lib/gamesCatalog';
import { newDeviceId, readDevice, setDeviceCookie } from '../../../../lib/antiCheat/device';
import { createSession } from '../../../../lib/antiCheat/session';

/* POST /api/game/start { gameId } → { token }
   Called when a game opens (lib/gameSession.ts). The token carries the server start time and the
   device; the score save needs it and it works once. A first visit also gets the device cookie. */

export async function POST(req: NextRequest) {
  let gameId: unknown;
  try { gameId = (await req.json() as { gameId?: unknown })?.gameId; } catch {}
  if (typeof gameId !== 'string' || !getLeaderboardConfig(gameId)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const known = readDevice(req);
  const device = known ?? newDeviceId();
  let token: string;
  try { token = createSession(gameId, device); } catch (err) {
    console.error('[game/start]', err);
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }
  const res = NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
  if (!known) setDeviceCookie(res, device);
  return res;
}
