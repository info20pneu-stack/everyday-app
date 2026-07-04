import { NextRequest } from 'next/server';
import { redis } from './redis';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

function sessionKey(token: string) {
  return `admin:session:${token}`;
}

export async function createAdminSession(): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await redis.set(sessionKey(token), Date.now(), { ex: SESSION_TTL_SEC });
  return token;
}

export async function destroyAdminSession(token: string): Promise<void> {
  await redis.del(sessionKey(token));
}

export async function isAdminAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const val = await redis.get(sessionKey(token));
  return val !== null;
}
