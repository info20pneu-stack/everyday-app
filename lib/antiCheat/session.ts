import { randomId, sign, verify } from './crypto';

/* Game session tokens: "<payload>.<hmac>", payload = base64url JSON { g, s, n, d }:
   g = leaderboard id, s = start (server ms), n = nonce, d = device id.
   Single use: the nonce is spent in Redis when a save is accepted (or refused as implausible). */

const LABEL = 'session';
/** Long enough for daily games that resume over a reload or past midnight. */
export const SESSION_TTL_MS = 48 * 60 * 60 * 1000;

export interface Session { game: string; start: number; nonce: string; device: string }

export function createSession(game: string, device: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ g: game, s: now, n: randomId(12), d: device })).toString('base64url');
  return `${payload}.${sign(LABEL, payload)}`;
}

export type SessionCheck = { ok: true; session: Session } | { ok: false; reason: 'missing' | 'bad_signature' | 'expired' | 'malformed' };

export function readSession(token: unknown, now = Date.now()): SessionCheck {
  if (typeof token !== 'string' || !token) return { ok: false, reason: 'missing' };
  const dot = token.lastIndexOf('.');
  if (dot <= 0 || token.length > 600) return { ok: false, reason: 'malformed' };
  const payload = token.slice(0, dot), mac = token.slice(dot + 1);
  if (!verify(LABEL, payload, mac)) return { ok: false, reason: 'bad_signature' };
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { g?: unknown; s?: unknown; n?: unknown; d?: unknown };
    if (typeof p.g !== 'string' || typeof p.s !== 'number' || typeof p.n !== 'string' || typeof p.d !== 'string') {
      return { ok: false, reason: 'malformed' };
    }
    if (now - p.s > SESSION_TTL_MS || p.s > now + 60_000) return { ok: false, reason: 'expired' };
    return { ok: true, session: { game: p.g, start: p.s, nonce: p.n, device: p.d } };
  } catch {
    return { ok: false, reason: 'malformed' };
  }
}
