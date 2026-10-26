/* Live sports data from ESPN, normalised for the sports page and the dashboard panel.
   Server only (used by app/api/sports/[league]/[view]/route.ts).

   Every result is cached in memory for 10 minutes and carries `updatedAt` (when ESPN was asked).
   When ESPN fails, the error is passed on — the page then shows a message, never old data. */

import type {
  LeaderCol, LeadersPayload, PlayoffRound, PlayoffSeries, PlayoffsPayload, ProLeague, SportTeam,
  StandingCol, StandingGroup, StandingRow, StandingsPayload, WcGroup, WcMatch, WcStage, WcTeam, WorldCupPayload,
} from './types';

export const CACHE_MS = 10 * 60 * 1000;

const SPORT: Record<ProLeague, string> = { nhl: 'hockey/nhl', nba: 'basketball/nba', nfl: 'football/nfl' };
const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
const SITE_WEB = 'https://site.web.api.espn.com/apis';
const CORE = 'https://sports.core.api.espn.com/v2/sports';

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN JSON is untyped; every field is read defensively */

/* ── fetch + cache ── */

export class EspnError extends Error {}

async function espn(url: string): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000), headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new EspnError(`ESPN unreachable: ${(err as Error).message}`);
  }
  if (!res.ok) throw new EspnError(`ESPN ${res.status} for ${url}`);
  return res.json();
}

type Entry<T> = { at: number; promise: Promise<T> };
const cache = new Map<string, Entry<unknown>>();

/** Runs `load` at most once per 10 minutes per key; concurrent callers share one request.
 *  A failed load is dropped right away so the next request tries ESPN again. */
export function cached<T>(key: string, load: () => Promise<T>, ttl = CACHE_MS): Promise<T> {
  const hit = cache.get(key) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < ttl) return hit.promise;
  const promise = load();
  cache.set(key, { at: Date.now(), promise });
  promise.catch(() => { if (cache.get(key)?.promise === promise) cache.delete(key); });
  return promise;
}

/* ── teams (colours) ── */

function hex(c: unknown): string {
  return typeof c === 'string' && /^[0-9a-f]{6}$/i.test(c) ? `#${c.toLowerCase()}` : '#475569';
}

function toTeam(t: any, colors?: Map<string, string>): SportTeam {
  const id = String(t?.id ?? '');
  return {
    id,
    abbr: t?.abbreviation ?? '?',
    name: t?.displayName ?? t?.name ?? '?',
    short: t?.shortDisplayName ?? t?.name ?? t?.abbreviation ?? '?',
    color: t?.color ? hex(t.color) : hex(colors?.get(id)),
  };
}

/** Team id → colour (hex without #). Changes rarely, so it is kept for a day. */
function teamColors(league: ProLeague): Promise<Map<string, string>> {
  return cached(`colors:${league}`, async () => {
    const d = await espn(`${SITE}/${SPORT[league]}/teams?limit=100`);
    const map = new Map<string, string>();
    for (const item of d?.sports?.[0]?.leagues?.[0]?.teams ?? []) {
      const t = item.team;
      if (t?.id && t.color) map.set(String(t.id), t.color);
    }
    return map;
  }, 24 * 60 * 60 * 1000);
}

function seasonLabel(season: any): string {
  const name: string = season?.displayName ?? String(season?.year ?? '');
  return name.replace(/^(\d{4})-(\d{2})$/, '$1/$2');
}

/* ── standings ── */

const COLUMNS: Record<ProLeague, StandingCol[]> = {
  nhl: ['gp', 'w', 'l', 'otl', 'diff', 'pts'],
  nba: ['gp', 'w', 'l', 'pct', 'gb'],
  nfl: ['w', 'l', 't', 'pct', 'diff'],
};
/** Highest conference seed that is in the play-off right now (NBA: direct places, without the play-in). */
const PLAYOFF_SEEDS: Record<ProLeague, number> = { nhl: 8, nba: 6, nfl: 7 };

function statMap(entry: any): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of entry?.stats ?? []) if (s?.name) m.set(s.name, String(s.displayValue ?? ''));
  return m;
}

function confOf(name: string): StandingGroup['conference'] {
  if (/^(american|afc)/i.test(name)) return 'afc';
  if (/^(national football|nfc)/i.test(name)) return 'nfc';
  if (/east/i.test(name)) return 'east';
  if (/west/i.test(name)) return 'west';
  return undefined;
}

