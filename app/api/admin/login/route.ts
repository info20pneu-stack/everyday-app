import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSession } from '../../../../lib/adminAuth';

export async function POST(req: NextRequest) {
  const configured = process.env.ADMIN_PASSWORD;
  console.log('[admin/login] ADMIN_PASSWORD configured:', Boolean(configured));
  if (!configured) {
    console.error('[admin/login] MISSING env: ADMIN_PASSWORD');
    return NextResponse.json({ error: 'Admin login is not configured' }, { status: 500 });
  }

  let body: { password?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const match = !!body?.password && body.password === configured;
  console.log('[admin/login] password match:', match);
  if (!match) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  let token: string;
  try {
    token = await createAdminSession();
  } catch (e) {
    console.error('[admin/login] createAdminSession failed (check Redis/KV env vars):', e);
    return NextResponse.json({ error: 'Admin session store is not configured (Redis)' }, { status: 500 });
  }

  console.log('[admin/login] session created, setting cookie');
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
