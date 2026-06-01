'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import WC2026 from './WC2026';

/* ═══════════════════════ TYPES ═══════════════════════ */

type GameStatus = 'live' | 'final' | 'upcoming' | 'postponed';
type LeagueId = 'nhl' | 'nba' | 'nfl' | 'wc2026';
type FetchState = 'idle' | 'loading' | 'ok' | 'error';

type Team = {
  id: string;
  abbr: string;
  name: string;
  color: string;
  score?: number;
  record?: string;
  logo?: string;
};

type Game = {
  id: string;
  home: Team;
  away: Team;
  status: GameStatus;
  period?: string;
  time?: string;
  scheduledTime?: string;
  date?: string;
};

type PeriodScore = { label: string; home: number; away: number };
type TopPerformer = { team: string; player: string; line: string };

type GameDetail = {
  periodScores: PeriodScore[];
  performers: TopPerformer[];
  homeStats: Record<string, string>;
  awayStats: Record<string, string>;
  statLabels: string[];
  venue?: string;
  attendance?: string;
};

type StandingRow = { rank: number; abbr: string; name: string; color: string; cols: string[] };
type LeagueCache = { games: Game[]; state: FetchState; error?: string };
type DetailCache = { detail: GameDetail | null; state: FetchState };

/* ═══════════════════════ ESPN CONFIG ═══════════════════════ */

const ESPN_CONFIG = {
  nhl: {
    label: 'NHL', emoji: '🏒',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    summaryUrl:    'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary',
    periodLabel: (p: number) => p <= 3 ? `${p}.` : 'PP',
    statKeys:   ['shots', 'powerPlayGoals', 'penaltyMinutes', 'hits', 'faceOffWinPercentage'],
    statLabels: ['Střely', 'PP branky', 'PIM', 'Hity', 'Vhazování %'],
  },
  nba: {
    label: 'NBA', emoji: '🏀',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    summaryUrl:    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary',
    periodLabel: (p: number) => p <= 4 ? `Q${p}` : 'OT',
    statKeys:   ['fieldGoalPct', 'threePointPct', 'freeThrowPct', 'totalRebounds', 'assists', 'turnovers'],
    statLabels: ['FG%', '3P%', 'FT%', 'Doskoky', 'Asistence', 'Ztráty'],
  },
  nfl: {
    label: 'NFL', emoji: '🏈',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    summaryUrl:    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary',
    periodLabel: (p: number) => p <= 4 ? `Q${p}` : 'OT',
    statKeys:   ['netPassingYards', 'rushingYards', 'turnovers', 'sacks', 'possessionTime'],
    statLabels: ['Pass yds', 'Rush yds', 'Ztráty', 'Sacks', 'Drž. míče'],
  },
} as const;

/* ═══════════════════════ MOCK STANDINGS (ESPN standings API vrací neúplná data) ═══════════════════════ */