function toRow(league: ProLeague, entry: any, colors: Map<string, string>): StandingRow {
  const s = statMap(entry);
  const seed = Number(s.get('playoffSeed'));
  const wins = s.get('wins') ?? '0', losses = s.get('losses') ?? '0';
  const values: StandingRow['values'] = {
    gp: s.get('gamesPlayed') ?? String((Number(wins) || 0) + (Number(losses) || 0) + (Number(s.get('ties')) || 0)),
    w: wins, l: losses,
    otl: s.get('otLosses') ?? s.get('overtimeLosses'),
    t: s.get('ties'),
    pct: s.get('winPercent'),
    gb: s.get('gamesBehind'),
    diff: s.get('pointDifferential') ?? s.get('differential'),
    pts: s.get('points'),
  };
  return {
    team: toTeam(entry.team, colors),
    seed: Number.isFinite(seed) && seed > 0 ? seed : undefined,
    qualified: Number.isFinite(seed) && seed > 0 && seed <= PLAYOFF_SEEDS[league],
    values,
  };
}

const num = (v: string | undefined) => { const n = parseFloat(String(v ?? '').replace(/[^\d.+-]/g, '')); return Number.isFinite(n) ? n : 0; };

/** Whole-league order: points (NHL) or win % (NBA, NFL), then wins. */
function leagueSort(league: ProLeague) {
  return (a: StandingRow, b: StandingRow) => league === 'nhl'
    ? num(b.values.pts) - num(a.values.pts) || num(b.values.w) - num(a.values.w)
    : num(b.values.pct) - num(a.values.pct) || num(b.values.w) - num(a.values.w);
}
/** Conference / division order: by play-off seed (ESPN applies the tie-breakers), unseeded last. */
const seedSort = (a: StandingRow, b: StandingRow) => (a.seed ?? 99) - (b.seed ?? 99);

/** Dashed line under the last qualified row of a qualified run from the top. */
function lineAfter(rows: StandingRow[]): number {
  let n = 0;
  while (n < rows.length && rows[n].qualified) n++;
  return n > 0 && n < rows.length ? n : 0;
}

function group(id: string, name: string, rows: StandingRow[], conference?: StandingGroup['conference']): StandingGroup {
  return { id, name, conference, rows, lineAfter: lineAfter(rows) };
}

export function getStandings(league: ProLeague): Promise<StandingsPayload> {
  return cached(`standings:${league}`, async () => {
    const [d, colors] = await Promise.all([
      espn(`${SITE_WEB}/v2/sports/${SPORT[league]}/standings?level=3`),
      teamColors(league).catch(() => new Map<string, string>()),
    ]);
    const conferences: StandingGroup[] = [];
    const divisions: StandingGroup[] = [];
    const all: StandingRow[] = [];
    for (const conf of d?.children ?? []) {
      const c = confOf(conf.name ?? conf.abbreviation ?? '');
      const confRows: StandingRow[] = [];
      for (const div of conf.children ?? []) {
        const rows = (div.standings?.entries ?? []).map((e: any) => toRow(league, e, colors)).sort(seedSort);
        if (!rows.length) continue;
        confRows.push(...rows);
        divisions.push(group(String(div.id ?? div.abbreviation), String(div.name ?? '').replace(/\s*Division$/i, ''), rows, c));
      }
      // A conference without divisions (or ESPN returning entries directly)
      for (const e of conf.standings?.entries ?? []) confRows.push(toRow(league, e, colors));
      if (!confRows.length) continue;
      confRows.sort(seedSort);
      all.push(...confRows);
      conferences.push(group(String(conf.id ?? conf.abbreviation), String(conf.abbreviation ?? conf.name ?? ''), confRows, c));
    }
    if (!all.length) throw new EspnError(`No standings for ${league}`);
    // The play-off line only makes sense inside a conference; the league table just marks the rows
    const overall = [{ id: 'league', name: '', rows: [...all].sort(leagueSort(league)), lineAfter: 0 }];
    return {
      league, season: seasonLabel(d.season), updatedAt: Date.now(), columns: COLUMNS[league],
      overall, conference: conferences, division: divisions,
    };
  });
}

/* ── player leaders ── */

