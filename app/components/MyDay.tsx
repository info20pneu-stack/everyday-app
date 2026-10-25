'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import { useIsClient } from '../../lib/games/useIsClient';
import { homeStrings, formatDays, dayWord, type HomeStrings } from '../../lib/homeI18n';
import { localizedCity } from '../../lib/cityNames';
import type { Lang } from '../../lib/i18n';
import { ALL_CITIES, WORLDTIME_FAVORITES_KEY, type City } from './WorldTime';
import { AGE_CALCULATOR_DOB_KEY, loadStoredDob } from './AgeCalculator';
import { DAILY_BOOST_DONE_PREFIX, DAILY_BOOST_ACTIVITY_COUNT, todayKey } from './DailyBoost';
import { getDisplayState, STREAK_UPDATED_EVENT } from '../../lib/streak';
import {
  TEAMS_BY_LEAGUE, LEAGUE_META, type League, type TeamOption,
  type MyTeam, loadMyTeam, saveMyTeam, type MatchInfo, fetchMyTeamMatches,
} from '../../lib/teams';

/* ═══════════════════════ storage ═══════════════════════ */

const COIN_KEY = 'myday_coin_v1';
const WEATHER_CITY_KEY = 'myday_weather_city_v1';

const COIN_OPTIONS: { id: string; symbol: string; name: string }[] = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin' },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB' },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana' },
  { id: 'ripple',      symbol: 'XRP',  name: 'XRP' },
  { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'cardano',     symbol: 'ADA',  name: 'Cardano' },
  { id: 'tron',        symbol: 'TRX',  name: 'TRON' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot',    symbol: 'DOT',  name: 'Polkadot' },
];

const COLORS = {
  cities: '#0EA5E9', weather: '#F59E0B', team: '#EF4444',
  crypto: '#F7931A', birthday: '#D946EF', challenge: '#F97316',
} as const;

type WidgetId = keyof typeof COLORS;
type Editable = Exclude<WidgetId, 'challenge'>;
type WeatherPlace = { name: string; lat: number; lon: number; source: 'saved' | 'gps' | 'ip' };

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

function loadFavCities(): City[] {
  const names = lsGet<string[]>(WORLDTIME_FAVORITES_KEY, []);
  return names.map(n => ALL_CITIES.find(c => c.name === n)).filter((c): c is City => !!c).slice(0, 3);
}

