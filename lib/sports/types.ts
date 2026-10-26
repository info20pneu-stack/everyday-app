/* Shapes the sports API (/api/sports/<league>/<view>) sends to the browser.
   Built on the server from ESPN data (lib/sports/espn.server.ts). */

export type ProLeague = 'nhl' | 'nba' | 'nfl';

export interface SportTeam {
  id: string;
  abbr: string;
  /** Full name, e.g. "Boston Bruins". */
  name: string;
  /** Short name, e.g. "Bruins". */
  short: string;
  /** Primary team colour as #rrggbb (ESPN team.color). */
  color: string;
}

/** Column keys, translated on the client through lib/sportsI18n.ts. */
export type StandingCol = 'gp' | 'w' | 'l' | 'otl' | 't' | 'd' | 'pct' | 'gb' | 'diff' | 'gd' | 'pts';

export interface StandingRow {
  team: SportTeam;
  /** Play-off seed in the conference (ESPN playoffSeed), when known. */
  seed?: number;
  /** In a play-off (or next-round) position right now. */
  qualified: boolean;
  values: Partial<Record<StandingCol, string>>;
}

export interface StandingGroup {
  id: string;
  /** Name as ESPN gives it, e.g. "Atlantic", "AFC East"; empty for the whole league. */
  name: string;
  /** Conference the group belongs to (for colouring / labels). */
  conference?: 'east' | 'west' | 'afc' | 'nfc';
  rows: StandingRow[];
  /** Rows above the dashed play-off line (0 = no line). */
  lineAfter: number;
}

export interface StandingsPayload {
  league: ProLeague;
  /** Season label, e.g. "2026/27". */
  season: string;
  updatedAt: number;
  columns: StandingCol[];
  overall: StandingGroup[];
  conference: StandingGroup[];
  division: StandingGroup[];
}

export type LeaderCol = 'g' | 'a' | 'pts' | 'ppg' | 'rpg' | 'apg' | 'passYdsShort' | 'td' | 'int';

export interface LeaderRow {
  rank: number;
  name: string;
  team: SportTeam;
  values: string[];
}

export interface LeadersPayload {
  league: ProLeague;
  season: string;
  updatedAt: number;
  columns: LeaderCol[];
  rows: LeaderRow[];
}

export interface PlayoffSeries {
  id: string;
  a: SportTeam;
  b: SportTeam;
  /** Series wins (NHL / NBA) or the score (NFL single games). */
  aWins: number;
  bWins: number;
  completed: boolean;
  /** Winner team id when completed. */
  winner?: string;
  conference?: 'east' | 'west' | 'afc' | 'nfc';
}

export interface PlayoffRound {
  /** 1 = first round / wild card … 4 = final / Super Bowl. */
  stage: 1 | 2 | 3 | 4;
  series: PlayoffSeries[];
}

export interface PlayoffsPayload {
  league: ProLeague;
  season: string;
  updatedAt: number;
  /** False until the current season's play-off has started — the tab is hidden then. */
  active: boolean;
  /** Best-of series (NHL, NBA) or single games (NFL). */
  bestOf: boolean;
  rounds: PlayoffRound[];
}

/* ── FIFA World Cup 2026 ── */

export type WcStage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

export interface WcTeam extends SportTeam {
  /** ISO 3166 alpha-2 code (or gb-eng etc.) for the flag and the translated name, when known. */
  iso?: string;
}

export interface WcGroupRow {
  team: WcTeam;
  values: Record<'gp' | 'w' | 'd' | 'l' | 'gd' | 'pts', string>;
  qualified: boolean;
}

export interface WcGroup { letter: string; rows: WcGroupRow[] }

export interface WcMatch {
  id: string;
  stage: WcStage;
  /** Group letter (group stage only). */
  group?: string;
  /** 1–3 in the group stage. */
  matchday?: number;
  date: string;
  status: 'upcoming' | 'live' | 'final';
  /** Live minute, e.g. "67'". */
  clock?: string;
  home: WcTeam;
  away: WcTeam;
  homeScore?: number;
  awayScore?: number;
  /** Penalty shoot-out score. */
  homePens?: number;
  awayPens?: number;
  winner?: 'home' | 'away';
  venue?: string;
  city?: string;
}

export interface WorldCupPayload {
  updatedAt: number;
  groups: WcGroup[];
  matches: WcMatch[];
}
