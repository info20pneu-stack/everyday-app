import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, destroyAdminSession } from '../../../../lib/adminAuth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await destroyAdminSession(token);

  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  return res;
}