function cityTime(tz: string, lang: string): string {
  return new Date().toLocaleTimeString(lang, { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' });
}

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function daysUntilBirthday(day: number, month: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

/* ═══════════════════════ widget shell ═══════════════════════ */

function Widget({ id, icon, title, editMode, onEdit, children }: {
  id: WidgetId; icon: string; title: string; editMode: boolean; onEdit?: () => void; children: ReactNode;
}) {
  const style = { '--c': COLORS[id] } as CSSProperties;
  const head = (
    <span className="md-w__head">
      <span className="md-w__icon" aria-hidden="true">{icon}</span>
      <span className="md-w__title">{title}</span>
      {editMode && onEdit && <span className="md-w__gear" aria-hidden="true">⚙</span>}
    </span>
  );
  if (editMode && onEdit) {
    return (
      <button type="button" className="md-w md-w--editable" style={style} onClick={onEdit}>
        {head}
        <span className="md-w__body">{children}</span>
      </button>
    );
  }
  return (
    <div className="md-w" style={style}>
      {head}
      <div className="md-w__body">{children}</div>
    </div>
  );
}

function Value({ main, suffix, tone }: { main: ReactNode; suffix?: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <span className="md-w__value">
      <b className="tabular-nums">{main}</b>
      {suffix != null && <small className={tone ? `md-tone-${tone}` : undefined}>{suffix}</small>}
    </span>
  );
}

/** In edit mode the whole widget is the button, so the pill is only a label there. */
function Empty({ text, label, onClick, asLabel }: { text: string; label: string; onClick: () => void; asLabel: boolean }) {
  return (
    <>
      <span className="md-w__empty">{text}</span>
      {asLabel
        ? <span className="md-pill">{label}</span>
        : <button type="button" className="md-pill" onClick={onClick}>{label}</button>}
    </>
  );
}

/* ═══════════════════════ main ═══════════════════════ */

export default function MyDay() {
  const isClient = useIsClient();
  const { lang } = useLang();
  const h = homeStrings(lang).myDay;

  return (
    <section className="myday-section">
      {/* Panel content reads localStorage, so it renders on the client only */}
      {isClient ? <MyDayPanel lang={lang} h={h} /> : (
        <>
          <div className="section-head"><h2 className="section-title">☀️ {h.title}</h2></div>
          <div className="md-panel md-panel--placeholder" />
        </>
      )}
    </section>
  );
}

function MyDayPanel({ lang, h }: { lang: Lang; h: HomeStrings['myDay'] }) {
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<Editable | null>(null);

  const [favCities, setFavCities] = useState<City[]>(loadFavCities);
  const [team, setTeam] = useState<MyTeam | null>(loadMyTeam);
  const [coinId, setCoinId] = useState<string | null>(() => lsGet<string | null>(COIN_KEY, null));
  const [dob, setDob] = useState(loadStoredDob);
  const [savedPlace, setSavedPlace] = useState<WeatherPlace | null>(() => lsGet<WeatherPlace | null>(WEATHER_CITY_KEY, null));
  const [autoPlace, setAutoPlace] = useState<WeatherPlace | null>(null);
  const [boostDone] = useState(() =>
    lsGet<boolean[]>(`${DAILY_BOOST_DONE_PREFIX}${todayKey()}`, []).filter(Boolean).length);
  const [streak, setStreak] = useState(() => getDisplayState().currentStreak);
  const [, setTick] = useState(0);

  const [weather, setWeather] = useState<{ key: string; temp: number; code: number; max: number; min: number } | null>(null);
  const [matches, setMatches] = useState<{ key: string; last: MatchInfo | null; next: MatchInfo | null } | null>(null);
  const [coinData, setCoinData] = useState<{ id: string; usd: number; change: number } | { id: string; failed: true } | null>(null);

  /* Clock for "my cities" — once per 20 s is enough for hh:mm */
  useEffect(() => {
    const id = setInterval(() => setTick(x => x + 1), 20_000);
    return () => clearInterval(id);
  }, []);

  /* Streak updates from games */
  useEffect(() => {
    const on = () => setStreak(getDisplayState().currentStreak);
    window.addEventListener(STREAK_UPDATED_EVENT, on);
    window.addEventListener('storage', on);
    return () => { window.removeEventListener(STREAK_UPDATED_EVENT, on); window.removeEventListener('storage', on); };
  }, []);

  /* Weather place when none is saved: browser location if already allowed (no prompt), else city by IP */
  useEffect(() => {
    if (savedPlace) return;
    let cancelled = false;
    (async () => {
      try {
        const perm = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
        if (perm?.state === 'granted') {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, maximumAge: 600_000 }));
          if (!cancelled) setAutoPlace({ name: '', lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' });
          return;
        }
      } catch { /* fall back to IP */ }
      try {
        const geo = await fetch('/api/geo').then(r => r.json()) as { city: string | null; lat: number | null; lon: number | null };
        if (!cancelled && geo.lat != null && geo.lon != null) {
          setAutoPlace({ name: geo.city ?? '', lat: geo.lat, lon: geo.lon, source: 'ip' });
        }
      } catch { /* stays empty → "+ Choose" */ }
    })();
    return () => { cancelled = true; };
  }, [savedPlace]);

  const place = savedPlace ?? autoPlace;
  const placeKey = place ? `${place.lat.toFixed(2)},${place.lon.toFixed(2)}` : '';

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: place.lat.toFixed(4), longitude: place.lon.toFixed(4),
      current: 'temperature_2m,weather_code', daily: 'temperature_2m_max,temperature_2m_min',
      forecast_days: '1', timezone: 'auto',
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setWeather({
          key: placeKey,
          temp: Math.round(d.current.temperature_2m), code: d.current.weather_code,
          max: Math.round(d.daily.temperature_2m_max[0]), min: Math.round(d.daily.temperature_2m_min[0]),
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // placeKey covers place changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey]);

  const teamKey = team ? `${team.league}:${team.abbr}` : '';
  useEffect(() => {
    if (!team) return;
    let cancelled = false;
    fetchMyTeamMatches(team.league, team.abbr)
      .then(m => { if (!cancelled) setMatches({ key: teamKey, ...m }); })
      .catch(() => { if (!cancelled) setMatches({ key: teamKey, last: null, next: null }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamKey]);

  useEffect(() => {
    if (!coinId) return;
    let cancelled = false;
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`)
      .then(r => r.json())
      .then(d => {
        const c = d[coinId];
        if (cancelled) return;
        setCoinData(c ? { id: coinId, usd: c.usd, change: c.usd_24h_change ?? 0 } : { id: coinId, failed: true });
      })
      .catch(() => { if (!cancelled) setCoinData({ id: coinId, failed: true }); });
    return () => { cancelled = true; };
  }, [coinId]);

  function open(id: Editable) {
    setEditing(cur => (cur === id ? null : id));
  }

  /* ── values ── */
  const w = weather && weather.key === placeKey ? weather : null;
  const tm = matches && matches.key === teamKey ? matches : null;
  const coin = coinId ? COIN_OPTIONS.find(c => c.id === coinId) ?? null : null;
  const coinState = coinData && coinData.id === coinId ? coinData : null;
  const cd = coinState && !('failed' in coinState) ? coinState : null;
  const coinFailed = !!coinState && 'failed' in coinState;
  const bdays = dob ? daysUntilBirthday(dob.day, dob.month) : null;
  const placeName = place
    ? (place.source === 'gps' && !place.name ? h.myLocation : localizedCity(place.name, lang))
    : '';
  const fmtUsd = (n: number) =>
    `$${n.toLocaleString(lang, { maximumFractionDigits: n >= 100 ? 0 : n >= 1 ? 2 : 4 })}`;

  return (
    <>
      <div className="section-head">
        <h2 className="section-title">☀️ {h.title}</h2>
        <button
          type="button"
          className={`section-link md-edit${editMode ? ' md-edit--on' : ''}`}
          aria-pressed={editMode}
          onClick={() => { setEditMode(m => !m); setEditing(null); }}
        >
          {editMode ? h.doneEdit : <>{h.edit} <span aria-hidden="true">⚙</span></>}
        </button>
      </div>

      <div className="md-panel">
        {/* ── My cities ── */}
        <Widget id="cities" icon="🌍" title={h.cities} editMode={editMode} onEdit={() => open('cities')}>
          {favCities.length === 0 ? (
            <Empty asLabel={editMode} text={h.citiesEmpty} label={h.add} onClick={() => open('cities')} />
          ) : (
            <>
              <Value main={cityTime(favCities[0].tz, lang)} />
              <span className="md-w__detail">
                {favCities.map((c, i) => i === 0
                  ? localizedCity(c.name, lang)
                  : `${localizedCity(c.name, lang)} ${cityTime(c.tz, lang)}`).join(' · ')}
              </span>
            </>
          )}
        </Widget>

        {/* ── Weather ── */}
        <Widget id="weather" icon="🌤️" title={h.weather} editMode={editMode} onEdit={() => open('weather')}>
          {!place ? (
            <Empty asLabel={editMode} text={h.weatherEmpty} label={h.pick} onClick={() => open('weather')} />
          ) : (
            <>
              <Value main={w ? `${w.temp}°` : '–'} suffix={w ? `${WMO_EMOJI[w.code] ?? '🌡️'} ↑${w.max}° ↓${w.min}°` : undefined} />
              <span className="md-w__detail">
                📍 {placeName}
                {!editMode && (
                  <button type="button" className="md-link" onClick={() => open('weather')}>{h.changeCity}</button>
                )}
              </span>
            </>
          )}
        </Widget>

        {/* ── My team ── */}
        <Widget id="team" icon="🏆" title={h.team} editMode={editMode} onEdit={() => open('team')}>
          {!team ? (
            <Empty asLabel={editMode} text={h.teamEmpty} label={h.pick} onClick={() => open('team')} />
          ) : (
            <>
              <Value
                main={tm?.last?.score ?? team.abbr}
                suffix={tm?.last?.score ? team.abbr : `${LEAGUE_META[team.league].emoji} ${LEAGUE_META[team.league].label}`}
              />
              <span className="md-w__detail">
                {!tm ? '…'
                  : tm.next ? `${h.next}: ${tm.next.homeAway} ${tm.next.oppName} · ${new Date(tm.next.date).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}`
                  : tm.last ? `${h.last}: ${tm.last.homeAway} ${tm.last.oppName}`
                  : h.noMatch}
              </span>
            </>
          )}
        </Widget>

        {/* ── Crypto ── */}
        <Widget id="crypto" icon="₿" title={h.crypto} editMode={editMode} onEdit={() => open('crypto')}>
          {!coin ? (
            <Empty asLabel={editMode} text={h.cryptoEmpty} label={h.pick} onClick={() => open('crypto')} />
          ) : (
            <>
              <Value
                main={cd ? fmtUsd(cd.usd) : coinFailed ? '–' : '…'}
                suffix={cd ? `${cd.change >= 0 ? '+' : ''}${cd.change.toFixed(1)} %` : undefined}
                tone={cd ? (cd.change >= 0 ? 'up' : 'down') : undefined}
              />
              <span className="md-w__detail">{coin.symbol} · {coin.name} · {h.h24}</span>
            </>
          )}
        </Widget>

        {/* ── Birthday ── */}
        <Widget id="birthday" icon="🎂" title={h.birthday} editMode={editMode} onEdit={() => open('birthday')}>
          {bdays == null ? (
            <Empty asLabel={editMode} text={h.birthdayEmpty} label={h.add} onClick={() => open('birthday')} />
          ) : bdays === 0 ? (
            <>
              <Value main="🎉" />
              <span className="md-w__detail">{h.birthdayToday}</span>
            </>
          ) : (
            <>
              <Value main={bdays} suffix={dayWord(bdays, lang)} />
              <span className="md-w__detail">
                {h.untilBirthday} · {new Date(2000, dob!.month - 1, dob!.day).toLocaleDateString(lang, { day: 'numeric', month: 'long' })}
              </span>
            </>
          )}
        </Widget>

        {/* ── Today's challenge ── */}
        <Link href="/daily-boost" className="md-w md-w--link" style={{ '--c': COLORS.challenge } as CSSProperties}>
          <span className="md-w__head">
            <span className="md-w__icon" aria-hidden="true">🔥</span>
            <span className="md-w__title">{h.challenge}</span>
          </span>
          <span className="md-w__body">
            <Value main={`${boostDone}/${DAILY_BOOST_ACTIVITY_COUNT}`} suffix={h.challengeDone} />
            <span className="md-progress" role="progressbar" aria-valuemin={0} aria-valuemax={DAILY_BOOST_ACTIVITY_COUNT} aria-valuenow={boostDone}>
              <span style={{ width: `${(boostDone / DAILY_BOOST_ACTIVITY_COUNT) * 100}%` }} />
            </span>
            {streak > 0 && <span className="md-w__detail">🔥 {formatDays(streak, lang)} · {h.streak}</span>}
          </span>
        </Link>
      </div>

      {editing && (
        <div className="md-editor" style={{ '--c': COLORS[editing] } as CSSProperties}>
          <button type="button" className="md-editor__close" aria-label="✕" onClick={() => setEditing(null)}>✕</button>
          {editing === 'cities' && (
            <CitiesEditor h={h} lang={lang} cities={favCities} onChange={() => setFavCities(loadFavCities())} />
          )}
          {editing === 'weather' && (
            <WeatherEditor
              h={h}
              lang={lang}
              onPick={p => { lsSet(WEATHER_CITY_KEY, p); setSavedPlace(p); setEditing(null); }}
              onGps={p => { lsSet(WEATHER_CITY_KEY, null); setSavedPlace(null); setAutoPlace(p); setEditing(null); }}
            />
          )}
          {editing === 'team' && (
            <TeamEditor
              team={team}
              onPick={next => { saveMyTeam(next); setTeam(next); setEditing(null); }}
              placeholder={h.pick}
            />
          )}
          {editing === 'crypto' && (
            <select
              className="md-input"
              defaultValue={coinId ?? ''}
              onChange={e => {
                const v = e.target.value || null;
                lsSet(COIN_KEY, v); setCoinId(v); setEditing(null);
              }}
            >
              <option value="">{h.pick}</option>
              {COIN_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.symbol} · {c.name}</option>)}
            </select>
          )}
          {editing === 'birthday' && (
            <BirthdayEditor dob={dob} lang={lang} onChange={next => { lsSet(AGE_CALCULATOR_DOB_KEY, next); setDob(next); }} />
          )}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════ editors ═══════════════════════ */

function CitiesEditor({ h, lang, cities, onChange }: { h: HomeStrings['myDay']; lang: Lang; cities: City[]; onChange: () => void }) {
  const [q, setQ] = useState('');
  const names = cities.map(c => c.name);
  const query = q.trim().toLowerCase();
  const hits = query
    ? ALL_CITIES.filter(c => !names.includes(c.name) &&
        (c.name.toLowerCase().includes(query) || localizedCity(c.name, lang).toLowerCase().includes(query))).slice(0, 6)
    : [];

  function save(next: string[]) { lsSet(WORLDTIME_FAVORITES_KEY, next); onChange(); }

  return (
    <div className="md-editor__body">
      <div className="md-chips">
        {cities.map(c => (
          <span key={c.name} className="md-chip">
            {c.flag} {localizedCity(c.name, lang)}
            <button type="button" aria-label="✕" onClick={() => save(names.filter(n => n !== c.name))}>✕</button>
          </span>
        ))}
      </div>
      {cities.length < 3 && (
        <>
          <input className="md-input" value={q} onChange={e => setQ(e.target.value)} placeholder={h.searchCity} autoFocus />
          <div className="md-results">
            {hits.map(c => (
              <button key={c.name} type="button" onClick={() => { save([...names, c.name]); setQ(''); }}>
                {c.flag} {localizedCity(c.name, lang)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type GeoHit = { id: number; name: string; country?: string; admin1?: string; latitude: number; longitude: number };

function WeatherEditor({ h, lang, onPick, onGps }: {
  h: HomeStrings['myDay']; lang: Lang;
  onPick: (p: WeatherPlace) => void; onGps: (p: WeatherPlace) => void;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ q: string; list: GeoHit[] }>({ q: '', list: [] });
  const query = q.trim();

  useEffect(() => {
    if (query.length < 2) return;
    let cancelled = false;
    const id = setTimeout(() => {
      const params = new URLSearchParams({ name: query, count: '6', language: lang, format: 'json' });
      fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) setHits({ q: query, list: (d.results ?? []) as GeoHit[] }); })
        .catch(() => {});
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [query, lang]);

  function useGps() {
    navigator.geolocation?.getCurrentPosition(
      pos => onGps({ name: '', lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' }),
      () => { /* denied — the search stays available */ },
      { timeout: 10_000 },
    );
  }

  const list = hits.q === query ? hits.list : [];

  return (
    <div className="md-editor__body">
      <input className="md-input" value={q} onChange={e => setQ(e.target.value)} placeholder={h.searchCity} autoFocus />
      <div className="md-results">
        {list.map(r => (
          <button key={r.id} type="button" onClick={() => onPick({ name: r.name, lat: r.latitude, lon: r.longitude, source: 'saved' })}>
            {r.name}<small>{[r.admin1, r.country].filter(Boolean).join(', ')}</small>
          </button>
        ))}
      </div>
      <button type="button" className="md-pill" onClick={useGps}>📍 {h.useLocation}</button>
    </div>
  );
}

function TeamEditor({ team, onPick, placeholder }: { team: MyTeam | null; onPick: (t: MyTeam | null) => void; placeholder: string }) {
  const [league, setLeague] = useState<League>(team?.league ?? 'nhl');
  return (
    <div className="md-editor__body md-editor__row">
      <select className="md-input" value={league} onChange={e => setLeague(e.target.value as League)}>
        {(Object.keys(LEAGUE_META) as League[]).map(l => (
          <option key={l} value={l}>{LEAGUE_META[l].emoji} {LEAGUE_META[l].label}</option>
        ))}
      </select>
      <select
        className="md-input"
        value={team?.league === league ? team.abbr : ''}
        onChange={e => onPick(e.target.value ? { league, abbr: e.target.value } : null)}
      >
        <option value="">{placeholder}</option>
        {TEAMS_BY_LEAGUE[league].map((tm: TeamOption) => <option key={tm.abbr} value={tm.abbr}>{tm.name}</option>)}
      </select>
    </div>
  );
}

function BirthdayEditor({ dob, lang, onChange }: {
  dob: { day: number; month: number; year: number } | null; lang: Lang;
  onChange: (d: { day: number; month: number; year: number }) => void;
}) {
  const cur = dob ?? { day: 1, month: 1, year: 2000 };
  const thisYear = new Date().getFullYear();
  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString(lang, { month: 'long' });
  return (
    <div className="md-editor__body md-editor__row">
      <select className="md-input" value={dob?.day ?? ''} onChange={e => onChange({ ...cur, day: Number(e.target.value) })}>
        <option value="" disabled>–</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <select className="md-input" value={dob?.month ?? ''} onChange={e => onChange({ ...cur, month: Number(e.target.value) })}>
        <option value="" disabled>–</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{monthName(m)}</option>)}
      </select>
      <select className="md-input" value={dob?.year ?? ''} onChange={e => onChange({ ...cur, year: Number(e.target.value) })}>
        <option value="" disabled>–</option>
        {Array.from({ length: 110 }, (_, i) => thisYear - i).map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
