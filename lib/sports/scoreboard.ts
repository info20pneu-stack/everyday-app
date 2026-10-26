/* ESPN scoreboard events → games, shared by the sports page and the dashboard panel. */

import type { ProLeague, SportTeam } from './types';
import type { SportsStrings } from '../sportsI18n';

export type GameStatus = 'live' | 'final' | 'upcoming' | 'postponed';

export interface GameSide extends SportTeam {
  score?: number;
  winner: boolean;
  record?: string;
}

export interface ScoreGame {
  id: string;
  league: ProLeague;
  status: GameStatus;
  /** ESPN status name, e.g. STATUS_HALFTIME, STATUS_END_PERIOD. */
  statusName: string;
  period: number;
  clock?: string;
  /** Start time (ISO). */
  date: string;
  home: GameSide;
  away: GameSide;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN JSON */

export function parseStatus(status: any): GameStatus {
  const name: string = status?.type?.name ?? '';
  if (status?.type?.completed || name.startsWith('STATUS_FINAL') || name === 'STATUS_FULL_TIME') return 'final';
  if (name === 'STATUS_POSTPONED' || name === 'STATUS_CANCELED' || name === 'STATUS_SUSPENDED') return 'postponed';
  if (name === 'STATUS_SCHEDULED' || status?.type?.state === 'pre') return 'upcoming';
  return 'live';
}

function side(c: any, status: GameStatus): GameSide {
  const t = c?.team ?? {};
  const color = typeof t.color === 'string' && /^[0-9a-f]{6}$/i.test(t.color) ? `#${t.color}` : '#475569';
  const score = status === 'upcoming' || c?.score == null ? undefined : Math.round(parseFloat(c.score));
  return {
    id: String(t.id ?? ''), abbr: t.abbreviation ?? '?', name: t.displayName ?? t.name ?? '?',
    short: t.shortDisplayName ?? t.name ?? t.abbreviation ?? '?', color,
    score: Number.isFinite(score) ? score : undefined,
    winner: c?.winner === true,
    record: c?.records?.[0]?.summary,
  };
}

export function parseScoreboard(data: any, league: ProLeague): ScoreGame[] {
  return (data?.events ?? []).flatMap((event: any): ScoreGame[] => {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
    if (!home || !away) return [];
    const status = parseStatus(comp.status);
    const h = side(home, status), a = side(away, status);
    // ESPN sets `winner` on finished games; fall back to the score
    if (status === 'final' && !h.winner && !a.winner && h.score != null && a.score != null && h.score !== a.score) {
      if (h.score > a.score) h.winner = true; else a.winner = true;
    }
    return [{
      id: String(event.id), league, status,
      statusName: comp.status?.type?.name ?? '',
      period: Number(comp.status?.period) || 0,
      clock: comp.status?.displayClock,
      date: event.date ?? comp.date,
      home: h, away: a,
    }];
  });
}

export const REGULAR_PERIODS: Record<ProLeague, number> = { nhl: 3, nba: 4, nfl: 4 };

/** "2. TŘ.", "3. čtvrt.", "Prodl." — the current period in the UI language. */
export function periodLabel(n: number, league: ProLeague, ss: SportsStrings): string {
  if (n > REGULAR_PERIODS[league]) return ss.ot;
  return (league === 'nhl' ? ss.periodShort : ss.quarter).replace('{n}', String(n));
}

/** Start time and day in the visitor's time zone: { time: "19:00", day: "Today" | "Tomorrow" | "Wed 28. 10." }. */
export function startParts(iso: string, lang: string, ss: SportsStrings, now = new Date()): { time: string; day: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { time: '–', day: '' };
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / 86_400_000);
  const day = diff === 0 ? ss.today : diff === 1 ? ss.tomorrow
    : d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'numeric' });
  return { time, day };
}

export type StatusLine = { text: string; kind: GameStatus };

/** The line under the score: "Konec", "● 2. TŘ. 12:40", "19:00 Dnes" (shown upper-case). */
export function statusLine(g: ScoreGame, ss: SportsStrings, postponed: string, lang: string): StatusLine {
  if (g.status === 'final') {
    return { kind: 'final', text: g.period > REGULAR_PERIODS[g.league] ? `${ss.final} · ${ss.ot}` : ss.final };
  }
  if (g.status === 'postponed') return { kind: 'postponed', text: postponed };
  if (g.status === 'live') {
    if (g.statusName === 'STATUS_HALFTIME') return { kind: 'live', text: `● ${ss.halftime}` };
    const per = g.period ? periodLabel(g.period, g.league, ss) : '';
    if (g.statusName === 'STATUS_END_PERIOD') return { kind: 'live', text: `● ${per} · ${ss.intermission}` };
    return { kind: 'live', text: `● ${per} ${g.clock ?? ''}`.trim() };
  }
  const { time, day } = startParts(g.date, lang, ss);
  return { kind: 'upcoming', text: `${time} ${day}` };
}