/* ── NHL extended data ── */
interface Scorer { rank: number; name: string; team: string; color: string; goals: number; assists: number; pts: number; }
const NHL_EAST = [
  { conf: 'Atlantic', headers: ['ZP','V','P','PP','B'], rows: [
    { rank:1, abbr:'FLA', name:'Panthers',    color:'#C8102E', cols:['82','52','20','10','114'] },
    { rank:2, abbr:'TBL', name:'Lightning',   color:'#002868', cols:['82','48','24','10','106'] },
    { rank:3, abbr:'BOS', name:'Bruins',      color:'#FFB81C', cols:['82','48','26','8', '104'] },
    { rank:4, abbr:'TOR', name:'Maple Leafs', color:'#003E7E', cols:['82','46','26','10','102'] },
    { rank:5, abbr:'BUF', name:'Sabres',      color:'#002654', cols:['82','40','35','7', '87'] },
    { rank:6, abbr:'OTT', name:'Senators',    color:'#E31837', cols:['82','36','38','8', '80'] },
    { rank:7, abbr:'MTL', name:'Canadiens',   color:'#AF1E2D', cols:['82','30','44','8', '68'] },
  ]},
  { conf: 'Metropolitan', headers: ['ZP','V','P','PP','B'], rows: [
    { rank:1, abbr:'NYR', name:'Rangers',     color:'#0038A8', cols:['82','55','19','8','118'] },
    { rank:2, abbr:'CAR', name:'Hurricanes',  color:'#CC0000', cols:['82','52','21','9','113'] },
    { rank:3, abbr:'PIT', name:'Penguins',    color:'#FCB514', cols:['82','42','31','9', '93'] },
    { rank:4, abbr:'WSH', name:'Capitals',    color:'#041E42', cols:['82','40','34','8', '88'] },
    { rank:5, abbr:'PHI', name:'Flyers',      color:'#F74902', cols:['82','38','36','8', '84'] },
    { rank:6, abbr:'NJD', name:'Devils',      color:'#CE1126', cols:['82','35','39','8', '78'] },
    { rank:7, abbr:'NYI', name:'Islanders',   color:'#00539B', cols:['82','32','43','7', '71'] },
  ]},
];
const NHL_WEST = [
  { conf: 'Central', headers: ['ZP','V','P','PP','B'], rows: [
    { rank:1, abbr:'COL', name:'Avalanche',    color:'#6F263D', cols:['82','58','18','6','122'] },
    { rank:2, abbr:'DAL', name:'Stars',        color:'#006847', cols:['82','52','22','8','112'] },
    { rank:3, abbr:'NSH', name:'Predators',    color:'#FFB81C', cols:['82','45','28','9', '99'] },
    { rank:4, abbr:'STL', name:'Blues',        color:'#002F87', cols:['82','42','32','8', '92'] },
    { rank:5, abbr:'MIN', name:'Wild',         color:'#154734', cols:['82','39','35','8', '86'] },
    { rank:6, abbr:'WPG', name:'Jets',         color:'#041E42', cols:['82','38','36','8', '84'] },
    { rank:7, abbr:'CHI', name:'Blackhawks',   color:'#CF0A2C', cols:['82','28','48','6', '62'] },
  ]},
  { conf: 'Pacific', headers: ['ZP','V','P','PP','B'], rows: [
    { rank:1, abbr:'EDM', name:'Oilers',         color:'#FF4C00', cols:['82','55','21','6','116'] },
    { rank:2, abbr:'VGK', name:'Golden Knights', color:'#B4975A', cols:['82','50','25','7','107'] },
    { rank:3, abbr:'VAN', name:'Canucks',        color:'#00843D', cols:['82','46','28','8','100'] },
    { rank:4, abbr:'LAK', name:'Kings',          color:'#111111', cols:['82','44','30','8', '96'] },
    { rank:5, abbr:'CGY', name:'Flames',         color:'#C8102E', cols:['82','39','36','7', '85'] },
    { rank:6, abbr:'SEA', name:'Kraken',         color:'#96D8D8', cols:['82','36','40','6', '78'] },
    { rank:7, abbr:'ANA', name:'Ducks',          color:'#F47A38', cols:['82','30','46','6', '66'] },
  ]},
];
const NHL_SCORERS: Scorer[] = [
  { rank:1, name:'Connor McDavid',   team:'EDM', color:'#FF4C00', goals:62, assists:75, pts:137 },
  { rank:2, name:'Leon Draisaitl',   team:'EDM', color:'#FF4C00', goals:54, assists:67, pts:121 },
  { rank:3, name:'Nathan MacKinnon', team:'COL', color:'#6F263D', goals:49, assists:70, pts:119 },
  { rank:4, name:'Nikita Kucherov',  team:'TBL', color:'#002868', goals:42, assists:72, pts:114 },
  { rank:5, name:'David Pastrnak',   team:'BOS', color:'#FFB81C', goals:55, assists:54, pts:109 },
  { rank:6, name:'Artemi Panarin',   team:'NYR', color:'#0038A8', goals:35, assists:72, pts:107 },
  { rank:7, name:'Sam Reinhart',     team:'FLA', color:'#C8102E', goals:46, assists:58, pts:104 },
  { rank:8, name:'Mitch Marner',     team:'TOR', color:'#003E7E', goals:28, assists:75, pts:103 },
  { rank:9, name:'Kyle Connor',      team:'WPG', color:'#041E42', goals:45, assists:57, pts:102 },
  { rank:10,name:'Jason Robertson', team:'DAL', color:'#006847', goals:48, assists:52, pts:100 },
];
type NhlView = 'league' | 'conference' | 'scorers' | 'playoff';
const NHL_PLAYOFF: { round: string; matches: Array<{t1:string;c1:string;s1:number;t2:string;c2:string;s2:number;done:boolean}> }[] = [
  { round:'First Round', matches:[
    {t1:'EDM',c1:'#FF4C00',s1:4,t2:'LAK',c2:'#111',s2:2,done:true},
    {t1:'VGK',c1:'#B4975A',s1:4,t2:'VAN',c2:'#00843D',s2:3,done:true},
    {t1:'COL',c1:'#6F263D',s1:4,t2:'DAL',c2:'#006847',s2:1,done:true},
    {t1:'NYR',c1:'#0038A8',s1:4,t2:'WSH',c2:'#041E42',s2:2,done:true},
    {t1:'FLA',c1:'#C8102E',s1:4,t2:'TBL',c2:'#002868',s2:3,done:true},
    {t1:'CAR',c1:'#CC0000',s1:4,t2:'PIT',c2:'#FCB514',s2:0,done:true},
    {t1:'BOS',c1:'#FFB81C',s1:4,t2:'TOR',c2:'#003E7E',s2:3,done:true},
    {t1:'DAL',c1:'#006847',s1:4,t2:'NSH',c2:'#FFB81C',s2:2,done:true},
  ]},
  { round:'Second Round', matches:[
    {t1:'EDM',c1:'#FF4C00',s1:4,t2:'VGK',c2:'#B4975A',s2:2,done:true},
    {t1:'COL',c1:'#6F263D',s1:3,t2:'NYR',c2:'#0038A8',s2:4,done:true},
    {t1:'FLA',c1:'#C8102E',s1:4,t2:'CAR',c2:'#CC0000',s2:1,done:true},
    {t1:'BOS',c1:'#FFB81C',s1:4,t2:'DAL',c2:'#006847',s2:3,done:true},
  ]},
  { round:'Conference Finals', matches:[
    {t1:'EDM',c1:'#FF4C00',s1:2,t2:'NYR',c2:'#0038A8',s2:2,done:false},
    {t1:'FLA',c1:'#C8102E',s1:3,t2:'BOS',c2:'#FFB81C',s2:2,done:false},
  ]},
  { round:'Stanley Cup Final', matches:[
    {t1:'TBD',c1:'#555',s1:0,t2:'TBD',c2:'#555',s2:0,done:false},
  ]},
];

