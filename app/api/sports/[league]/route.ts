import { NextRequest, NextResponse } from 'next/server';

const SCOREBOARD: Record<string, string> = {
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
};

const SUMMARY: Record<string, string> = {
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ league: string }> },
) {
  const { league } = await params;
  if (!SCOREBOARD[league]) {
    return NextResponse.json({ error: 'Unknown league' }, { status: 400 });
  }

  const eventId = req.nextUrl.searchParams.get('event');
  const url = eventId ? `${SUMMARY[league]}?event=${eventId}` : SCOREBOARD[league];

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ error: `ESPN ${res.status}` }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data);
}
