import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSession } from '../../../../lib/adminAuth';

export async function POST(req: NextRequest) {
  const configured = process.env.ADMIN_PASSWORD;
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

  if (!body?.password || body.password !== configured) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = await createAdminSession();
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
