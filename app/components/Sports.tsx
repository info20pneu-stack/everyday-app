'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import WC2026 from './WC2026';
import { useLang } from '../../lib/LanguageContext';
import { fmtNumber } from '../../lib/formatNumber';
import { sportsStrings, type SportsStrings } from '../../lib/sportsI18n';
import ToolFrame, { ToolButton, ToolHero } from './tools/ToolFrame';
import {
  TEAMS_BY_LEAGUE, LEAGUE_META as TEAM_LEAGUE_META, type League as TeamLeague,
  type MyTeam, loadMyTeam, saveMyTeam, type MatchInfo, fetchMyTeamMatches,
} from '../../lib/teams';
import {
  parseScoreboard, periodLabel, startParts, statusLine, type GameSide, type ScoreGame,
} from '../../lib/sports/scoreboard';
import type { ProLeague } from '../../lib/sports/types';
import TeamBadge from './sports/TeamBadge';
import LiveStandings, { type StandingsTab } from './sports/LiveStandings';

/* ═══════════════════════ TYPES ═══════════════════════ */

type LeagueId = ProLeague | 'wc2026';
type FetchState = 'idle' | 'loading' | 'ok' | 'error';
type Game = ScoreGame;

type PeriodScore = { n: number; home: number; away: number };
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

type LeagueCache = { games: Game[]; state: FetchState; error?: string };
type DetailCache = { detail: GameDetail | null; state: FetchState };

/* ═══════════════════════ ESPN CONFIG ═══════════════════════ */

const ESPN_CONFIG = {
  nhl: {
    label: 'NHL', emoji: '🏒',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    summaryUrl:    'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/summary',
    regularPeriods: 3,
    statKeys:   ['shots', 'powerPlayGoals', 'penaltyMinutes', 'hits', 'faceOffWinPercentage'],
    statLabels: ['shots', 'ppGoals', 'pim', 'hits', 'foWin'],
  },
  nba: {
    label: 'NBA', emoji: '🏀',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    summaryUrl:    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary',
    regularPeriods: 4,
    statKeys:   ['fieldGoalPct', 'threePointPct', 'freeThrowPct', 'totalRebounds', 'assists', 'turnovers'],
    statLabels: ['fg', 'threeP', 'ft', 'rebounds', 'assists', 'turnovers'],
  },
  nfl: {
    label: 'NFL', emoji: '🏈',
    scoreboardUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    summaryUrl:    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary',
    regularPeriods: 4,
    statKeys:   ['netPassingYards', 'rushingYards', 'turnovers', 'sacks', 'possessionTime'],
    statLabels: ['passYds', 'rushYds', 'turnovers', 'sacks', 'possession'],
  },
} as const satisfies Record<string, { statLabels: readonly (keyof SportsStrings)[] } & Record<string, unknown>>;

/** Period / quarter header of the score table ("1.", "Q4", "OT"). */
function periodName(n: number, leagueId: LeagueId, ss: SportsStrings): string {
  const cfg = ESPN_CONFIG[leagueId as keyof typeof ESPN_CONFIG] ?? ESPN_CONFIG.nhl;
  if (n > cfg.regularPeriods) return ss.ot;
  return (leagueId === 'nhl' ? ss.period : ss.quarter).replace('{n}', String(n));
}

/* ═══════════════════════ ESPN PARSERS ═══════════════════════ */