const STANDINGS: Partial<Record<LeagueId, { rows: StandingRow[]; headers: string[] }>> = {
  nhl: {
    headers: ['ZP', 'V', 'P', 'PP', 'B', '+/-'],
    rows: [
      { rank: 1, abbr: 'FLA', name: 'Panthers',       color: '#C8102E', cols: ['72','44','19','9', '97','+44'] },
      { rank: 2, abbr: 'COL', name: 'Avalanche',      color: '#6F263D', cols: ['70','45','18','7', '97','+62'] },
      { rank: 3, abbr: 'NYR', name: 'Rangers',         color: '#0038A8', cols: ['73','42','20','11','95','+31'] },
      { rank: 4, abbr: 'BOS', name: 'Bruins',          color: '#FFB81C', cols: ['71','41','22','8', '90','+28'] },
      { rank: 5, abbr: 'TOR', name: 'Maple Leafs',     color: '#003E7E', cols: ['73','38','25','10','86','+11'] },
      { rank: 6, abbr: 'EDM', name: 'Oilers',          color: '#FF4C00', cols: ['73','40','25','8', '88','+17'] },
      { rank: 7, abbr: 'VGK', name: 'Golden Knights',  color: '#B4975A', cols: ['72','40','23','9', '89','+19'] },
      { rank: 8, abbr: 'TBL', name: 'Lightning',       color: '#002868', cols: ['72','39','24','9', '87', '+8'] },
      { rank: 9, abbr: 'CGY', name: 'Flames',          color: '#C8102E', cols: ['72','35','27','10','80', '-9'] },
    ],
  },
  nba: {
    headers: ['ZP', 'V', 'P', 'PCT', 'GB'],
    rows: [
      { rank: 1, abbr: 'BOS', name: 'Celtics',          color: '#007A33', cols: ['71','54','17','.761','—'  ] },
      { rank: 2, abbr: 'DEN', name: 'Nuggets',           color: '#0E2240', cols: ['70','52','18','.743','1.5'] },
      { rank: 3, abbr: 'MIN', name: 'Timberwolves',      color: '#0C2340', cols: ['71','49','22','.690','5'  ] },
      { rank: 4, abbr: 'MIL', name: 'Bucks',             color: '#00471B', cols: ['71','47','24','.662','7.5'] },
      { rank: 5, abbr: 'DAL', name: 'Mavericks',         color: '#00538C', cols: ['70','39','31','.557','14.5'] },
      { rank: 6, abbr: 'GSW', name: 'Warriors',          color: '#1D428A', cols: ['71','40','31','.563','14' ] },
      { rank: 7, abbr: 'LAL', name: 'Lakers',            color: '#552583', cols: ['71','38','33','.535','16' ] },
      { rank: 8, abbr: 'PHX', name: 'Suns',              color: '#E56020', cols: ['71','36','35','.507','18' ] },
    ],
  },
  nfl: {
    headers: ['ZP', 'V', 'P', 'R', 'PCT'],
    rows: [
      { rank: 1, abbr: 'KC',  name: 'Chiefs',      color: '#E31837', cols: ['17','14','3','0','.824'] },
      { rank: 2, abbr: 'BAL', name: 'Ravens',      color: '#241773', cols: ['17','13','4','0','.765'] },
      { rank: 3, abbr: 'BUF', name: 'Bills',       color: '#00338D', cols: ['17','13','4','0','.765'] },
      { rank: 4, abbr: 'DET', name: 'Lions',       color: '#0076B6', cols: ['17','13','4','0','.765'] },
      { rank: 5, abbr: 'WAS', name: 'Commanders',  color: '#5A1414', cols: ['17','12','5','0','.706'] },
      { rank: 6, abbr: 'SF',  name: '49ers',       color: '#AA0000', cols: ['17','12','5','0','.706'] },
      { rank: 7, abbr: 'PHI', name: 'Eagles',      color: '#004C54', cols: ['17','11','6','0','.647'] },
      { rank: 8, abbr: 'HOU', name: 'Texans',      color: '#03202F', cols: ['17','11','6','0','.647'] },
    ],
  },
};

