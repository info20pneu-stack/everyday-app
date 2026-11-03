import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardConfig } from '../../../lib/gamesCatalog';
import type { Lang } from '../../../lib/i18n';
import { readDevice } from '../../../lib/antiCheat/device';
import { checkNick } from '../../../lib/antiCheat/nick';
import { readSession } from '../../../lib/antiCheat/session';
import { checkResult } from '../../../lib/antiCheat/verify';
import {
  banState, claimNick, countNewNick, isTokenSpent, logReject, newNickAllowed, nickOwner, overShareLimit, spendToken,
} from '../../../lib/antiCheat/store';
import { gridFromProof } from '../../../lib/share/grid';
import { baseBoard } from '../../../lib/share/games';
import {
  createShare, getShare, publicShare, readVerified, saveVerified, type ShareRecord, type VerifiedRound,
} from '../../../lib/share/store';

/* POST /api/share → { id, share }
   Turns the player's finished round into a /s/<id> link. The request carries the round's session
   token (the same one the leaderboard save uses). The numbers of the share come from the round the
   server has verified: either the one stored by the leaderboard save, or — before any save — the
   result checked here with the same rules (lib/antiCheat/verify.ts). Sharing does not spend the
   token, so the result can still be saved to the leaderboard afterwards. */

const LANGS: Lang[] = ['en', 'de', 'it', 'fr', 'cs', 'es', 'pl', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'];

interface Body {
  board?: unknown; name?: unknown; token?: unknown; lang?: unknown;
  timeMs?: unknown; score?: unknown; moves?: unknown; diff?: unknown; proof?: unknown; seed?: unknown;
  /** Id of the challenge this result answers (rematch). */
  vs?: unknown;
}

function refuse(code: string, status: number) {
  return NextResponse.json({ error: code, code }, { status });
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + 'ea-lb-2025-' + 'any').digest('hex').slice(0, 24);
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = await req.json() as Body; } catch { return refuse('invalid', 400); }

  const board = typeof body.board === 'string' ? body.board : '';
  const config = getLeaderboardConfig(board);
  if (!config || typeof body.name !== 'string') return refuse('invalid', 400);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  const ipKey = hashIp(ip);
  const dev = readDevice(req);
  if (!dev) return refuse('no_device', 403);

  try {
    if (await overShareLimit(dev, ipKey)) return refuse('rate_limited', 429);

    const nick = checkNick(body.name);
    if (!nick.ok) return refuse(nick.reason, 422);
    const ban = await banState(nick.norm, dev);
    if (ban.nick || ban.device) return refuse('banned', 403);

    const token = readSession(body.token);
    if (!token.ok) return refuse('no_session', 403);
    const session = token.session;
    if (session.game !== board || session.device !== dev) return refuse('no_session', 403);

    // The verified round: stored by the leaderboard save, or checked now
    let round: VerifiedRound | null = await readVerified(session.nonce);
    if (!round) {
      // A spent token without a verified round was refused as implausible
      if (await isTokenSpent(session.nonce)) return refuse('token_used', 409);
      const timeMs = num(body.timeMs) ?? 0;
      const claim = { game: board, timeMs, score: num(body.score), moves: num(body.moves), proof: body.proof };
      const verdict = checkResult(config, claim, session);
      if (!verdict.ok) {
        await spendToken(session.nonce);
        await logReject({
          at: Date.now(), game: board, reason: verdict.reason, detail: `share: ${verdict.detail}`,
          name: nick.display, device: dev, ip: ipKey, timeMs, score: claim.score, realMs: Date.now() - session.start,
        });
        return refuse('implausible', 422);
      }
      round = {
        board, timeMs: Math.round(timeMs * 10) / 10, score: verdict.score, moves: verdict.moves,
        grid: gridFromProof(config, board, body.proof),
      };
      await saveVerified(session.nonce, round);
    }

    // Same nick rules as the leaderboard: the nick belongs to the first device that used it
    const owner = await nickOwner(nick.norm, dev);
    if (owner === 'taken') return refuse('nick_taken', 409);
    if (owner === 'new') {
      if (!(await newNickAllowed(ipKey))) return refuse('nick_limit', 429);
      if (!(await claimNick(nick.norm, dev))) return refuse('nick_taken', 409);
      await countNewNick(ipKey);
    }

    // Rematch: only against a challenge of the same game
    let vs: ShareRecord['vs'];
    if (typeof body.vs === 'string') {
      const other = await getShare(body.vs);
      if (other && baseBoard(other.board) === baseBoard(board)) {
        vs = { id: other.id, name: other.name, timeMs: other.timeMs, score: other.score, moves: other.moves };
      }
    }

    const seed = num(body.seed);
    const lang = LANGS.includes(body.lang as Lang) ? body.lang as Lang : 'en';
    const share = await createShare(session.nonce, {
      ...round,
      name: nick.display,
      diff: typeof body.diff === 'string' ? body.diff.slice(0, 20) : undefined,
      seed: seed !== undefined && Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32 ? seed : undefined,
      lang, at: Date.now(), dev, vs,
    });
    return NextResponse.json({ id: share.id, share: publicShare(share) }, { status: 201 });
  } catch (err) {
    console.error('[share POST]', board, err);
    return refuse('server', 500);
  }
}