function parseDetail(data: any, home: GameSide, away: GameSide, leagueId: LeagueId): GameDetail {
  const cfg = ESPN_CONFIG[leagueId as keyof typeof ESPN_CONFIG] ?? ESPN_CONFIG.nhl;

  /* Period scores */
  const comp = data.header?.competitions?.[0];
  const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');
  const homeLines: any[] = homeComp?.linescores ?? [];
  const awayLines: any[] = awayComp?.linescores ?? [];
  const periodScores: PeriodScore[] = homeLines.map((ls: any, i: number) => ({
    n: i + 1,
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
    attendance: gameInfo.attendance ? String(gameInfo.attendance) : undefined,
  };
}

/* ═══════════════════════ UI COMPONENTS ═══════════════════════ */

/** Badge + team name; the winner of a finished game is bold white, the loser grey. */
const GameTeam = memo(function GameTeam({ team, end = false, result }: { team: GameSide; end?: boolean; result: 'win' | 'lose' | null }) {
  return (
    <div className={`sp-gteam${end ? ' sp-gteam-end' : ''}${result ? ` is-${result}` : ''}`}>
      <TeamBadge abbr={team.abbr} color={team.color} size="lg" />
      <div className="sp-gteam-text">
        <div className="sp-gteam-name" title={team.name}>{team.short}</div>
        {team.record && <div className="sp-gteam-rec">{team.record}</div>}
      </div>
    </div>
  );
});

const GameDetailPanel = memo(function GameDetailPanel({ game, detail, leagueId }: { game: Game; detail: GameDetail; leagueId: LeagueId }) {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const awayWins = (game.away.score ?? 0) > (game.home.score ?? 0);
  const cols = detail.periodScores.length;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', marginTop: '4px' }}>

      {/* Venue */}
      {detail.venue && (
        <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginBottom: '10px' }}>
          📍 {detail.venue}{detail.attendance ? ` · ${fmtNumber(Number(detail.attendance), lang)} ${t.sports.attendance}` : ''}
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
                  <th key={p.n} style={{ color: 'var(--text3)', fontWeight: '400', textAlign: 'center', paddingBottom: '4px', minWidth: '30px' }}>{periodName(p.n, leagueId, ss)}</th>
                ))}
                <th style={{ color: '#fff', fontWeight: '700', textAlign: 'center', paddingBottom: '4px', minWidth: '34px' }}>{ss.total}</th>
              </tr>
            </thead>
            <tbody>
              {[game.away, game.home].map((team, ti) => (
                <tr key={team.abbr}>
                  <td style={{ paddingRight: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: team.color }}>{team.abbr}</span>
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
          <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{t.sports.topPerformers}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {detail.performers.map((p, i) => {
              const isHome = p.team === game.home.abbr;
              const col = isHome ? game.home.color : game.away.color;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: col, background: col + '22', borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>{p.team}</span>
                    <span style={{ fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.player}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.line}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team stats */}
      {detail.statLabels.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>{t.sports.statistics}</div>
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
                  <td style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>{ss[label as keyof SportsStrings] ?? label}</td>
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
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const done = game.status === 'final';
  const isLive = game.status === 'live';
  const clickable = isLive || done;
  const showScore = isLive || done;
  const res = (s: GameSide) => (done ? (s.winner ? 'win' : 'lose') : null);
  const line = statusLine(game, ss, t.sports.postponed, lang);

  return (
    <div>
      <div
        className={`sp-game${expanded ? ' is-open' : ''}${isLive ? ' is-live' : ''}${clickable ? ' is-click' : ''}`}
        onClick={clickable ? onToggle : undefined}
        onKeyDown={clickable ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } } : undefined}
        role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined} aria-expanded={clickable ? expanded : undefined}
      >
        <GameTeam team={game.away} result={res(game.away)} />
        <div className="sp-gcenter">
          {showScore && (
            <div className="sp-gscore tabular-nums" dir="ltr">
              <span className={res(game.away) ? `is-${res(game.away)}` : ''}>{game.away.score ?? 0}</span>
              <span className="sp-gsep">:</span>
              <span className={res(game.home) ? `is-${res(game.home)}` : ''}>{game.home.score ?? 0}</span>
            </div>
          )}
          <div className={`sp-gstatus sp-gstatus-${line.kind}`}>
            {game.status === 'upcoming' ? <time dateTime={game.date}>{line.text}</time> : line.text}
          </div>
        </div>
        <GameTeam team={game.home} end result={res(game.home)} />
        {clickable && <span className="sp-gchev" aria-hidden="true">{expanded ? '▲' : '▼'}</span>}
      </div>

      {expanded && (
        <div className="sp-gdetail">
          {detailState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)', fontSize: '12px' }}>{t.sports.loadingDetail}</div>
          )}
          {detailState === 'error' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#EF4444', fontSize: '12px' }}>{t.sports.detailError}</div>
          )}
          {detailState === 'ok' && detail && (
            <GameDetailPanel game={game} detail={detail} leagueId={leagueId} />
          )}
        </div>
      )}
    </div>
  );
});