/* ═══════════════════════ ESPN PARSERS ═══════════════════════ */

function parseStatus(espnStatus: any): GameStatus {
  const name: string = espnStatus?.type?.name ?? '';
  if (name.startsWith('STATUS_FINAL') || name === 'STATUS_FULL_TIME') return 'final';
  if (name === 'STATUS_SCHEDULED') return 'upcoming';
  if (name === 'STATUS_POSTPONED' || name === 'STATUS_CANCELED') return 'postponed';
  return 'live';
}

function parseTeam(competitor: any): Team {
  const team = competitor.team ?? {};
  const color = team.color ? '#' + team.color : '#445566';
  return {
    id: team.id ?? '',
    abbr: team.abbreviation ?? '?',
    name: team.displayName ?? team.name ?? '?',
    color,
    score: competitor.score != null ? Math.round(parseFloat(competitor.score)) : undefined,
    record: competitor.records?.[0]?.summary,
    logo: team.logo,
  };
}

function formatScheduledTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function parseGames(data: any, leagueId: LeagueId): Game[] {
  const cfg = ESPN_CONFIG[leagueId as keyof typeof ESPN_CONFIG];
  if (!cfg) return [];
  return (data.events ?? []).flatMap((event: any): Game[] => {
    const comp = event.competitions?.[0];
    if (!comp) return [];
    const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
    if (!home || !away) return [];
    const status = parseStatus(comp.status);
    const period = comp.status?.period ?? 0;
    return [{
      id: event.id,
      home: parseTeam(home),
      away: parseTeam(away),
      status,
      period: status === 'live' && period ? cfg.periodLabel(period) : undefined,
      time:   status === 'live' ? comp.status?.displayClock : undefined,
      scheduledTime: status === 'upcoming' ? formatScheduledTime(event.date) : undefined,
    }];
  });
}

function parseDetail(data: any, home: Team, away: Team, leagueId: LeagueId): GameDetail {
  const cfg = ESPN_CONFIG[leagueId as keyof typeof ESPN_CONFIG] ?? ESPN_CONFIG.nhl;

  /* Period scores */
  const comp = data.header?.competitions?.[0];
  const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');
  const homeLines: any[] = homeComp?.linescores ?? [];
  const awayLines: any[] = awayComp?.linescores ?? [];
  const periodScores: PeriodScore[] = homeLines.map((ls: any, i: number) => ({
    label: cfg.periodLabel(i + 1),
    home: parseFloat(ls.displayValue ?? ls.value ?? '0') || 0,
    away: parseFloat(awayLines[i]?.displayValue ?? awayLines[i]?.value ?? '0') || 0,
  }));

  /* Team stats */
  const boxTeams: any[] = data.boxscore?.teams ?? [];
  const findBox = (abbr: string, idx: number) =>
    boxTeams.find((t: any) => t.team?.abbreviation === abbr) ?? boxTeams[idx] ?? null;
  const homeBox = findBox(home.abbr, 0);
  const awayBox = findBox(away.abbr, 1);

  function statsMap(box: any): Record<string, string> {
    const m: Record<string, string> = {};
    (box?.statistics ?? []).forEach((s: any) => { m[s.name] = s.displayValue ?? '—'; });
    return m;
  }
  const homeRaw = statsMap(homeBox);
  const awayRaw = statsMap(awayBox);
  const homeStats: Record<string, string> = {};
  const awayStats: Record<string, string> = {};
  cfg.statKeys.forEach((key, i) => {
    homeStats[cfg.statLabels[i]] = homeRaw[key] ?? '—';
    awayStats[cfg.statLabels[i]] = awayRaw[key] ?? '—';
  });

  /* Top performers from leaders */
  const playerMap = new Map<string, { team: string; player: string; lines: string[] }>();
  (data.leaders ?? []).forEach((cat: any) => {
    const shortLabel = cat.shortDisplayName ?? '';
    (cat.leaders ?? []).slice(0, 2).forEach((leader: any) => {
      const name = leader.athlete?.shortName ?? leader.athlete?.displayName;
      if (!name) return;
      const teamAbbr = leader.team?.abbreviation ?? '?';
      const val = leader.displayValue ?? '';
      const line = shortLabel ? `${val} ${shortLabel}` : val;
      if (playerMap.has(name)) {
        playerMap.get(name)!.lines.push(line);
      } else {
        playerMap.set(name, { team: teamAbbr, player: name, lines: [line] });
      }
    });
  });
  const performers: TopPerformer[] = Array.from(playerMap.values())
    .map(({ team, player, lines }) => ({ team, player, line: lines.join(' · ') }))
    .slice(0, 8);

  const gameInfo = data.gameInfo ?? {};
  return {
    periodScores,
    performers,
    homeStats,
    awayStats,
    statLabels: [...cfg.statLabels],
    venue: gameInfo.venue?.fullName,
    attendance: gameInfo.attendance
      ? Number(gameInfo.attendance).toLocaleString('cs-CZ')
      : undefined,
  };
}

