import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/* HMAC signing with DEVICE_SECRET (server only). Each use gets its own label so a value signed
   for one purpose (a device id) can never pass as another (a game session). */

function secret(): string {
  const s = process.env.DEVICE_SECRET;
  if (!s || s.length < 16) throw new Error('DEVICE_SECRET is missing or too short');
  return s;
}

export function sign(label: string, value: string): string {
  return createHmac('sha256', secret()).update(`${label}\u0000${value}`).digest('base64url');
}

export function verify(label: string, value: string, signature: string): boolean {
  const expected = Buffer.from(sign(label, value));
  const got = Buffer.from(signature);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export const randomId = (bytes = 16) => randomBytes(bytes).toString('base64url');
