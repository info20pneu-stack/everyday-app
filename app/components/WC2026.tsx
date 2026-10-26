'use client';

import { useMemo, useState } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { sportsStrings, type SportsStrings } from '../../lib/sportsI18n';
import { startParts } from '../../lib/sports/scoreboard';
import type { WcGroup, WcMatch, WcStage, WcTeam, WorldCupPayload } from '../../lib/sports/types';
import TeamBadge from './sports/TeamBadge';
import UpdatedAgo from './sports/UpdatedAgo';
import { useLive } from './sports/useLive';
import { LiveStandingsStyles, localStat } from './sports/LiveStandings';

/* FIFA World Cup 2026 — live from ESPN (/api/sports/wc2026/tournament, cached 10 min on the server):
   matches with group / round filters, group tables and the knockout bracket. No stored data. */

const KO_STAGES: Exclude<WcStage, 'group'>[] = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];
const STAGE_KEY: Record<Exclude<WcStage, 'group'>, keyof SportsStrings> = {
  r32: 'r32', r16: 'r16', qf: 'qf', sf: 'sf', third: 'third', final: 'wcFinal',
};

const UK_NATIONS: Record<string, keyof SportsStrings> = {
  'gb-eng': 'england', 'gb-sct': 'scotland', 'gb-wls': 'wales', 'gb-nir': 'northernIreland',
};

/** Country name in the UI language (ESPN's English name when the country is unknown). */
function teamName(team: WcTeam, lang: string): string {
  const uk = team.iso ? UK_NATIONS[team.iso] : undefined;
  if (uk) return sportsStrings(lang as Parameters<typeof sportsStrings>[0])[uk];
  if (team.iso && team.iso.length === 2) {
    try { return new Intl.DisplayNames([lang], { type: 'region' }).of(team.iso.toUpperCase()) ?? team.name; } catch {}
  }
  return team.name;
}

function userTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

/** "Pondělí 15. června" in the UI language and the visitor's time zone. */
function dayLine(iso: string, lang: string): string {
  const s = new Date(iso).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
}

function stageLabel(m: WcMatch, ss: SportsStrings): string {
  if (m.stage === 'group') return m.group ? ss.group.replace('{g}', m.group) : '';
  return ss[STAGE_KEY[m.stage]];
}

/** "Konec", "Konec · pen. 4:3", "● 67'", "19:00 Dnes". */
function wcStatus(m: WcMatch, ss: SportsStrings, lang: string): { text: string; kind: WcMatch['status'] } {
  if (m.status === 'final') {
    const pens = m.homePens != null && m.awayPens != null ? ` · ${ss.pens} ${m.homePens}:${m.awayPens}` : '';
    return { kind: 'final', text: ss.final + pens };
  }
  if (m.status === 'live') return { kind: 'live', text: `● ${m.clock ?? ss.live}` };
  const { time, day } = startParts(m.date, lang, ss);
  return { kind: 'upcoming', text: `${time} ${day}` };
}

function MatchRow({ m, onOpen }: { m: WcMatch; onOpen: () => void }) {
  const { lang } = useLang();
  const ss = sportsStrings(lang);
  const done = m.status === 'final';
  const res = (side: 'home' | 'away') => (!done || !m.winner ? '' : m.winner === side ? ' is-win' : ' is-lose');
  const st = wcStatus(m, ss, lang);
  return (
    <button type="button" className={`sp-game wc-game is-click${m.status === 'live' ? ' is-live' : ''}`} onClick={onOpen}>
      <span className={`sp-gteam${res('home')}`}>
        <TeamBadge abbr={m.home.abbr} color={m.home.color} size="md" />
        <span className="sp-gteam-name">{teamName(m.home, lang)}</span>
      </span>
      <span className="sp-gcenter">
        {m.status !== 'upcoming' && (
          <span className="sp-gscore tabular-nums" dir="ltr">
            <span className={res('home').trim()}>{m.homeScore ?? 0}</span>
            <span className="sp-gsep">:</span>
            <span className={res('away').trim()}>{m.awayScore ?? 0}</span>
          </span>
        )}
        <span className={`sp-gstatus sp-gstatus-${st.kind}`}>{st.kind === 'upcoming' ? <time dateTime={m.date}>{st.text}</time> : st.text}</span>
      </span>
      <span className={`sp-gteam sp-gteam-end${res('away')}`}>
        <TeamBadge abbr={m.away.abbr} color={m.away.color} size="md" />
        <span className="sp-gteam-name">{teamName(m.away, lang)}</span>
      </span>
    </button>
  );
}

