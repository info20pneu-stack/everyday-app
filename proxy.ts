import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from './lib/redis';

const VISITOR_COOKIE = 'ea_vid';
const ACTIVE_TTL_MS = 5 * 60 * 1000;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (process.env.NEXT_PUBLIC_MAINTENANCE === 'true' && pathname !== '/maintenance') {
    return NextResponse.rewrite(new URL('/maintenance', req.url));
  }

  const country = req.headers.get('x-vercel-ip-country') || 'XX';
  const existingVid = req.cookies.get(VISITOR_COOKIE)?.value;
  const vid = existingVid || crypto.randomUUID();

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(`stats:visits:d:${todayKey()}`);
    pipeline.hincrby('stats:pages:all', pathname, 1);
    pipeline.hincrby('stats:country:all', country, 1);
    pipeline.zadd('stats:active', { score: Date.now(), member: vid });
    // Occasionally trim stale entries so the active-users set doesn't grow forever.
    if (Math.random() < 0.05) {
      pipeline.zremrangebyscore('stats:active', 0, Date.now() - ACTIVE_TTL_MS);
    }
    await pipeline.exec();
  } catch (err) {
    console.error('[proxy] visit tracking failed:', err);
  }

  const res = NextResponse.next();
  if (!existingVid) {
    res.cookies.set(VISITOR_COOKIE, vid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|admin|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.webp$).*)',
  ],
};
