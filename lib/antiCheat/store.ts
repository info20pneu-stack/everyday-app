import { redis } from '../redis';
import { K } from './keys';

/* Redis side of the protection: nick ownership, spent tokens, rate limits, bans and the admin logs. */

const DAY = 24 * 60 * 60;

/* ── nicks ── */

export type NickClaim = 'own' | 'taken' | 'new';

/** Who owns a nick: this device ("own"), another one ("taken") or nobody yet ("new"). */
export async function nickOwner(norm: string, device: string): Promise<NickClaim> {
  const owner = await redis.get<string>(K.nick(norm));
  if (!owner) return 'new';
  return owner === device ? 'own' : 'taken';
}

/** Reserves a nick for the device; false when another device got it first. */
export async function claimNick(norm: string, device: string): Promise<boolean> {
  const set = await redis.set(K.nick(norm), device, { nx: true });
  if (set === 'OK') return true;
  return (await redis.get<string>(K.nick(norm))) === device;
}

/* ── single-use session tokens ── */

/** Marks a session nonce as used; false when it already was. */
export async function spendToken(nonce: string): Promise<boolean> {
  return (await redis.set(K.usedToken(nonce), 1, { nx: true, ex: 3 * DAY })) === 'OK';
}

export async function isTokenSpent(nonce: string): Promise<boolean> {
  return (await redis.exists(K.usedToken(nonce))) === 1;
}

/* ── rate limits ── */

export const LIMITS = {
  /** Score saves per hour, per device and per IP. */
  submitsPerHour: 30,
  /** New nicks per day per IP. */
  newNicksPerDay: 5,
};

function bucket(seconds: number): string {
  return String(Math.floor(Date.now() / 1000 / seconds));
}

/** Counts one hit and returns the count in the current window. */
async function hit(kind: string, who: string, windowSec: number): Promise<number> {
  const key = K.rate(kind, who, bucket(windowSec));
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec + 60);
  return n;
}

async function peek(kind: string, who: string, windowSec: number): Promise<number> {
  return Number(await redis.get(K.rate(kind, who, bucket(windowSec)))) || 0;
}

/** Counts a save attempt; true when the device or the IP is over the hourly limit. */
export async function overSubmitLimit(device: string, ipHash: string): Promise<boolean> {
  const [d, i] = await Promise.all([hit('sub-dev', device, 3600), hit('sub-ip', ipHash, 3600)]);
  return d > LIMITS.submitsPerHour || i > LIMITS.submitsPerHour;
}

export async function newNickAllowed(ipHash: string): Promise<boolean> {
  return (await peek('nick-ip', ipHash, DAY)) < LIMITS.newNicksPerDay;
}

export async function countNewNick(ipHash: string): Promise<void> {
  await hit('nick-ip', ipHash, DAY);
}

/* ── bans ── */

export async function banState(norm: string | null, device: string | null): Promise<{ nick: boolean; device: boolean }> {
  const [nick, dev] = await Promise.all([
    norm ? redis.sismember(K.bannedNicks(), norm) : Promise.resolve(0),
    device ? redis.sismember(K.bannedDevices(), device) : Promise.resolve(0),
  ]);
  return { nick: nick === 1, device: dev === 1 };
}

export async function listBans(): Promise<{ nicks: string[]; devices: string[] }> {
  const [nicks, devices] = await Promise.all([redis.smembers(K.bannedNicks()), redis.smembers(K.bannedDevices())]);
  return { nicks: nicks.sort(), devices: devices.sort() };
}

export async function setBan(kind: 'nick' | 'device', value: string, banned: boolean): Promise<void> {
  const key = kind === 'nick' ? K.bannedNicks() : K.bannedDevices();
  if (banned) await redis.sadd(key, value); else await redis.srem(key, value);
}

/* ── admin logs ── */

export interface RecentEntry {
  game: string; id: string; name: string; norm: string; device: string; ip: string;
  timeMs: number; score?: number; at: number;
}

export interface RejectEntry {
  at: number; game: string; reason: string; detail?: string;
  name?: string; device?: string | null; ip: string; timeMs?: number; score?: number; realMs?: number;
}

const LOG_MAX = 1000;

export async function logRecent(e: RecentEntry): Promise<void> {
  await redis.lpush(K.recent(), JSON.stringify(e));
  await redis.ltrim(K.recent(), 0, LOG_MAX - 1);
}

export async function logReject(e: RejectEntry): Promise<void> {
  console.warn('[leaderboard] rejected:', e.reason, e.game, e.detail ?? '', e.name ?? '');
  try {
    await redis.lpush(K.rejects(), JSON.stringify(e));
    await redis.ltrim(K.rejects(), 0, LOG_MAX - 1);
  } catch (err) {
    console.error('[leaderboard] reject log failed:', err);
  }
}

function parseList<T>(rows: unknown[]): T[] {
  return rows.flatMap(r => {
    if (r && typeof r === 'object') return [r as T];
    try { return [JSON.parse(String(r)) as T]; } catch { return []; }
  });
}

export async function readRecent(limit = 200): Promise<RecentEntry[]> {
  return parseList<RecentEntry>(await redis.lrange(K.recent(), 0, limit - 1));
}

export async function readRejects(limit = 200): Promise<RejectEntry[]> {
  return parseList<RejectEntry>(await redis.lrange(K.rejects(), 0, limit - 1));
}