function MatchDetail({ m, onClose }: { m: WcMatch; onClose: () => void }) {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const st = wcStatus(m, ss, lang);
  const time = new Date(m.date).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const side = (team: WcTeam, score: number | undefined, won: boolean) => (
    <div className="wc-d-team">
      <TeamBadge abbr={team.abbr} color={team.color} size="lg" />
      <div className={`wc-d-name${m.status === 'final' ? (won ? ' is-win' : ' is-lose') : ''}`}>{teamName(team, lang)}</div>
      {m.status !== 'upcoming' && <div className="wc-d-score tabular-nums">{score ?? 0}</div>}
    </div>
  );
  return (
    <div className="wc-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wc-modal" role="dialog" aria-modal="true" aria-label={`${teamName(m.home, lang)} ${ss.vs} ${teamName(m.away, lang)}`}>
        <button type="button" onClick={onClose} aria-label={t.games.close} className="wc-close">✕</button>
        <div className="wc-d-tags">
          <span className="wc-tag">{stageLabel(m, ss)}</span>
          {m.matchday && <span className="wc-tag wc-tag-dim">{ss.matchday.replace('{n}', String(m.matchday))}</span>}
        </div>
        <div className="wc-d-teams">
          {side(m.home, m.homeScore, m.winner === 'home')}
          <div className={`sp-gstatus sp-gstatus-${st.kind}`}>{st.text}</div>
          {side(m.away, m.awayScore, m.winner === 'away')}
        </div>
        <div className="wc-d-info">
          <div>📅 {dayLine(m.date, lang)} · {time}</div>
          {m.venue && <div>🏟️ {m.venue}{m.city ? `, ${m.city}` : ''}</div>}
        </div>
      </div>
    </div>
  );
}