const SectionLabel = memo(function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', margin: '.75rem 0 .4rem' }}>
      {label}
      <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1px 7px', fontSize: '12px', color: 'var(--text2)', letterSpacing: 0, textTransform: 'none' }}>{count}</span>
    </div>
  );
});

/* ═══════════════════════ MY TEAM ═══════════════════════ */

function MyTeamCard({ team, onPick, onClear, editRequest }: {
  team: MyTeam | null; onPick: (league: TeamLeague, abbr: string) => void; onClear: () => void;
  /** Increases when the header pill asks to pick a team. */
  editRequest: number;
}) {
  const { t } = useLang();
  const [editingLocal, setEditingLocal] = useState(false);
  // A new header-pill request opens the editor until the reader closes it
  const [handledRequest, setHandledRequest] = useState(0);
  const editing = editingLocal || editRequest > handledRequest;
  const setEditing = (next: boolean | ((e: boolean) => boolean)) => {
    const v = typeof next === 'function' ? next(editing) : next;
    setEditingLocal(v);
    if (!v) setHandledRequest(editRequest);
  };
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editRequest) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [editRequest]);
  const [draftLeague, setDraftLeague] = useState<TeamLeague>(team?.league ?? 'nhl');
  const [matches, setMatches] = useState<{ last: MatchInfo | null; next: MatchInfo | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!team) { setMatches(null); return; }
    setLoading(true);
    fetchMyTeamMatches(team.league, team.abbr)
      .then(setMatches)
      .catch(() => setMatches(null))
      .finally(() => setLoading(false));
  }, [team]);

  return (
    <div ref={cardRef} style={{
      background: 'linear-gradient(135deg, rgba(234,88,12,0.14), rgba(93,76,255,0.1))',
      border: '1px solid rgba(234,88,12,0.3)', borderRadius: '16px', padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--amber)' }}>
          🏆 {t.myDay.teamTitle}
        </span>
        <button className="icon-btn" onClick={() => setEditing(e => !e)} aria-label={t.myDay.teamSelectTeam} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text3)' }}>⚙️</button>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <select className="tf-input" value={draftLeague} onChange={e => setDraftLeague(e.target.value as TeamLeague)}>
            {(Object.keys(TEAM_LEAGUE_META) as TeamLeague[]).map(l => (
              <option key={l} value={l}>{TEAM_LEAGUE_META[l].emoji} {TEAM_LEAGUE_META[l].label}</option>
            ))}
          </select>
          <select className="tf-input" defaultValue="" onChange={e => { if (e.target.value) { onPick(draftLeague, e.target.value); setEditing(false); } }}>
            <option value="">{t.myDay.teamSelectTeam}</option>
            {TEAMS_BY_LEAGUE[draftLeague].map(tm => <option key={tm.abbr} value={tm.abbr}>{tm.name}</option>)}
          </select>
          {team && (
            <button onClick={() => { onClear(); setEditing(false); }} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text3)' }}>
              ✕ {team.abbr}
            </button>
          )}
        </div>
      ) : !team ? (
        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{t.myDay.teamEmpty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: '800', color: '#fff' }}>
            {TEAM_LEAGUE_META[team.league].emoji} {team.abbr}
          </div>
          {loading ? (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>…</div>
          ) : (
            <div style={{ display: 'flex', gap: '14px', fontSize: '12px', flexWrap: 'wrap' }}>
              {matches?.last && (
                <span style={{ color: 'var(--text2)' }}>{t.myDay.teamLast}: {matches.last.homeAway} {matches.last.oppName} {matches.last.score ?? ''}</span>
              )}
              {matches?.next && (
                <span style={{ color: 'var(--text2)' }}>{t.myDay.teamNext}: {matches.next.homeAway} {matches.next.oppName} · {matches.next.dateStr}</span>
              )}
              {!matches?.last && !matches?.next && <span style={{ color: 'var(--text3)' }}>{t.myDay.teamNone}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

const CORE_LEAGUE_IDS: LeagueId[] = ['nhl', 'nba', 'nfl'];
const LEAGUE_META: Record<LeagueId, { emoji: string; label: string }> = {
  nhl:    { emoji: '🏒', label: 'NHL' },
  nba:    { emoji: '🏀', label: 'NBA' },
  nfl:    { emoji: '🏈', label: 'NFL' },
  wc2026: { emoji: '⚽', label: 'WC 2026' },
};

export default function Sports() {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const [editRequest, setEditRequest] = useState(0);
  const [leagueId, setLeagueId] = useState<LeagueId>('nhl');
  const [view, setView] = useState<'games' | 'standings'>('games');
  const [standingsTab, setStandingsTab] = useState<StandingsTab>('league');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
  const [myTeamMounted, setMyTeamMounted] = useState(false);

  useEffect(() => { setMyTeam(loadMyTeam()); setMyTeamMounted(true); }, []);

  // Links from the dashboard panel: /sports?league=nba&view=standings
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const lg = q.get('league');
    if (lg === 'nhl' || lg === 'nba' || lg === 'nfl' || lg === 'wc2026') setLeagueId(lg);
    if (q.get('view') === 'standings') setView('standings');
  }, []);
  const pickMyTeam = useCallback((league: TeamLeague, abbr: string) => {
    const next = { league, abbr };
    saveMyTeam(next);
    setMyTeam(next);
  }, []);
  const clearMyTeam = useCallback(() => { saveMyTeam(null); setMyTeam(null); }, []);

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
      const games = parseScoreboard(data, id);
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

  // Hero: the first live game, else the last result, else the next game
  const heroGame = live[0] ?? final[0] ?? upcoming[0] ?? null;

  return (
    <ToolFrame toolId="sport" wide
      myDay={myTeamMounted ? { saved: !!myTeam, onSave: () => setEditRequest(n => n + 1) } : undefined}>

      <div className="tf-chips">
        <button type="button" className={`tf-chip sp-wc${leagueId === 'wc2026' ? ' is-on' : ''}`} aria-pressed={leagueId === 'wc2026'} onClick={() => switchLeague('wc2026')}>
          ⚽🏆 {ss.wc}
        </button>
        {CORE_LEAGUE_IDS.map(id => (
          <button key={id} type="button" className={`tf-chip${id === leagueId ? ' is-on' : ''}`} aria-pressed={id === leagueId} onClick={() => switchLeague(id)}>
            {LEAGUE_META[id].emoji} {LEAGUE_META[id].label}
          </button>
        ))}
        <button type="button" className="tf-chip" onClick={() => fetchLeague(leagueId)} aria-label={t.sports.refresh} title={t.sports.refresh}>↺</button>
      </div>

      {leagueId !== 'wc2026' && view === 'games' && state === 'ok' && heroGame && (
        <ToolHero
          label={heroGame.status === 'live' ? `🔴 ${ss.live} · ${LEAGUE_META[leagueId].label}` : `${LEAGUE_META[leagueId].emoji} ${LEAGUE_META[leagueId].label} · ${heroGame.status === 'final' ? ss.final : t.sports.sectionUpcoming}`}
          value={<span dir="ltr">{heroGame.status === 'upcoming' ? startParts(heroGame.date, lang, ss).time : `${heroGame.away.score ?? 0} : ${heroGame.home.score ?? 0}`}</span>}
          sub={<span dir="ltr">{heroGame.away.name} {ss.vs} {heroGame.home.name}{heroGame.status === 'live' && heroGame.period ? ` · ${periodLabel(heroGame.period, leagueId, ss)} ${heroGame.clock ?? ''}` : ''}</span>}
        />
      )}

      {/* My Team (the same team as the My Day widget) */}
      {myTeamMounted && <MyTeamCard team={myTeam} onPick={pickMyTeam} onClear={clearMyTeam} editRequest={editRequest} />}

      <div className="tf-panel">
      {/* WC 2026 */}
      {leagueId === 'wc2026' && <WC2026 />}

      {/* View toggle (non-WC) */}
      {leagueId !== 'wc2026' && (
      <div className="tf-chips">
        <button type="button" className={`tf-chip${view === 'games' ? ' is-on' : ''}`} aria-pressed={view === 'games'} onClick={() => setView('games')}>{t.sports.games}</button>
        <button type="button" className={`tf-chip${view === 'standings' ? ' is-on' : ''}`} aria-pressed={view === 'standings'} onClick={() => setView('standings')}>{t.sports.standings}</button>
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
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>{t.sports.loadError}</div>
          <ToolButton onClick={() => fetchLeague(leagueId)}>{t.sports.retry}</ToolButton>
        </div>
      )}

      {/* Games */}
      {view === 'games' && state === 'ok' && (
        <>
          {live.length > 0 && (
            <>
              <SectionLabel label={t.sports.sectionLive} count={live.length} />
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
              <SectionLabel label={t.sports.sectionFinal} count={final.length} />
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
              <SectionLabel label={t.sports.sectionUpcoming} count={upcoming.length} />
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
              {t.sports.noGames}
            </div>
          )}
          {live.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
              {t.sports.sourceEspn}
            </div>
          )}
        </>
      )}

      {/* Standings */}
      {view === 'standings' && leagueId !== 'wc2026' && (
        <>
          <LiveStandings league={leagueId} tab={standingsTab} onTab={setStandingsTab} />
        </>
      )}

      </div>
      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        .sp-game {
          display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto; align-items: center; gap: 8px;
          padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        }
        .sp-game.is-click { cursor: pointer; }
        .sp-game.is-click:hover { background: rgba(255,255,255,0.04); }
        .sp-game.is-live { background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.2); }
        .sp-game.is-open { border-radius: 12px 12px 0 0; border-color: rgba(239,68,68,0.35); background: rgba(239,68,68,0.06); }
        .sp-game:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .sp-gdetail { border: 1px solid rgba(239,68,68,0.35); border-top: none; border-radius: 0 0 12px 12px; padding: 0 8px 8px; background: rgba(239,68,68,0.03); }
        .sp-gteam { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .sp-gteam-end { flex-direction: row-reverse; text-align: end; }
        .sp-gteam-text { min-width: 0; }
        .sp-gteam-name { font-size: 13px; font-weight: 600; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-gteam-rec { font-size: 12px; color: var(--text3); }
        .sp-gteam.is-win .sp-gteam-name { color: #fff; font-weight: 800; }
        .sp-gteam.is-lose .sp-gteam-name { color: var(--text3); font-weight: 500; }
        .sp-gcenter { text-align: center; min-width: 76px; }
        .sp-gscore { display: inline-flex; gap: 4px; font: 700 22px 'Poppins', sans-serif; color: #fff; line-height: 1.1; }
        .sp-gscore .is-win { color: #fff; font-weight: 800; }
        .sp-gscore .is-lose { color: var(--text3); font-weight: 600; }
        .sp-gsep { color: var(--text3); }
        .sp-gstatus { margin-top: 3px; font-size: 11px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: var(--text3); white-space: nowrap; }
        .sp-gstatus-live { color: #EF4444; }
        .sp-gstatus-upcoming { color: var(--text2); font-size: 12px; }
        .sp-gstatus-postponed { color: var(--amber); }
        .sp-gchev { color: var(--text3); font-size: 12px; }
        .sp-updated { font-size: 12px; color: var(--text3); }
        @media (max-width: 420px) {
          .sp-game { gap: 6px; padding: 9px 8px; }
          .sp-gteam { gap: 6px; }
          .sp-gteam-name { font-size: 12px; }
          .sp-gcenter { min-width: 64px; }
          .sp-gscore { font-size: 19px; }
        }
        .sp-wc.is-on { background: linear-gradient(135deg, #1a7a3c, #0c4a94); border-color: rgba(255,215,0,.6); }
      `}</style>
    </ToolFrame>
  );
}