const LEADERS: Record<ProLeague, { sort: string; cols: LeaderCol[]; stats: [string, string][] }> = {
  nhl: { sort: 'offensive.points:desc', cols: ['g', 'a', 'pts'], stats: [['offensive', 'goals'], ['offensive', 'assists'], ['offensive', 'points']] },
  nba: { sort: 'offensive.avgPoints:desc', cols: ['ppg', 'rpg', 'apg'], stats: [['offensive', 'avgPoints'], ['general', 'avgRebounds'], ['offensive', 'avgAssists']] },
  nfl: { sort: 'passing.passingYards:desc', cols: ['passYdsShort', 'td', 'int'], stats: [['passing', 'passingYards'], ['passing', 'passingTouchdowns'], ['passing', 'interceptions']] },
};

export function getLeaders(league: ProLeague): Promise<LeadersPayload> {
  return cached(`leaders:${league}`, async () => {
    const cfg = LEADERS[league];
    const [d, colors] = await Promise.all([
      espn(`${SITE_WEB}/common/v3/sports/${SPORT[league]}/statistics/byathlete?limit=10&sort=${cfg.sort}`),
      teamColors(league).catch(() => new Map<string, string>()),
    ]);
    const index = new Map<string, number>();
    for (const c of d?.categories ?? []) (c.names ?? []).forEach((n: string, i: number) => index.set(`${c.name}.${n}`, i));
    const rows = (d?.athletes ?? []).slice(0, 10).map((a: any, i: number) => {
      const cats = new Map<string, string[]>((a.categories ?? []).map((c: any) => [c.name, c.totals ?? []]));
      const ath = a.athlete ?? {};
      return {
        rank: i + 1,
        name: ath.displayName ?? '?',
        team: toTeam({ id: ath.teamId, abbreviation: ath.teamShortName, displayName: ath.teamName, shortDisplayName: ath.teamName }, colors),
        values: cfg.stats.map(([cat, name]) => cats.get(cat)?.[index.get(`${cat}.${name}`) ?? -1] ?? '—'),
      };
    });
    if (!rows.length) throw new EspnError(`No leaders for ${league}`);
    return { league, season: seasonLabel(d.requestedSeason ?? d.currentSeason), updatedAt: Date.now(), columns: cfg.cols, rows };
  });
}

/* ── play-off ── */

function stageOf(headline: string): PlayoffRound['stage'] | null {
  if (/play-?in|pro bowl/i.test(headline)) return null;
  if (/stanley cup final|nba finals|super bowl/i.test(headline)) return 4;
  if (/semifinal|2nd round|second round|divisional/i.test(headline)) return 2;
  if (/final|championship/i.test(headline)) return 3;
  if (/1st round|first round|wild ?card/i.test(headline)) return 1;
  return null;
}

