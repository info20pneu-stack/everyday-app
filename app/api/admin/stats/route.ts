import { NextRequest, NextResponse } from 'next/server';
import { redis } from '../../../../lib/redis';
import { isAdminAuthed } from '../../../../lib/adminAuth';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const DAYS_IN_SERIES = 30;

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function topEntries(hash: Record<string, unknown> | null, limit: number): { key: string; count: number }[] {
  if (!hash) return [];
  return Object.entries(hash)
    .map(([key, value]) => ({ key, count: Number(value) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const seriesDays = Array.from({ length: DAYS_IN_SERIES }, (_, i) => dateKey(DAYS_IN_SERIES - 1 - i));
    const seriesKeys = seriesDays.map(d => `stats:visits:d:${d}`);

    const [pagesHash, countryHash, seriesCounts, activeUsers] = await Promise.all([
      redis.hgetall<Record<string, number>>('stats:pages:all'),
      redis.hgetall<Record<string, number>>('stats:country:all'),
      redis.mget<(number | null)[]>(...seriesKeys),
      redis.zcount('stats:active', Date.now() - ACTIVE_WINDOW_MS, '+inf'),
    ]);

    const series = seriesDays.map((date, i) => ({ date, visits: Number(seriesCounts[i]) || 0 }));

    const today = series[series.length - 1]?.visits ?? 0;
    const week = series.slice(-7).reduce((sum, d) => sum + d.visits, 0);
    const month = series.reduce((sum, d) => sum + d.visits, 0);

    return NextResponse.json({
      today,
      week,
      month,
      activeUsers,
      topPages: topEntries(pagesHash, 10),
      topCountries: topEntries(countryHash, 10),
      series,
    });
  } catch (err) {
    console.error('[admin/stats] error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
