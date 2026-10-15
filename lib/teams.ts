export type League = 'nhl' | 'nba' | 'nfl';
export type TeamOption = { abbr: string; name: string };

export const NHL_TEAMS: TeamOption[] = [
  { abbr: 'ANA', name: 'Anaheim Ducks' },
  { abbr: 'BOS', name: 'Boston Bruins' },
  { abbr: 'BUF', name: 'Buffalo Sabres' },
  { abbr: 'CGY', name: 'Calgary Flames' },
  { abbr: 'CAR', name: 'Carolina Hurricanes' },
  { abbr: 'CHI', name: 'Chicago Blackhawks' },
  { abbr: 'COL', name: 'Colorado Avalanche' },
  { abbr: 'CBJ', name: 'Columbus Blue Jackets' },
  { abbr: 'DAL', name: 'Dallas Stars' },
  { abbr: 'DET', name: 'Detroit Red Wings' },
  { abbr: 'EDM', name: 'Edmonton Oilers' },
  { abbr: 'FLA', name: 'Florida Panthers' },
  { abbr: 'LAK', name: 'Los Angeles Kings' },
  { abbr: 'MIN', name: 'Minnesota Wild' },
  { abbr: 'MTL', name: 'Montreal Canadiens' },
  { abbr: 'NSH', name: 'Nashville Predators' },
  { abbr: 'NJ',  name: 'New Jersey Devils' },
  { abbr: 'NYI', name: 'New York Islanders' },
  { abbr: 'NYR', name: 'New York Rangers' },
  { abbr: 'OTT', name: 'Ottawa Senators' },
  { abbr: 'PHI', name: 'Philadelphia Flyers' },
  { abbr: 'PIT', name: 'Pittsburgh Penguins' },
  { abbr: 'SJ',  name: 'San Jose Sharks' },
  { abbr: 'SEA', name: 'Seattle Kraken' },
  { abbr: 'STL', name: 'St. Louis Blues' },
  { abbr: 'TB',  name: 'Tampa Bay Lightning' },
  { abbr: 'TOR', name: 'Toronto Maple Leafs' },
  { abbr: 'UTA', name: 'Utah Hockey Club' },
  { abbr: 'VAN', name: 'Vancouver Canucks' },
  { abbr: 'VGK', name: 'Vegas Golden Knights' },
  { abbr: 'WSH', name: 'Washington Capitals' },
  { abbr: 'WPG', name: 'Winnipeg Jets' },
];

export const NBA_TEAMS: TeamOption[] = [
  { abbr: 'ATL',  name: 'Atlanta Hawks' },
  { abbr: 'BOS',  name: 'Boston Celtics' },
  { abbr: 'BKN',  name: 'Brooklyn Nets' },
  { abbr: 'CHA',  name: 'Charlotte Hornets' },
  { abbr: 'CHI',  name: 'Chicago Bulls' },
  { abbr: 'CLE',  name: 'Cleveland Cavaliers' },
  { abbr: 'DAL',  name: 'Dallas Mavericks' },
  { abbr: 'DEN',  name: 'Denver Nuggets' },
  { abbr: 'DET',  name: 'Detroit Pistons' },
  { abbr: 'GS',   name: 'Golden State Warriors' },
  { abbr: 'HOU',  name: 'Houston Rockets' },
  { abbr: 'IND',  name: 'Indiana Pacers' },
  { abbr: 'LAC',  name: 'LA Clippers' },
  { abbr: 'LAL',  name: 'Los Angeles Lakers' },
  { abbr: 'MEM',  name: 'Memphis Grizzlies' },
  { abbr: 'MIA',  name: 'Miami Heat' },
  { abbr: 'MIL',  name: 'Milwaukee Bucks' },
  { abbr: 'MIN',  name: 'Minnesota Timberwolves' },
  { abbr: 'NO',   name: 'New Orleans Pelicans' },
  { abbr: 'NY',   name: 'New York Knicks' },
  { abbr: 'OKC',  name: 'Oklahoma City Thunder' },
  { abbr: 'ORL',  name: 'Orlando Magic' },
  { abbr: 'PHI',  name: 'Philadelphia 76ers' },
  { abbr: 'PHX',  name: 'Phoenix Suns' },
  { abbr: 'POR',  name: 'Portland Trail Blazers' },
  { abbr: 'SAC',  name: 'Sacramento Kings' },
  { abbr: 'SA',   name: 'San Antonio Spurs' },
  { abbr: 'TOR',  name: 'Toronto Raptors' },
  { abbr: 'UTAH', name: 'Utah Jazz' },
  { abbr: 'WSH',  name: 'Washington Wizards' },
];