/** YYYYMM of every month from `from` up to `to`. */
function months(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  while (d <= to && out.length < 8) {
    out.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export function getPlayoffs(league: ProLeague): Promise<PlayoffsPayload> {
  return cached(`playoffs:${league}`, async () => {
    const board = await espn(`${SITE}/${SPORT[league]}/scoreboard`);
    const season = board?.leagues?.[0]?.season;
    const year = Number(season?.year);
    const base = { league, season: seasonLabel(season), bestOf: league !== 'nfl', rounds: [] as PlayoffRound[] };
    if (!year) throw new EspnError(`No season for ${league}`);

    // Play-off window of the current season; before it starts there is nothing to show
    let window: any;
    try { window = await espn(`${CORE}/${SPORT[league].replace('/', '/leagues/')}/seasons/${year}/types/3`); } catch {
      return { ...base, updatedAt: Date.now(), active: false };
    }
    const start = new Date(window?.startDate), end = new Date(window?.endDate);
    const now = new Date();
    if (!(start.getTime() <= now.getTime())) return { ...base, updatedAt: Date.now(), active: false };

    const boards = await Promise.all(months(start, end < now ? end : now).map(m => espn(`${SITE}/${SPORT[league]}/scoreboard?dates=${m}&limit=1000`)));
    const series = new Map<string, PlayoffSeries & { stage: PlayoffRound['stage']; first: number; last: number }>();
    for (const ev of boards.flatMap(b => b?.events ?? [])) {
      if (ev?.season?.type !== 3 || Number(ev?.season?.year) !== year) continue;
      const comp = ev.competitions?.[0];
      const headline: string = comp?.notes?.[0]?.headline ?? '';
      const stage = stageOf(headline);
      const teams = comp?.competitors ?? [];
      if (!stage || teams.length !== 2) continue;
      const [ca, cb] = teams;
      const ids = [String(ca.team?.id), String(cb.team?.id)].sort();
      const key = league === 'nfl' ? String(ev.id) : `${stage}:${ids.join('-')}`;
      const at = Date.parse(ev.date) || 0;
      const done = comp?.status?.type?.completed === true;
      const prev = series.get(key);
      if (prev && at < prev.last) continue; // keep the state of the latest game

      let s: PlayoffSeries;
      if (league === 'nfl') {
        const winner = teams.find((c: any) => c.winner)?.team?.id;
        s = {
          id: key, a: toTeam(ca.team), b: toTeam(cb.team),
          aWins: Math.round(Number(ca.score) || 0), bWins: Math.round(Number(cb.score) || 0),
          completed: done, winner: done && winner ? String(winner) : undefined,
        };
      } else {
        const ser = comp?.series;
        const wins = new Map<string, number>((ser?.competitors ?? []).map((c: any) => [String(c.id), Number(c.wins) || 0]));
        const aw = wins.get(String(ca.team?.id)) ?? 0, bw = wins.get(String(cb.team?.id)) ?? 0;
        const completed = ser?.completed === true;
        s = {
          id: key, a: toTeam(ca.team), b: toTeam(cb.team), aWins: aw, bWins: bw, completed,
          winner: completed ? String(aw > bw ? ca.team?.id : cb.team?.id) : undefined,
        };
      }
      const conf = /AFC/.test(headline) ? 'afc' : /NFC/.test(headline) ? 'nfc' : /east/i.test(headline) ? 'east' : /west/i.test(headline) ? 'west' : undefined;
      series.set(key, { ...s, conference: conf, stage, first: prev?.first ?? at, last: at });
    }

    const rounds: PlayoffRound[] = ([1, 2, 3, 4] as const)
      .map(stage => ({
        stage,
        series: [...series.values()]
          .filter(s => s.stage === stage)
          .sort((x, y) => (x.conference ?? '').localeCompare(y.conference ?? '') || x.first - y.first)
          .map((x): PlayoffSeries => ({
            id: x.id, a: x.a, b: x.b, aWins: x.aWins, bWins: x.bWins, completed: x.completed, winner: x.winner, conference: x.conference,
          })),
      }))
      .filter(r => r.series.length > 0);
    return { ...base, updatedAt: Date.now(), active: rounds.length > 0, rounds };
  });
}

/* ── FIFA World Cup 2026 ── */

/** FIFA code → ISO 3166 code, for the flag and the team name in the UI language. */
const FIFA_ISO: Record<string, string> = {
  MEX: 'mx', CZE: 'cz', KOR: 'kr', RSA: 'za', CAN: 'ca', BIH: 'ba', SUI: 'ch', QAT: 'qa', BRA: 'br', SCO: 'gb-sct',
  HAI: 'ht', MAR: 'ma', PAR: 'py', TUR: 'tr', AUS: 'au', USA: 'us', ECU: 'ec', GER: 'de', CIV: 'ci', CUW: 'cw',
  NED: 'nl', SWE: 'se', JPN: 'jp', TUN: 'tn', BEL: 'be', IRN: 'ir', EGY: 'eg', NZL: 'nz', ESP: 'es', URU: 'uy',
  KSA: 'sa', CPV: 'cv', NOR: 'no', FRA: 'fr', SEN: 'sn', IRQ: 'iq', ARG: 'ar', AUT: 'at', ALG: 'dz', JOR: 'jo',
  COL: 'co', POR: 'pt', UZB: 'uz', COD: 'cd', ENG: 'gb-eng', CRO: 'hr', PAN: 'pa', GHA: 'gh', WAL: 'gb-wls',
  NIR: 'gb-nir', ITA: 'it', DEN: 'dk', POL: 'pl', SRB: 'rs', UKR: 'ua', CMR: 'cm', NGA: 'ng', CRC: 'cr', CHI: 'cl',
  PER: 'pe', SVK: 'sk', SVN: 'si', HUN: 'hu', ROU: 'ro', GRE: 'gr', IRL: 'ie', ISL: 'is', HON: 'hn', JAM: 'jm',
};

const WC = 'soccer/fifa.world';
const WC_STAGE: Record<string, WcStage> = {
  'group-stage': 'group', 'round-of-32': 'r32', 'round-of-16': 'r16', quarterfinals: 'qf',
  semifinals: 'sf', '3rd-place-match': 'third', final: 'final',
};

function wcTeam(t: any, colors?: Map<string, string>): WcTeam {
  const base = toTeam(t, colors);
  return { ...base, iso: FIFA_ISO[base.abbr] };
}

export function getWorldCup(): Promise<WorldCupPayload> {
  return cached('wc2026', async () => {
    const [table, june, july] = await Promise.all([
      espn(`https://site.api.espn.com/apis/v2/sports/${WC}/standings?season=2026`),
      espn(`${SITE}/${WC}/scoreboard?dates=202606&limit=300`),
      espn(`${SITE}/${WC}/scoreboard?dates=202607&limit=300`),
    ]);
    const events: any[] = [...(june?.events ?? []), ...(july?.events ?? [])]
      .filter(e => Number(e?.season?.year) === 2026)
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

    // Colours come with the matches (the table has none)
    const colors = new Map<string, string>();
    for (const e of events) for (const c of e.competitions?.[0]?.competitors ?? []) if (c.team?.id && c.team.color) colors.set(String(c.team.id), c.team.color);

    const groupOf = new Map<string, string>();
    const groups: WcGroup[] = (table?.children ?? []).map((g: any) => {
      const letter = String(g.name ?? '').replace(/^Group\s+/i, '') || '?';
      const rows = (g.standings?.entries ?? []).map((e: any) => {
        const s = statMap(e);
        groupOf.set(String(e.team?.id), letter);
        return {
          team: wcTeam(e.team, colors),
          rank: Number(s.get('rank')) || 99,
          qualified: s.get('advanced') === '1' || /advance/i.test(e.note?.description ?? ''),
          values: {
            gp: s.get('gamesPlayed') ?? '0', w: s.get('wins') ?? '0', d: s.get('ties') ?? '0', l: s.get('losses') ?? '0',
            gd: s.get('pointDifferential') ?? '0', pts: s.get('points') ?? '0',
          },
        };
      }).sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
        .map((x: { rank: number; team: WcTeam; qualified: boolean; values: WcGroup['rows'][number]['values'] }) => ({ team: x.team, qualified: x.qualified, values: x.values }));
      return { letter, rows };
    }).filter((g: WcGroup) => g.rows.length > 0);
    if (!groups.length && !events.length) throw new EspnError('No World Cup data');

    const playedInGroup = new Map<string, number>();
    const matches: WcMatch[] = events.flatMap((ev): WcMatch[] => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
      if (!home || !away) return [];
      const stage = WC_STAGE[ev.season?.slug] ?? 'group';
      const st = comp.status?.type ?? {};
      const status: WcMatch['status'] = st.completed ? 'final' : st.state === 'in' ? 'live' : 'upcoming';
      const group = stage === 'group' ? groupOf.get(String(home.team?.id)) : undefined;
      // Two matches per group and matchday, in date order
      let matchday: number | undefined;
      if (group) {
        const n = playedInGroup.get(group) ?? 0;
        playedInGroup.set(group, n + 1);
        matchday = Math.min(3, Math.floor(n / 2) + 1);
      }
      const score = (c: any) => (status === 'upcoming' || c.score == null ? undefined : Math.round(Number(c.score) || 0));
      const pens = (c: any) => (c.shootoutScore != null ? Number(c.shootoutScore) : undefined);
      return [{
        id: String(ev.id), stage, group, matchday, date: ev.date, status,
        clock: status === 'live' ? (comp.status?.displayClock ?? undefined) : undefined,
        home: wcTeam(home.team, colors), away: wcTeam(away.team, colors),
        homeScore: score(home), awayScore: score(away), homePens: pens(home), awayPens: pens(away),
        winner: home.winner ? 'home' : away.winner ? 'away' : undefined,
        venue: comp.venue?.fullName, city: comp.venue?.address?.city,
      }];
    });
    return { updatedAt: Date.now(), groups, matches };
  });
}
