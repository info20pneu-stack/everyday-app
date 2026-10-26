'use client';

import { useCallback } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { sportsStrings, type SportsStrings } from '../../../lib/sportsI18n';
import type {
  LeadersPayload, PlayoffRound, PlayoffSeries, PlayoffsPayload, ProLeague, StandingGroup, StandingsPayload,
} from '../../../lib/sports/types';
import TeamBadge from './TeamBadge';
import UpdatedAgo from './UpdatedAgo';
import { useLive } from './useLive';

/* Live tables of one league (ESPN via /api/sports/<league>/<view>, cached 10 min on the server):
   league, conference and division tables, player leaders and — only once the current season's
   play-off has started — the play-off bracket. No stored data: on an error a message is shown. */

export type StandingsTab = 'league' | 'conference' | 'division' | 'players' | 'playoff';

/** ESPN values in the UI language: ".761" → "0,761", "1,989" → "1 989", "+18" stays signed. */
export function localStat(val: string | undefined, lang: string): string {
  if (val == null || val === '') return '–';
  const m = /^([+-]?)([\d,]*)(?:\.(\d+))?$/.exec(val.trim());
  if (!m || (!m[2] && !m[3])) return val;
  const n = Number(`${m[1]}${(m[2] || '0').replace(/,/g, '')}${m[3] ? `.${m[3]}` : ''}`);
  if (!Number.isFinite(n)) return val;
  const digits = m[3]?.length ?? 0;
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: digits, maximumFractionDigits: digits, signDisplay: m[1] === '+' ? 'exceptZero' : 'auto',
  }).format(n);
}

const PLAYER_TAB: Record<ProLeague, keyof SportsStrings> = { nhl: 'tabPlayersNhl', nba: 'tabPlayersNba', nfl: 'tabPlayersNfl' };
const STAGE_LABEL: Record<ProLeague, Record<PlayoffRound['stage'], keyof SportsStrings>> = {
  nhl: { 1: 'round1', 2: 'round2', 3: 'confFinals', 4: 'cupFinal' },
  nba: { 1: 'round1', 2: 'round2', 3: 'confFinals', 4: 'finalsNba' },
  nfl: { 1: 'wildCard', 2: 'divisional', 3: 'confChampionship', 4: 'superBowl' },
};

function groupTitle(g: StandingGroup, ss: SportsStrings): string {
  if (g.conference === 'east' && /^east/i.test(g.name)) return ss.eastern;
  if (g.conference === 'west' && /^west/i.test(g.name)) return ss.western;
  return g.name;
}