export const NFL_TEAMS: TeamOption[] = [
  { abbr: 'ARI', name: 'Arizona Cardinals' },
  { abbr: 'ATL', name: 'Atlanta Falcons' },
  { abbr: 'BAL', name: 'Baltimore Ravens' },
  { abbr: 'BUF', name: 'Buffalo Bills' },
  { abbr: 'CAR', name: 'Carolina Panthers' },
  { abbr: 'CHI', name: 'Chicago Bears' },
  { abbr: 'CIN', name: 'Cincinnati Bengals' },
  { abbr: 'CLE', name: 'Cleveland Browns' },
  { abbr: 'DAL', name: 'Dallas Cowboys' },
  { abbr: 'DEN', name: 'Denver Broncos' },
  { abbr: 'DET', name: 'Detroit Lions' },
  { abbr: 'GB',  name: 'Green Bay Packers' },
  { abbr: 'HOU', name: 'Houston Texans' },
  { abbr: 'IND', name: 'Indianapolis Colts' },
  { abbr: 'JAX', name: 'Jacksonville Jaguars' },
  { abbr: 'KC',  name: 'Kansas City Chiefs' },
  { abbr: 'LV',  name: 'Las Vegas Raiders' },
  { abbr: 'LAC', name: 'Los Angeles Chargers' },
  { abbr: 'LAR', name: 'Los Angeles Rams' },
  { abbr: 'MIA', name: 'Miami Dolphins' },
  { abbr: 'MIN', name: 'Minnesota Vikings' },
  { abbr: 'NE',  name: 'New England Patriots' },
  { abbr: 'NO',  name: 'New Orleans Saints' },
  { abbr: 'NYG', name: 'New York Giants' },
  { abbr: 'NYJ', name: 'New York Jets' },
  { abbr: 'PHI', name: 'Philadelphia Eagles' },
  { abbr: 'PIT', name: 'Pittsburgh Steelers' },
  { abbr: 'SF',  name: 'San Francisco 49ers' },
  { abbr: 'SEA', name: 'Seattle Seahawks' },
  { abbr: 'TB',  name: 'Tampa Bay Buccaneers' },
  { abbr: 'TEN', name: 'Tennessee Titans' },
  { abbr: 'WSH', name: 'Washington Commanders' },
];

export const TEAMS_BY_LEAGUE: Record<League, TeamOption[]> = {
  nhl: NHL_TEAMS,
  nba: NBA_TEAMS,
  nfl: NFL_TEAMS,
};

export const LEAGUE_META: Record<League, { label: string; emoji: string; sportPath: string }> = {
  nhl: { label: 'NHL', emoji: '🏒', sportPath: 'hockey/nhl' },
  nba: { label: 'NBA', emoji: '🏀', sportPath: 'basketball/nba' },
  nfl: { label: 'NFL', emoji: '🏈', sportPath: 'football/nfl' },
};

/* ═══════════════════════ "My Team" — shared selection + match lookup ═══════════════════════ */

export type MyTeam = { league: League; abbr: string };
export const MY_TEAM_KEY = 'myday_team_v1';

export type MatchInfo = { dateStr: string; homeAway: 'vs' | '@'; oppName: string; score: string | null };

export function formatTeamMatch(event: any, myAbbr: string): MatchInfo | null {
  const comp = event?.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const me  = competitors.find((c: any) => c.team?.abbreviation === myAbbr);
  const opp = competitors.find((c: any) => c.team?.abbreviation !== myAbbr);
  if (!me || !opp) return null;
  const dateStr = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const homeAway = me.homeAway === 'home' ? 'vs' : '@';
  const oppName = opp.team?.shortDisplayName ?? opp.team?.abbreviation ?? '?';
  const score = me.score != null && opp.score != null ? `${me.score}-${opp.score}` : null;
  return { dateStr, homeAway, oppName, score };
}

export async function fetchMyTeamMatches(league: League, abbr: string): Promise<{ last: MatchInfo | null; next: MatchInfo | null }> {
  const res = await fetch(`/api/sports/${league}?team=${abbr}`);
  if (!res.ok) throw new Error('sports fetch failed');
  const data = await res.json();
  const events: any[] = data.events ?? [];
  const now = Date.now();
  let lastEvent: any = null;
  let nextEvent: any = null;
  for (const e of events) {
    const statusName = e.competitions?.[0]?.status?.type?.name ?? '';
    const time = new Date(e.date).getTime();
    if (statusName === 'STATUS_FINAL') {
      if (!lastEvent || time > new Date(lastEvent.date).getTime()) lastEvent = e;
    } else if (time >= now) {
      if (!nextEvent || time < new Date(nextEvent.date).getTime()) nextEvent = e;
    }
  }
  return {
    last: lastEvent ? formatTeamMatch(lastEvent, abbr) : null,
    next: nextEvent ? formatTeamMatch(nextEvent, abbr) : null,
  };
}

export function loadMyTeam(): MyTeam | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MY_TEAM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveMyTeam(team: MyTeam | null) {
  try {
    if (team) localStorage.setItem(MY_TEAM_KEY, JSON.stringify(team));
    else localStorage.removeItem(MY_TEAM_KEY);
  } catch {}
}