function GroupTable({ group }: { group: WcGroup }) {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const cols = ['gp', 'w', 'd', 'l', 'gd', 'pts'] as const;
  const template = `var(--sp-rank) minmax(0, 1fr) ${cols.map(() => 'var(--sp-col)').join(' ')}`;
  let line = 0;
  while (line < group.rows.length && group.rows[line].qualified) line++;
  if (line === group.rows.length) line = 0;
  return (
    <div className="sp-group">
      <div className="sp-group-title">{ss.group.replace('{g}', group.letter)}</div>
      <div className="sp-table" role="table">
        <div className="sp-row sp-head" role="row" style={{ gridTemplateColumns: template }}>
          <span role="columnheader">#</span>
          <span role="columnheader">{t.sports.team}</span>
          {cols.map(c => <span key={c} role="columnheader" className="sp-num">{ss[c]}</span>)}
        </div>
        {group.rows.map((r, i) => (
          <div key={r.team.id} role="row" style={{ gridTemplateColumns: template }}
            className={`sp-row${r.qualified ? ' is-q' : ''}${line === i + 1 ? ' sp-cut' : ''}`}>
            <span className="sp-rank" role="cell">{i + 1}</span>
            <span className="sp-team" role="cell">
              <TeamBadge abbr={r.team.abbr} color={r.team.color} size="sm" />
              <span className="sp-team-name">{teamName(r.team, lang)}</span>
            </span>
            {cols.map(c => (
              <span key={c} role="cell" dir="ltr" className={`sp-num${c === 'pts' ? ' sp-strong' : ''}`}>{localStat(r.values[c], lang)}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

type Filter = 'all' | `g:${string}` | Exclude<WcStage, 'group'>;

export default function WC2026() {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const live = useLive<WorldCupPayload>('/api/sports/wc2026/tournament');
  const [view, setView] = useState<'matches' | 'groups' | 'bracket'>('matches');
  const [filter, setFilter] = useState<Filter>('all');
  const [matchday, setMatchday] = useState(0);
  const [selected, setSelected] = useState<WcMatch | null>(null);
  const data = live.data;

  const filtered = useMemo(() => (data?.matches ?? []).filter(m => {
    if (filter === 'all') return matchday === 0 || m.matchday === matchday;
    if (filter.startsWith('g:')) return m.group === filter.slice(2) && (matchday === 0 || m.matchday === matchday);
    return m.stage === filter;
  }), [data, filter, matchday]);

  // Matches by day (visitor's time zone)
  const byDay = useMemo(() => {
    const map = new Map<string, WcMatch[]>();
    for (const m of filtered) {
      const k = new Date(m.date).toLocaleDateString('en-CA');
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    return [...map.entries()];
  }, [filtered]);

  const todayKey = new Date().toLocaleDateString('en-CA');
  const stagesPresent = KO_STAGES.filter(s => data?.matches.some(m => m.stage === s));
  const groupStage = filter === 'all' || filter.startsWith('g:');

  let body: React.ReactNode;
  if (live.loading) body = <div className="sp-state">{ss.loadingData}</div>;
  else if (live.error || !data) {
    body = (
      <div className="sp-state sp-state-error" role="alert">
        <div>⚠️ {ss.dataError}</div>
        <button type="button" className="sp-retry" onClick={live.reload}>{t.sports.retry}</button>
      </div>
    );
  } else if (view === 'matches') {
    body = (
      <>
        <div className="sp-tabs">
          <button type="button" className={`sp-tab${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>{ss.all}</button>
          {data.groups.map(g => (
            <button key={g.letter} type="button" className={`sp-tab${filter === `g:${g.letter}` ? ' is-on' : ''}`} onClick={() => setFilter(`g:${g.letter}`)}>
              {ss.group.replace('{g}', g.letter)}
            </button>
          ))}
          {stagesPresent.map(s => (
            <button key={s} type="button" className={`sp-tab${filter === s ? ' is-on' : ''}`} onClick={() => { setFilter(s); setMatchday(0); }}>
              {ss[STAGE_KEY[s]]}
            </button>
          ))}
        </div>
        {groupStage && (
          <div className="sp-tabs">
            {[0, 1, 2, 3].map(md => (
              <button key={md} type="button" className={`sp-tab sp-tab-sm${matchday === md ? ' is-on' : ''}`} onClick={() => setMatchday(md)}>
                {md === 0 ? ss.all : ss.round.replace('{n}', String(md))}
              </button>
            ))}
          </div>
        )}
        <div className="wc-tz">🕐 {ss.yourTz}: <b>{userTimeZone().replace(/_/g, ' ')}</b></div>
        <div className="wc-list">
          {byDay.map(([key, ms]) => (
            <div key={key} className="wc-day">
              <div className={`wc-day-title${key === todayKey ? ' is-today' : ''}`}>
                {key === todayKey && <span className="wc-today">{ss.today}</span>}
                {dayLine(ms[0].date, lang)}
              </div>
              {ms.map(m => (
                <div key={m.id}>
                  <div className="wc-stage">{stageLabel(m, ss)}</div>
                  <MatchRow m={m} onOpen={() => setSelected(m)} />
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="sp-state">{ss.noMatches}</div>}
        </div>
      </>
    );
  } else if (view === 'groups') {
    body = (
      <>
        <div className="wc-groups">{data.groups.map(g => <GroupTable key={g.letter} group={g} />)}</div>
        <div className="sp-legend"><span className="sp-legend-bar" aria-hidden="true">▍</span> {ss.legendWc}</div>
      </>
    );
  } else {
    body = (
      <div className="sp-bracket">
        {stagesPresent.map(s => (
          <section key={s} className="sp-round">
            <div className={`sp-group-title${s === 'final' ? ' sp-final-title' : ''}`}>{s === 'final' ? '🏆 ' : ''}{ss[STAGE_KEY[s]]}</div>
            <div className="sp-round-list">
              {data.matches.filter(m => m.stage === s).map(m => <MatchRow key={m.id} m={m} onOpen={() => setSelected(m)} />)}
            </div>
          </section>
        ))}
        {stagesPresent.length === 0 && <div className="sp-state">{ss.noMatches}</div>}
      </div>
    );
  }

  return (
    <div className="sp-standings">
      <div className="sp-tabs" role="tablist">
        {(['matches', 'groups', 'bracket'] as const).map(v => (
          <button key={v} type="button" role="tab" aria-selected={view === v} className={`sp-tab${view === v ? ' is-on' : ''}`} onClick={() => setView(v)}>
            {ss[v]}
          </button>
        ))}
      </div>
      {body}
      {data && !live.loading && !live.error && <div className="sp-meta"><span>{ss.wc}</span><UpdatedAgo at={data.updatedAt} /></div>}
      {selected && <MatchDetail m={selected} onClose={() => setSelected(null)} />}
      <LiveStandingsStyles />
      <style>{`
        .wc-game { width: 100%; font: inherit; color: inherit; text-align: start; }
        .sp-tab-sm { min-height: 30px; padding: 0 12px; }
        .wc-tz { font-size: 12px; color: var(--text3); }
        .wc-tz b { color: var(--text2); font-weight: 600; }
        .wc-list { display: flex; flex-direction: column; gap: 12px; max-height: 560px; overflow-y: auto; padding-inline-end: 2px; }
        .wc-day { display: flex; flex-direction: column; gap: 4px; }
        .wc-day-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text3); }
        .wc-day-title.is-today { color: #FCA5A5; }
        .wc-today { background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.35); border-radius: 5px; padding: 1px 6px; }
        .wc-stage { font-size: 11px; color: var(--text3); margin: 2px 0 2px 4px; }
        .wc-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 12px; }
        @media (max-width: 420px) { .wc-groups { grid-template-columns: 1fr; } }
        .wc-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 16px; }
        .wc-modal { position: relative; width: 100%; max-width: 400px; background: rgba(12,16,36,.98); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 22px 18px; box-shadow: 0 24px 64px rgba(0,0,0,.7); }
        .wc-close { position: absolute; top: 12px; inset-inline-end: 12px; width: 32px; height: 32px; border-radius: 50%; border: 0; cursor: pointer; background: rgba(255,255,255,.08); color: var(--text2); }
        .wc-d-tags { display: flex; gap: 6px; margin-bottom: 16px; }
        .wc-tag { font-size: 12px; font-weight: 700; color: #FCA5A5; background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); border-radius: 6px; padding: 2px 8px; }
        .wc-tag-dim { color: var(--text2); background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.08); }
        .wc-d-teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; margin-bottom: 16px; }
        .wc-d-team { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
        .wc-d-name { font-size: 13px; font-weight: 700; color: #fff; }
        .wc-d-name.is-lose { color: var(--text3); font-weight: 500; }
        .wc-d-score { font: 800 30px 'Poppins', sans-serif; color: #fff; }
        .wc-d-info { display: flex; flex-direction: column; gap: 6px; background: rgba(255,255,255,.03); border-radius: 12px; padding: 12px 14px; font-size: 13px; color: var(--text2); }
      `}</style>
    </div>
  );
}
