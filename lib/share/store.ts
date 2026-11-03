import { randomInt } from 'crypto';
import { redis } from '../redis';
import { K } from '../antiCheat/keys';
import { listBans } from '../antiCheat/store';
import { normalizeNick } from '../antiCheat/nick';
import type { Lang } from '../i18n';

/* Shared results (/s/<id>), server side.
   - A "verified round" is written when the server has judged a round believable: by the
     leaderboard save or by the share itself (app/api/share). It is keyed by the session nonce,
     so a share made after the save (when the token is already spent) still finds it.
   - A share is stored for 30 days under a short random id. Its numbers always come from the
     verified round, never from the request. */

const DAY = 24 * 60 * 60;
export const SHARE_TTL = 30 * DAY;
const VERIFIED_TTL = 3 * DAY;

export interface VerifiedRound {
  board: string;
  timeMs: number;
  score?: number;
  moves?: number;
  grid?: string[];
}

export interface ShareRecord extends VerifiedRound {
  id: string;
  name: string;
  diff?: string;
  /** Seed of a game with a random set (the friend gets the same one). */
  seed?: number;
  lang: Lang;
  at: number;
  /** Device of the sharer (moderation only, never public). */
  dev?: string;
  /** Rematch: the challenge this result answers. */
  vs?: { id: string; name: string; timeMs: number; score?: number; moves?: number };
}

export type PublicShare = Omit<ShareRecord, 'dev'>;

export function publicShare(r: ShareRecord): PublicShare {
  const out = { ...r };
  delete out.dev;
  return out;
}

export async function saveVerified(nonce: string, round: VerifiedRound): Promise<void> {
  try {
    await redis.set(K.verified(nonce), round, { ex: VERIFIED_TTL });
  } catch (err) {
    console.error('[share] verified round write failed:', err);
  }
}

export async function readVerified(nonce: string): Promise<VerifiedRound | null> {
  return (await redis.get<VerifiedRound>(K.verified(nonce))) ?? null;
}

const ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789'; // no 0/o, 1/l
export const SHARE_ID_RE = /^[a-z2-9]{6,10}$/;

function newId(len = 6): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Stores the share under a fresh id (one per round: a second call returns the first id). */
export async function createShare(nonce: string, data: Omit<ShareRecord, 'id'>): Promise<ShareRecord> {
  const prev = await redis.get<string>(K.shareByNonce(nonce));
  if (prev) {
    const old = await getShare(prev);
    if (old) return old;
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const id = newId(attempt < 4 ? 6 : 8);
    const rec: ShareRecord = { id, ...data };
    if ((await redis.set(K.share(id), rec, { nx: true, ex: SHARE_TTL })) === 'OK') {
      await redis.set(K.shareByNonce(nonce), id, { ex: SHARE_TTL });
      return rec;
    }
  }
  throw new Error('share id space exhausted');
}

/** The share, or null when it is unknown, expired or its author is banned. */
export async function getShare(id: string): Promise<ShareRecord | null> {
  if (!SHARE_ID_RE.test(id)) return null;
  const rec = await redis.get<ShareRecord>(K.share(id));
  if (!rec || typeof rec !== 'object') return null;
  const bans = await listBans();
  if (bans.nicks.includes(normalizeNick(rec.name)) || (rec.dev && bans.devices.includes(rec.dev))) return null;
  return rec;
}