/* ═══════════════════════ UI COMPONENTS ═══════════════════════ */

const TeamBadge = memo(function TeamBadge({ team, align = 'left' }: { team: Team; align?: 'left' | 'right' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: align === 'right' ? 'row-reverse' : 'row', flex: 1, minWidth: 0 }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
        background: team.color + '33', border: `1px solid ${team.color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '9px', fontWeight: '700', color: team.color, letterSpacing: '0.5px',
      }}>
        {team.abbr}
      </div>
      <div style={{ textAlign: align === 'right' ? 'right' : 'left', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.abbr}</div>
        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{team.record ?? '—'}</div>
      </div>
    </div>
  );
});

const StatusBadge = memo(function StatusBadge({ game }: { game: Game }) {
  if (game.status === 'live') {
    return (
      <div style={{ textAlign: 'center', minWidth: '64px', flexShrink: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '3px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '2px 7px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
          <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: '600' }}>LIVE</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{game.period} · {game.time}</div>
      </div>
    );
  }
  if (game.status === 'final') {
    return (
      <div style={{ textAlign: 'center', minWidth: '64px', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--text3)', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 8px', display: 'inline-block' }}>Final</div>
      </div>
    );
  }
  if (game.status === 'postponed') {
    return (
      <div style={{ textAlign: 'center', minWidth: '64px', flexShrink: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--amber)', background: 'rgba(255,179,0,0.1)', borderRadius: '6px', padding: '2px 8px', display: 'inline-block' }}>Odloženo</div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', minWidth: '64px', flexShrink: 0 }}>
      {game.date && <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '1px' }}>{game.date}</div>}
      <div style={{ fontSize: '12px', color: 'var(--blue2)', fontWeight: '500' }}>{game.scheduledTime}</div>
    </div>
  );
});

const GameDetailPanel = memo(function GameDetailPanel({ game, detail }: { game: Game; detail: GameDetail }) {
  const awayWins = (game.away.score ?? 0) > (game.home.score ?? 0);
  const cols = detail.periodScores.length;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', marginTop: '4px' }}>

      {/* Venue */}
      {detail.venue && (
        <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '10px' }}>
          📍 {detail.venue}{detail.attendance ? ` · ${detail.attendance} diváků` : ''}
        </div>
      )}

      {/* Period score table */}
      {detail.periodScores.length > 0 && (
        <div style={{ marginBottom: '12px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: 'var(--text3)', fontWeight: '400', paddingBottom: '4px', width: '52px' }}></th>
                {detail.periodScores.map(p => (
                  <th key={p.label} style={{ color: 'var(--text3)', fontWeight: '400', textAlign: 'center', paddingBottom: '4px', minWidth: '30px' }}>{p.label}</th>
                ))}
                <th style={{ color: '#fff', fontWeight: '700', textAlign: 'center', paddingBottom: '4px', minWidth: '34px' }}>C</th>
              </tr>
            </thead>
            <tbody>
              {[game.away, game.home].map((team, ti) => (
                <tr key={team.abbr}>
                  <td style={{ paddingRight: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: team.color }}>{team.abbr}</span>
                  </td>
                  {detail.periodScores.map((p, pi) => (
                    <td key={pi} style={{ textAlign: 'center', color: 'var(--text2)', padding: '2px 0' }}>
                      {ti === 0 ? p.away : p.home}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '14px', color: (ti === 0 ? awayWins : !awayWins) && game.status === 'final' ? '#fff' : 'var(--text2)' }}>
                    {team.score ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top performers */}
      {detail.performers.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Nejlepší hráči</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {detail.performers.map((p, i) => {
              const isHome = p.team === game.home.abbr;
              const col = isHome ? game.home.color : game.away.color;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: col, background: col + '22', borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>{p.team}</span>
                    <span style={{ fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.player}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.line}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team stats */}
      {detail.statLabels.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Statistiky</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: game.away.color, fontWeight: '600', paddingBottom: '4px', width: '30%' }}>{game.away.abbr}</th>
                <th style={{ textAlign: 'center', color: 'var(--text3)', fontWeight: '400', paddingBottom: '4px' }}></th>
                <th style={{ textAlign: 'right', color: game.home.color, fontWeight: '600', paddingBottom: '4px', width: '30%' }}>{game.home.abbr}</th>
              </tr>
            </thead>
            <tbody>
              {detail.statLabels.map(label => (
                <tr key={label} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '4px 0', color: '#fff', fontWeight: '500' }}>{detail.awayStats[label] ?? '—'}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '10px' }}>{label}</td>
                  <td style={{ textAlign: 'right', color: '#fff', fontWeight: '500' }}>{detail.homeStats[label] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

const GameRow = memo(function GameRow({
  game, leagueId, expanded, onToggle, detailState, detail,
}: {
  game: Game; leagueId: LeagueId; expanded: boolean;
  onToggle: () => void; detailState: FetchState; detail: GameDetail | null;
}) {
  const homeWins = game.status === 'final' && (game.home.score ?? 0) > (game.away.score ?? 0);
  const awayWins = game.status === 'final' && (game.away.score ?? 0) > (game.home.score ?? 0);
  const isLive = game.status === 'live';
  const clickable = game.status === 'live' || game.status === 'final';

  return (
    <div>
      <div
        onClick={clickable ? onToggle : undefined}
        style={{
          background: expanded ? 'rgba(93,76,255,0.08)' : isLive ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
          border: expanded ? '1px solid rgba(93,76,255,0.3)' : isLive ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.04)',
          borderRadius: expanded ? '12px 12px 0 0' : '12px',
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: '8px',
          cursor: clickable ? 'pointer' : 'default',
        }}
      >
        <TeamBadge team={game.away} />
        {(isLive || game.status === 'final') ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <div style={{ fontSize: '22px', fontFamily: 'Poppins', fontWeight: '600', color: awayWins ? '#fff' : 'var(--text3)', minWidth: '32px', textAlign: 'center' }}>
              {game.away.score ?? '–'}
            </div>
            <StatusBadge game={game} />
            <div style={{ fontSize: '22px', fontFamily: 'Poppins', fontWeight: '600', color: homeWins ? '#fff' : 'var(--text3)', minWidth: '32px', textAlign: 'center' }}>
              {game.home.score ?? '–'}
            </div>
          </div>
        ) : (
          <StatusBadge game={game} />
        )}
        <TeamBadge team={game.home} align="right" />
        {clickable && (
          <span style={{ color: 'var(--text3)', fontSize: '11px', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {expanded && (
        <div style={{ border: '1px solid rgba(93,76,255,0.3)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0 8px 8px', background: 'rgba(93,76,255,0.04)' }}>
          {detailState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)', fontSize: '12px' }}>Načítám detail…</div>
          )}
          {detailState === 'error' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#EF4444', fontSize: '12px' }}>Nepodařilo se načíst detail zápasu.</div>
          )}
          {detailState === 'ok' && detail && (
            <GameDetailPanel game={game} detail={detail} />
          )}
        </div>
      )}
    </div>
  );
});

const StandingsTable = memo(function StandingsTable({ rows, headers }: { rows: StandingRow[]; headers: string[] }) {
  const colTemplate = `24px 1fr ${headers.map(() => '36px').join(' ')}`;
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: colTemplate, gap: '4px', padding: '4px 8px', marginBottom: '2px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>#</div>
        <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Tým</div>
        {headers.map(h => <div key={h} style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>{h}</div>)}
      </div>
      {rows.map((row, i) => (
        <div key={row.abbr} style={{
          display: 'grid', gridTemplateColumns: colTemplate, gap: '4px', alignItems: 'center',
          padding: '6px 8px', borderRadius: '8px', marginBottom: '2px',
          background: i < 3 ? 'rgba(93,76,255,0.06)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
          borderLeft: i < 3 ? '2px solid rgba(93,76,255,0.4)' : '2px solid transparent',
        }}>
          <div style={{ fontSize: '11px', color: i < 3 ? 'var(--purple3)' : 'var(--text3)', fontWeight: '600' }}>{row.rank}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '8px', fontWeight: '700', color: row.color, background: row.color + '22', borderRadius: '4px', padding: '1px 4px', flexShrink: 0 }}>{row.abbr}</span>
            <span style={{ fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
          </div>
          {row.cols.map((val, ci) => (
            <div key={ci} style={{ fontSize: '12px', color: ci === 0 ? 'var(--text3)' : '#fff', textAlign: 'center', fontWeight: ci === headers.length - 1 ? '600' : '400' }}>
              {val}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});

const SectionLabel = memo(function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', margin: '.75rem 0 .4rem' }}>
      {label}
      <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1px 7px', fontSize: '10px', color: 'var(--text2)', letterSpacing: 0, textTransform: 'none' }}>{count}</span>
    </div>
  );
});

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

const LEAGUE_IDS: LeagueId[] = ['nhl', 'nba', 'nfl', 'wc2026'];
const LEAGUE_META: Record<LeagueId, { emoji: string; label: string }> = {
  nhl:    { emoji: '🏒', label: 'NHL' },
  nba:    { emoji: '🏀', label: 'NBA' },
  nfl:    { emoji: '🏈', label: 'NFL' },
  wc2026: { emoji: '⚽', label: 'WC 2026' },
};

export default function Sports() {
  const [leagueId, setLeagueId] = useState<LeagueId>('nhl');
  const [view, setView] = useState<'games' | 'standings'>('games');
  const [nhlView, setNhlView] = useState<NhlView>('league');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [leagueCache, setLeagueCache] = useState<Record<string, LeagueCache>>({
    nhl: { games: [], state: 'idle' },
    nba: { games: [], state: 'idle' },
    nfl: { games: [], state: 'idle' },
    wc2026: { games: [], state: 'idle' },
  });

  const [detailCache, setDetailCache] = useState<Record<string, DetailCache>>({});

  const fetchLeague = useCallback(async (id: LeagueId) => {
    if (id === 'wc2026') return; // static data, no API call
    setLeagueCache(prev => ({ ...prev, [id]: { ...prev[id], state: 'loading' } }));
    try {
      const res = await fetch(`/api/sports/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const games = parseGames(data, id);
      setLeagueCache(prev => ({ ...prev, [id]: { games, state: 'ok' } }));
    } catch (e: any) {
      setLeagueCache(prev => ({ ...prev, [id]: { ...prev[id], state: 'error', error: e.message } }));
    }
  }, []);

  const fetchDetail = useCallback(async (game: Game, lid: LeagueId) => {
    setDetailCache(prev => ({ ...prev, [game.id]: { detail: null, state: 'loading' } }));
    try {
      const res = await fetch(`/api/sports/${lid}?event=${game.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const detail = parseDetail(data, game.home, game.away, lid);
      setDetailCache(prev => ({ ...prev, [game.id]: { detail, state: 'ok' } }));
    } catch {
      setDetailCache(prev => ({ ...prev, [game.id]: { detail: null, state: 'error' } }));
    }
  }, []);

  // Fetch current league on mount; lazy-load others on tab switch
  useEffect(() => {
    fetchLeague(leagueId);
  }, [leagueId, fetchLeague]);

  // Auto-refresh every 60s if any live games in current league
  useEffect(() => {
    const hasLive = leagueCache[leagueId].games.some(g => g.status === 'live');
    if (!hasLive) return;
    const id = setInterval(() => fetchLeague(leagueId), 60_000);
    return () => clearInterval(id);
  }, [leagueId, leagueCache, fetchLeague]);

  const toggleGame = useCallback((game: Game) => {
    setExpandedId(prev => {
      const next = prev === game.id ? null : game.id;
      if (next && !detailCache[game.id]) fetchDetail(game, leagueId);
      return next;
    });
  }, [detailCache, leagueId, fetchDetail]);

  const switchLeague = useCallback((id: LeagueId) => {
    setLeagueId(id);
    setExpandedId(null);
    setLeagueCache(prev => {
      if (prev[id].state === 'idle') fetchLeague(id);
      return prev;
    });
  }, [fetchLeague]);

  const { games, state, error } = leagueCache[leagueId];
  const live     = useMemo(() => games.filter(g => g.status === 'live'),     [games]);
  const final    = useMemo(() => games.filter(g => g.status === 'final'),    [games]);
  const upcoming = useMemo(() => games.filter(g => g.status === 'upcoming'), [games]);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, cursor: 'pointer', fontWeight: '500', fontSize: '13px',
    padding: '7px 0', borderRadius: '8px', gap: '5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.05)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
    color: active ? '#fff' : 'var(--text2)',
  });

  const viewBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, cursor: 'pointer', fontSize: '12px', padding: '5px 0', border: 'none', borderRadius: '6px',
    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: active ? '#fff' : 'var(--text3)',
  });

  return (
    <div className="card" style={{ background: 'rgba(15,20,40,0.92)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--card-radius)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>🏆 Sporty</h2>
        <button
          onClick={() => fetchLeague(leagueId)}
          title="Obnovit"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '3px 8px', cursor: 'pointer' }}
        >↺</button>
      </div>

      {/* League tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {LEAGUE_IDS.map(id => (
          <button key={id} onClick={() => switchLeague(id)} style={{ ...tabBtn(id === leagueId), fontSize: '11px', flex: 'none', padding: '6px 10px' }}>
            <span>{LEAGUE_META[id].emoji}</span>
            <span>{LEAGUE_META[id].label}</span>
          </button>
        ))}
      </div>

      {/* WC 2026 */}
      {leagueId === 'wc2026' && <WC2026 />}

      {/* View toggle (non-WC) */}
      {leagueId !== 'wc2026' && (
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px', marginBottom: '1rem', gap: '2px' }}>
        <button onClick={() => setView('games')} style={viewBtn(view === 'games')}>📅 Zápasy</button>
        <button onClick={() => setView('standings')} style={viewBtn(view === 'standings')}>📊 Tabulka</button>
      </div>
      )}

      {/* Loading skeleton */}
      {view === 'games' && state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: '64px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.025)',
              animation: 'shimmer 1.5s infinite',
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
          <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
        </div>
      )}

      {/* Error */}
      {view === 'games' && state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>Nepodařilo se načíst data.</div>
          <button onClick={() => fetchLeague(leagueId)} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '7px 16px', cursor: 'pointer' }}>
            Zkusit znovu
          </button>
        </div>
      )}

      {/* Games */}
      {view === 'games' && state === 'ok' && (
        <>
          {live.length > 0 && (
            <>
              <SectionLabel label="Živě" count={live.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {live.map(g => (
                  <GameRow key={g.id} game={g} leagueId={leagueId}
                    expanded={expandedId === g.id} onToggle={() => toggleGame(g)}
                    detailState={detailCache[g.id]?.state ?? 'idle'}
                    detail={detailCache[g.id]?.detail ?? null} />
                ))}
              </div>
            </>
          )}
          {final.length > 0 && (
            <>
              <SectionLabel label="Dnes dokončeno" count={final.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {final.map(g => (
                  <GameRow key={g.id} game={g} leagueId={leagueId}
                    expanded={expandedId === g.id} onToggle={() => toggleGame(g)}
                    detailState={detailCache[g.id]?.state ?? 'idle'}
                    detail={detailCache[g.id]?.detail ?? null} />
                ))}
              </div>
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <SectionLabel label="Nadcházející" count={upcoming.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {upcoming.map(g => (
                  <GameRow key={g.id} game={g} leagueId={leagueId}
                    expanded={expandedId === g.id} onToggle={() => toggleGame(g)}
                    detailState={detailCache[g.id]?.state ?? 'idle'}
                    detail={detailCache[g.id]?.detail ?? null} />
                ))}
              </div>
            </>
          )}
          {games.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text3)', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗓️</div>
              Dnes žádné zápasy
            </div>
          )}
          {live.length > 0 && (
            <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
              Zdroj: ESPN API · auto-refresh každých 60 s
            </div>
          )}
        </>
      )}

      {/* Standings */}
      {view === 'standings' && leagueId !== 'wc2026' && (
        <>
          {/* NHL extra tabs */}
          {leagueId === 'nhl' && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {([
                { id: 'league' as NhlView,     label: '📊 Liga' },
                { id: 'conference' as NhlView, label: '🗺️ Konference' },
                { id: 'scorers' as NhlView,    label: '⛸️ Bodování' },
                { id: 'playoff' as NhlView,    label: '🏆 Playoff' },
              ]).map(v => (
                <button key={v.id} onClick={() => setNhlView(v.id)} style={{
                  padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: nhlView === v.id ? '700' : '400',
                  background: nhlView === v.id ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: nhlView === v.id ? '#FFB300' : 'var(--text3)',
                  outline: nhlView === v.id ? '1px solid rgba(255,179,0,0.35)' : 'none',
                }}>{v.label}</button>
              ))}
            </div>
          )}

          {/* NHL Conference */}
          {leagueId === 'nhl' && nhlView === 'conference' && (
            <>
              {[...NHL_EAST, ...NHL_WEST].map((conf, ci) => (
                <div key={conf.conf} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: ci < 2 ? '#60a5fa' : '#f59e0b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>
                    {ci < 2 ? '🔵 Eastern' : '🟠 Western'} — {conf.conf}
                  </div>
                  <StandingsTable rows={conf.rows} headers={conf.headers} />
                </div>
              ))}
            </>
          )}

          {/* NHL Scorers */}
          {leagueId === 'nhl' && nhlView === 'scorers' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 28px 28px 30px', gap: '4px', padding: '3px 8px', fontSize: '9px', color: 'var(--text3)', marginBottom: '3px' }}>
                <div>#</div><div>Hráč</div><div style={{textAlign:'center'}}>G</div><div style={{textAlign:'center'}}>A</div><div style={{textAlign:'center', fontWeight:'700'}}>Pts</div>
              </div>
              {NHL_SCORERS.map(s => (
                <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 28px 28px 30px', gap: '4px', padding: '5px 8px', borderRadius: '7px', background: s.rank <= 3 ? 'rgba(255,179,0,0.05)' : 'rgba(255,255,255,0.02)', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ fontSize: '11px', color: s.rank <= 3 ? '#FFB300' : 'var(--text3)', fontWeight: '600' }}>{s.rank}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: '9px', color: s.color, fontWeight: '700' }}>{s.team}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text2)' }}>{s.goals}</div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text2)' }}>{s.assists}</div>
                  <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#fff' }}>{s.pts}</div>
                </div>
              ))}
            </div>
          )}

          {/* NHL Playoff */}
          {leagueId === 'nhl' && nhlView === 'playoff' && (
            <div>
              {NHL_PLAYOFF.map(round => (
                <div key={round.round} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>{round.round}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {round.matches.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '8px', fontWeight: '700', color: m.c1, background: `${m.c1}22`, borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>{m.t1}</span>
                        {m.done ? (
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff', fontFamily: 'Poppins', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{m.s1} – {m.s2}</span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>vs</span>
                        )}
                        <span style={{ fontSize: '8px', fontWeight: '700', color: m.c2, background: `${m.c2}22`, borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>{m.t2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular standings (league view) */}
          {(leagueId !== 'nhl' || nhlView === 'league') && STANDINGS[leagueId] && (
            <StandingsTable rows={STANDINGS[leagueId]!.rows} headers={STANDINGS[leagueId]!.headers} />
          )}

          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
            Tabulka: statická data · sezóna 2024-25
          </div>
        </>
      )}

      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>
    </div>
  );
}
