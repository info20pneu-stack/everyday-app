import type { NextRequest, NextResponse } from 'next/server';
import { randomId, sign, verify } from './crypto';

/* Anonymous device identity: cookie `ed_dev` = "<id>.<hmac>" (httpOnly, secure, sameSite=lax).
   Issued by POST /api/game/start, so it exists before the first score is saved.
   A score without a valid cookie is refused. */

export const DEVICE_COOKIE = 'ed_dev';
const LABEL = 'device';
const MAX_AGE = 2 * 365 * 24 * 60 * 60;

/** The device id from a valid cookie, or null. */
export function readDevice(req: NextRequest): string | null {
  const raw = req.cookies.get(DEVICE_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = raw.slice(0, dot), mac = raw.slice(dot + 1);
  return /^[A-Za-z0-9_-]{16,40}$/.test(id) && verify(LABEL, id, mac) ? id : null;
}

export function newDeviceId(): string {
  return randomId(16);
}

export function setDeviceCookie(res: NextResponse, id: string) {
  res.cookies.set(DEVICE_COOKIE, `${id}.${sign(LABEL, id)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}