export default function LiveStandings({ league, tab, onTab }: {
  league: ProLeague; tab: StandingsTab; onTab: (t: StandingsTab) => void;
}) {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const standings = useLive<StandingsPayload>(`/api/sports/${league}/standings`);
  const playoffs = useLive<PlayoffsPayload>(`/api/sports/${league}/playoffs`);
  const leaders = useLive<LeadersPayload>(tab === 'players' ? `/api/sports/${league}/leaders` : null);

  const showPlayoff = playoffs.data?.active === true;
  const active: StandingsTab = tab === 'playoff' && !showPlayoff ? 'league' : tab;

  const tabs: { id: StandingsTab; label: string }[] = [
    { id: 'league', label: ss.tabLeague },
    { id: 'conference', label: ss.tabConference },
    { id: 'division', label: ss.tabDivision },
    { id: 'players', label: ss[PLAYER_TAB[league]] },
    ...(showPlayoff ? [{ id: 'playoff' as const, label: ss.tabPlayoff }] : []),
  ];

  const source = active === 'players' ? leaders : active === 'playoff' ? playoffs : standings;
  const retry = useCallback(() => source.reload(), [source]);

  let body: React.ReactNode;
  if (source.loading) body = <div className="sp-state">{ss.loadingData}</div>;
  else if (source.error || !source.data) {
    body = (
      <div className="sp-state sp-state-error" role="alert">
        <div>⚠️ {ss.dataError}</div>
        <button type="button" className="sp-retry" onClick={retry}>{t.sports.retry}</button>
      </div>
    );
  } else if (active === 'players' && leaders.data) {
    body = <LeadersTable data={leaders.data} />;
  } else if (active === 'playoff' && playoffs.data) {
    body = <PlayoffBracket data={playoffs.data} />;
  } else if (standings.data) {
    const s = standings.data;
    const groups = active === 'conference' ? s.conference : active === 'division' ? s.division : s.overall;
    body = (
      <>
        {groups.map(g => (
          <div key={g.id} className="sp-group">
            {g.name && <div className={`sp-group-title sp-conf-${g.conference ?? 'none'}`}>{groupTitle(g, ss)}</div>}
            <StandingsTable group={g} columns={s.columns} />
          </div>
        ))}
        <div className="sp-legend"><span className="sp-legend-bar" aria-hidden="true">▍</span> {ss.legendPlayoff}</div>
      </>
    );
  }

  const meta = source.data && !source.loading && !source.error ? source.data : null;

  return (
    <div className="sp-standings">
      <div className="sp-tabs" role="tablist">
        {tabs.map(x => (
          <button key={x.id} type="button" role="tab" aria-selected={active === x.id}
            className={`sp-tab${active === x.id ? ' is-on' : ''}`} onClick={() => onTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      {body}
      {meta && (
        <div className="sp-meta">
          <span>{ss.season.replace('{s}', meta.season)}</span>
          <UpdatedAgo at={meta.updatedAt} />
        </div>
      )}
      <LiveStandingsStyles />
    </div>
  );
}

function StandingsTable({ group, columns }: { group: StandingGroup; columns: StandingsPayload['columns'] }) {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const template = `var(--sp-rank) minmax(0, 1fr) ${columns.map(c => (c === 'pct' ? 'var(--sp-col-wide)' : 'var(--sp-col)')).join(' ')}`;
  return (
    <div className="sp-table" role="table">
      <div className="sp-row sp-head" role="row" style={{ gridTemplateColumns: template }}>
        <span role="columnheader">#</span>
        <span role="columnheader">{t.sports.team}</span>
        {columns.map(c => <span key={c} role="columnheader" className={`sp-num${c === 'pts' ? ' sp-strong' : ''}`}>{ss[c]}</span>)}
      </div>
      {group.rows.map((r, i) => (
        <div key={r.team.id}
          className={`sp-row${r.qualified ? ' is-q' : ''}${group.lineAfter === i + 1 ? ' sp-cut' : ''}`}
          role="row" style={{ gridTemplateColumns: template }}>
          <span className="sp-rank" role="cell">{i + 1}</span>
          <span className="sp-team" role="cell">
            <TeamBadge abbr={r.team.abbr} color={r.team.color} size="sm" />
            <span className="sp-team-name" title={r.team.name}>{r.team.short}</span>
          </span>
          {columns.map(c => (
            <span key={c} role="cell" dir="ltr" className={`sp-num${c === 'pts' ? ' sp-strong' : ''}`}>{localStat(r.values[c], lang)}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function LeadersTable({ data }: { data: LeadersPayload }) {
  const { t, lang } = useLang();
  const ss = sportsStrings(lang);
  const template = `var(--sp-rank) minmax(0, 1fr) ${data.columns.map(c => (c === 'passYdsShort' ? 'var(--sp-col-xwide)' : 'var(--sp-col-wide)')).join(' ')}`;
  const last = data.columns.length - 1;
  return (
    <div className="sp-table" role="table">
      <div className="sp-row sp-head" role="row" style={{ gridTemplateColumns: template }}>
        <span role="columnheader">#</span>
        <span role="columnheader">{t.sports.player}</span>
        {data.columns.map((c, i) => <span key={c} role="columnheader" className={`sp-num${i === (data.league === 'nhl' ? last : 0) ? ' sp-strong' : ''}`}>{ss[c]}</span>)}
      </div>
      {data.rows.map(r => (
        <div key={`${r.rank}-${r.name}`} className="sp-row" role="row" style={{ gridTemplateColumns: template }}>
          <span className="sp-rank" role="cell">{r.rank}</span>
          <span className="sp-team" role="cell">
            <TeamBadge abbr={r.team.abbr} color={r.team.color} size="sm" title={r.team.name} />
            <span className="sp-team-name">{r.name}</span>
          </span>
          {r.values.map((v, i) => (
            <span key={i} role="cell" dir="ltr" className={`sp-num${i === (data.league === 'nhl' ? last : 0) ? ' sp-strong' : ''}`}>{localStat(v, lang)}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function SeriesRow({ s }: { s: PlayoffSeries }) {
  const aWon = s.completed && s.winner === s.a.id;
  const bWon = s.completed && s.winner === s.b.id;
  const cls = (won: boolean, lost: boolean) => (won ? ' is-win' : lost ? ' is-lose' : '');
  return (
    <div className="sp-series">
      <TeamBadge abbr={s.a.abbr} color={s.a.color} size="sm" />
      <span className={`sp-series-name${cls(aWon, bWon)}`} title={s.a.name}>{s.a.short}</span>
      <span className="sp-series-score tabular-nums" dir="ltr">
        <span className={cls(aWon, bWon)}>{s.aWins}</span>–<span className={cls(bWon, aWon)}>{s.bWins}</span>
      </span>
      <span className={`sp-series-name sp-end${cls(bWon, aWon)}`} title={s.b.name}>{s.b.short}</span>
      <TeamBadge abbr={s.b.abbr} color={s.b.color} size="sm" />
    </div>
  );
}

function PlayoffBracket({ data }: { data: PlayoffsPayload }) {
  const { lang } = useLang();
  const ss = sportsStrings(lang);
  return (
    <div className="sp-bracket">
      {data.rounds.map(r => (
        <section key={r.stage} className="sp-round">
          <div className={`sp-group-title${r.stage === 4 ? ' sp-final-title' : ''}`}>{r.stage === 4 ? '🏆 ' : ''}{ss[STAGE_LABEL[data.league][r.stage]]}</div>
          <div className="sp-round-list">{r.series.map(s => <SeriesRow key={s.id} s={s} />)}</div>
        </section>
      ))}
    </div>
  );
}

export function LiveStandingsStyles() {
  return (
    <style href="everyday-sports-tables" precedence="medium">{`
      .sp-standings { display: flex; flex-direction: column; gap: 10px; }
      /* Tabs: one row, never wrapping; scroll sideways on narrow screens */
      .sp-tabs {
        display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto; white-space: nowrap;
        scrollbar-width: none; -webkit-overflow-scrolling: touch; padding-bottom: 2px;
        margin-inline: -2px; padding-inline: 2px;
      }
      .sp-tabs::-webkit-scrollbar { display: none; }
      .sp-tab {
        flex: none; white-space: nowrap; cursor: pointer; min-height: 34px; padding: 0 14px; border-radius: 999px;
        font: 600 12px 'Poppins', 'Inter', sans-serif; color: var(--text2);
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
      }
      .sp-tab:hover { background: rgba(255,255,255,0.09); }
      .sp-tab.is-on { color: #fff; border-color: transparent; background: linear-gradient(135deg, #EF4444, #B91C1C); box-shadow: 0 4px 14px rgba(239,68,68,.3); }
      .sp-tab:focus-visible, .sp-retry:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

      .sp-group { display: flex; flex-direction: column; gap: 4px; }
      .sp-group + .sp-group { margin-top: 8px; }
      .sp-group-title { font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; color: var(--text2); margin: 2px 0 2px 4px; }
      .sp-conf-east, .sp-conf-afc { color: #93C5FD; }
      .sp-conf-west, .sp-conf-nfc { color: #FCA5A5; }
      .sp-final-title { color: var(--amber, #FFB300); }

      .sp-table {
        display: flex; flex-direction: column; gap: 4px;
        --sp-rank: 26px; --sp-col: 34px; --sp-col-wide: 44px; --sp-col-xwide: 54px;
      }
      .sp-row {
        position: relative; display: grid; align-items: center; gap: 4px; min-height: 40px; padding: 5px 8px 5px 10px;
        border-radius: 10px; background: rgba(255,255,255,0.03); font-size: 12px; color: #fff;
      }
      .sp-row.sp-head { min-height: 26px; background: none; color: var(--text3); font-size: 11px; font-weight: 600; }
      .sp-row.is-q { background: rgba(239,68,68,0.08); }
      .sp-row.is-q::before {
        content: ''; position: absolute; inset-inline-start: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 3px; background: #EF4444;
      }
      .sp-row.sp-cut { margin-bottom: 7px; }
      .sp-row.sp-cut::after {
        content: ''; position: absolute; left: 6px; right: 6px; bottom: -6px; border-bottom: 1.5px dashed rgba(239,68,68,0.55);
      }
      .sp-rank { color: var(--text3); font-weight: 700; font-variant-numeric: tabular-nums; }
      .is-q .sp-rank { color: #FCA5A5; }
      .sp-team { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .sp-team-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
      .sp-num { text-align: center; font-variant-numeric: tabular-nums; color: var(--text2); }
      .sp-row:not(.sp-head) .sp-num.sp-strong { color: #fff; font-weight: 800; }
      .sp-legend { font-size: 12px; color: var(--text3); margin: 2px 0 0 4px; }
      .sp-legend-bar { color: #EF4444; }
      .sp-meta { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--text3); margin: 0 4px; }
      .sp-state { text-align: center; padding: 1.6rem 0.5rem; font-size: 13px; color: var(--text3); }
      .sp-state-error { color: var(--text2); display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .sp-retry {
        cursor: pointer; min-height: 36px; padding: 0 16px; border-radius: 999px; font: 600 13px 'Poppins', sans-serif;
        color: #fff; background: linear-gradient(135deg, #EF4444, #B91C1C); border: 0;
      }

      .sp-bracket { display: flex; flex-direction: column; gap: 12px; }
      .sp-round-list { display: flex; flex-direction: column; gap: 4px; }
      .sp-series {
        display: grid; grid-template-columns: 24px minmax(0, 1fr) auto minmax(0, 1fr) 24px; align-items: center; gap: 8px;
        min-height: 40px; padding: 5px 10px; border-radius: 10px; background: rgba(255,255,255,0.03); font-size: 12px;
      }
      .sp-series-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text2); font-weight: 600; }
      .sp-series-name.sp-end { text-align: end; }
      .sp-series-score { font: 700 14px 'Poppins', sans-serif; color: var(--text2); display: inline-flex; gap: 3px; }
      .sp-series .is-win { color: #fff; font-weight: 800; }
      .sp-series .is-lose { color: var(--text3); }

      @media (max-width: 420px) {
        .sp-table { --sp-rank: 20px; --sp-col: 26px; --sp-col-wide: 38px; --sp-col-xwide: 46px; }
        .sp-row { padding-inline: 8px 4px; gap: 2px; font-size: 11.5px; }
        .sp-team { gap: 6px; }
      }
    `}</style>
  );
}
