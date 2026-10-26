import { NextResponse } from 'next/server';
import { CACHE_MS, getLeaders, getPlayoffs, getStandings, getWorldCup } from '../../../../../lib/sports/espn.server';
import type { ProLeague } from '../../../../../lib/sports/types';

/* Live tables for the sports page, from ESPN (cached on the server for 10 minutes):
     /api/sports/<nhl|nba|nfl>/standings   league, conference and division tables
     /api/sports/<nhl|nba|nfl>/leaders     top 10 players (NHL points, NBA points per game, NFL passing yards)
     /api/sports/<nhl|nba|nfl>/playoffs    play-off of the current season (active: false before it starts)
     /api/sports/wc2026/tournament         FIFA World Cup 2026 groups and matches
   On an ESPN failure the route answers 502 — the page shows a message instead of old data. */

const PRO = new Set(['nhl', 'nba', 'nfl']);

export async function GET(_req: Request, { params }: { params: Promise<{ league: string; view: string }> }) {
  const { league, view } = await params;
  try {
    let data: { updatedAt: number };
    if (league === 'wc2026' && view === 'tournament') data = await getWorldCup();
    else if (PRO.has(league) && view === 'standings') data = await getStandings(league as ProLeague);
    else if (PRO.has(league) && view === 'leaders') data = await getLeaders(league as ProLeague);
    else if (PRO.has(league) && view === 'playoffs') data = await getPlayoffs(league as ProLeague);
    else return NextResponse.json({ error: 'Unknown league or view' }, { status: 404 });

    // CDN keeps the answer only for what is left of the 10 minutes
    const left = Math.max(0, Math.round((data.updatedAt + CACHE_MS - Date.now()) / 1000));
    return NextResponse.json(data, { headers: { 'Cache-Control': `public, s-maxage=${left}, max-age=0` } });
  } catch (err) {
    console.error(`[sports ${league}/${view}]`, err);
    return NextResponse.json({ error: 'Sports data unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
