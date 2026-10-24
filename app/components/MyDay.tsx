'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { ALL_CITIES, WORLDTIME_FAVORITES_KEY, type City } from './WorldTime';
import { AGE_CALCULATOR_DOB_KEY, loadStoredDob } from './AgeCalculator';
import { DAILY_BOOST_DONE_PREFIX, DAILY_BOOST_ACTIVITY_COUNT, todayKey } from './DailyBoost';
import { getDisplayState, STREAK_UPDATED_EVENT } from '../../lib/streak';
import {
  TEAMS_BY_LEAGUE, LEAGUE_META, type League, type TeamOption,
  type MyTeam, loadMyTeam, saveMyTeam, type MatchInfo, fetchMyTeamMatches,
} from '../../lib/teams';

/* ═══════════════════════ localStorage keys ═══════════════════════ */

const COIN_KEY  = 'myday_coin_v1';

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

/* ═══════════════════════ helpers ═══════════════════════ */

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function loadFavCities(): City[] {
  const names = lsGet<string[]>(WORLDTIME_FAVORITES_KEY, []);
  return names.map(n => ALL_CITIES.find(c => c.name === n)).filter((c): c is City => !!c).slice(0, 3);
}

function cityTime(tz: string): string {
  return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' });
}

const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️',
  85: '🌨️', 86: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
};

function wmoEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡️';
}

function daysUntilNextBirthday(day: number, month: number): { days: number; isToday: boolean } {
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < todayMid) next = new Date(now.getFullYear() + 1, month - 1, day);
  const days = Math.round((next.getTime() - todayMid.getTime()) / 86400000);
  return { days, isToday: days === 0 };
}

/* ═══════════════════════ styles ═══════════════════════ */

const slotStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '14px',
  padding: '.85rem .9rem',
  minHeight: '96px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const slotHeadStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};

const slotLabelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px',
  textTransform: 'uppercase', color: 'var(--text3)',
};

const gearBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '12px', color: 'var(--text3)', padding: '2px',
  lineHeight: 1, opacity: 0.7,
};

const miniInputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '7px', color: '#fff', fontSize: '12px', padding: '5px 7px', outline: 'none',
};

/* ═══════════════════════ component ═══════════════════════ */

export default function MyDay() {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState<'cities' | 'team' | 'crypto' | 'birthday' | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const [favCities, setFavCities] = useState<City[]>([]);
  const [clock, setClock] = useState(0);
  const [citySearch, setCitySearch] = useState('');

  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'locating' | 'ok' | 'error'>('idle');
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  const [team, setTeam] = useState<MyTeam | null>(null);
  const [teamMatches, setTeamMatches] = useState<{ last: MatchInfo | null; next: MatchInfo | null } | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [draftLeague, setDraftLeague] = useState<League>('nhl');

  const [coinId, setCoinId] = useState<string | null>(null);
  const [coinData, setCoinData] = useState<{ usd: number; usd_24h_change: number } | null>(null);

  const [dob, setDob] = useState<{ day: number; month: number; year: number } | null>(null);
  const [streakState, setStreakState] = useState(() => getDisplayState());
  const [boostDone, setBoostDone] = useState(0);

  /* Load everything from localStorage on mount (client-only) */
  useEffect(() => {
    setMounted(true);
    setFavCities(loadFavCities());
    setTeam(loadMyTeam());
    setCoinId(lsGet<string | null>(COIN_KEY, null));
    setDob(loadStoredDob());
    setBoostDone(lsGet<boolean[]>(`${DAILY_BOOST_DONE_PREFIX}${todayKey()}`, Array(DAILY_BOOST_ACTIVITY_COUNT).fill(false)).filter(Boolean).length);

    const onStreak = () => setStreakState(getDisplayState());
    window.addEventListener(STREAK_UPDATED_EVENT, onStreak);
    window.addEventListener('storage', onStreak);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, onStreak);
      window.removeEventListener('storage', onStreak);
    };
  }, []);

  /* Clock tick for favorite cities */
  useEffect(() => {
    const id = setInterval(() => setClock(c => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* Weather via geolocation */
  const loadWeather = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { setWeatherStatus('error'); return; }
    setWeatherStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const params = new URLSearchParams({
            latitude: latitude.toFixed(4), longitude: longitude.toFixed(4),
            current: 'temperature_2m,weather_code', timezone: 'auto',
          });
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
          const d = await res.json();
          setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
          setWeatherStatus('ok');
        } catch { setWeatherStatus('error'); }
      },
      () => setWeatherStatus('error'),
      { timeout: 10_000 },
    );
  }, []);

  useEffect(() => { if (mounted) loadWeather(); }, [mounted, loadWeather]);

  /* Team matches */
  useEffect(() => {
    if (!team) { setTeamMatches(null); return; }
    setTeamLoading(true);
    fetchMyTeamMatches(team.league, team.abbr)
      .then(setTeamMatches)
      .catch(() => setTeamMatches(null))
      .finally(() => setTeamLoading(false));
  }, [team]);

  /* Coin price */
  useEffect(() => {
    if (!coinId) { setCoinData(null); return; }
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`)
      .then(r => r.json())
      .then(d => setCoinData(d[coinId] ?? null))
      .catch(() => setCoinData(null));
  }, [coinId]);

  if (!mounted) return null;

  /* ── derived ── */
  const favNames = favCities.map(c => c.name);
  const citySuggestions = citySearch
    ? ALL_CITIES.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 6)
    : [];

  function addCity(c: City) {
    if (favNames.includes(c.name) || favNames.length >= 3) return;
    const next = [...favNames, c.name];
    lsSet(WORLDTIME_FAVORITES_KEY, next);
    setFavCities(loadFavCities());
    setCitySearch('');
  }
  function removeCity(name: string) {
    const next = favNames.filter(n => n !== name);
    lsSet(WORLDTIME_FAVORITES_KEY, next);
    setFavCities(loadFavCities());
  }

  function pickTeam(abbr: string) {
    const next = { league: draftLeague, abbr };
    saveMyTeam(next);
    setTeam(next);
    setEditing(null);
  }
  function clearTeam() {
    saveMyTeam(null);
    setTeam(null);
  }

  function pickCoin(id: string) {
    lsSet(COIN_KEY, id);
    setCoinId(id);
    setEditing(null);
  }

  function saveDob(day: number, month: number, year: number) {
    const next = { day, month, year };
    lsSet(AGE_CALCULATOR_DOB_KEY, next);
    setDob(next);
  }

  const hasAnything = favCities.length > 0 || !!team || !!coinId || !!dob;
  const coin = coinId ? COIN_OPTIONS.find(c => c.id === coinId) : null;
  const birthday = dob ? daysUntilNextBirthday(dob.day, dob.month) : null;

  if (!hasAnything && !setupOpen) {
    return (
      <div className="card myday-compact" style={{ animation: 'widgetIn 0.4s ease both' }}>
        <span className="myday-compact-icon" aria-hidden="true">👋</span>
        <span className="myday-compact-text">{t.myDay.setupPrompt}</span>
        <button type="button" className="myday-compact-btn" onClick={() => setSetupOpen(true)}>
          {t.myDay.setupButton}
        </button>
        <MyDayStyles />
      </div>
    );
  }

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
      marginBottom: '1.25rem',
      animation: 'widgetIn 0.4s ease both',
    }}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        {t.myDay.title}
      </h2>

      <div className="myday-grid">
        {/* ── Cities ── */}
        <div style={slotStyle}>
          <div style={slotHeadStyle}>
            <span style={slotLabelStyle}>🌍 {t.myDay.citiesTitle}</span>
            <button className="icon-btn" style={gearBtnStyle} onClick={() => setEditing(editing === 'cities' ? null : 'cities')}>⚙️</button>
          </div>
          {editing === 'cities' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {favCities.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#fff' }}>
                  <span>{c.flag} {c.name}</span>
                  <button onClick={() => removeCity(c.name)} style={gearBtnStyle}>✕</button>
                </div>
              ))}
              {favCities.length < 3 && (
                <div style={{ position: 'relative' }}>
                  <input
                    value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    placeholder="Search city…"
                    style={{ ...miniInputStyle, width: '100%', boxSizing: 'border-box' }}
                  />
                  {citySuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f1428', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 20, marginTop: '4px' }}>
                      {citySuggestions.map(c => (
                        <div key={c.name} onClick={() => addCity(c)} style={{ padding: '6px 9px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
                          {c.flag} {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : favCities.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.citiesEmpty}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {favCities.map(c => (
                <div key={c.name + clock} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#fff' }}>
                  <span>{c.flag} {c.name}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--purple3)' }}>{cityTime(c.tz)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Weather ── */}
        <div style={slotStyle}>
          <div style={slotHeadStyle}>
            <span style={slotLabelStyle}>🌤️ {t.myDay.weatherTitle}</span>
          </div>
          {weatherStatus === 'locating' && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.weatherLocating}</div>}
          {weatherStatus === 'error' && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.weatherDenied}</div>}
          {weatherStatus === 'ok' && weather && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '30px' }}>{wmoEmoji(weather.code)}</span>
              <span style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: '700', color: '#fff' }}>{weather.temp}°C</span>
            </div>
          )}
        </div>

        {/* ── Team ── */}
        <div style={slotStyle}>
          <div style={slotHeadStyle}>
            <span style={slotLabelStyle}>🏆 {t.myDay.teamTitle}</span>
            <button className="icon-btn" style={gearBtnStyle} onClick={() => setEditing(editing === 'team' ? null : 'team')}>⚙️</button>
          </div>
          {editing === 'team' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <select value={draftLeague} onChange={e => setDraftLeague(e.target.value as League)} style={miniInputStyle}>
                {(Object.keys(LEAGUE_META) as League[]).map(l => (
                  <option key={l} value={l}>{LEAGUE_META[l].emoji} {LEAGUE_META[l].label}</option>
                ))}
              </select>
              <select defaultValue="" onChange={e => e.target.value && pickTeam(e.target.value)} style={miniInputStyle}>
                <option value="">{t.myDay.teamSelectTeam}</option>
                {TEAMS_BY_LEAGUE[draftLeague].map((tm: TeamOption) => (
                  <option key={tm.abbr} value={tm.abbr}>{tm.name}</option>
                ))}
              </select>
              {team && <button onClick={clearTeam} style={{ ...gearBtnStyle, alignSelf: 'flex-start' }}>✕ {team.abbr}</button>}
            </div>
          ) : !team ? (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.teamEmpty}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ color: '#fff', fontWeight: '600' }}>{LEAGUE_META[team.league].emoji} {team.abbr}</div>
              {teamLoading ? (
                <div style={{ color: 'var(--text3)' }}>…</div>
              ) : (
                <>
                  {teamMatches?.last && (
                    <div style={{ color: 'var(--text2)' }}>
                      {t.myDay.teamLast}: {teamMatches.last.homeAway} {teamMatches.last.oppName} {teamMatches.last.score ?? ''}
                    </div>
                  )}
                  {teamMatches?.next && (
                    <div style={{ color: 'var(--text2)' }}>
                      {t.myDay.teamNext}: {teamMatches.next.homeAway} {teamMatches.next.oppName} · {teamMatches.next.dateStr}
                    </div>
                  )}
                  {!teamMatches?.last && !teamMatches?.next && (
                    <div style={{ color: 'var(--text3)' }}>{t.myDay.teamNone}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Crypto ── */}
        <div style={slotStyle}>
          <div style={slotHeadStyle}>
            <span style={slotLabelStyle}>₿ {t.myDay.cryptoTitle}</span>
            <button className="icon-btn" style={gearBtnStyle} onClick={() => setEditing(editing === 'crypto' ? null : 'crypto')}>⚙️</button>
          </div>
          {editing === 'crypto' ? (
            <select defaultValue={coinId ?? ''} onChange={e => e.target.value && pickCoin(e.target.value)} style={miniInputStyle}>
              <option value="">{t.myDay.cryptoSelect}</option>
              {COIN_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.symbol} · {c.name}</option>)}
            </select>
          ) : !coin ? (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.cryptoEmpty}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: '#fff' }}>{coin.symbol}</span>
              {coinData ? (
                <>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#fff' }}>${coinData.usd.toLocaleString('en-US')}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: coinData.usd_24h_change >= 0 ? 'var(--green2)' : '#f87171' }}>
                    {coinData.usd_24h_change >= 0 ? '+' : ''}{coinData.usd_24h_change.toFixed(2)}%
                  </span>
                </>
              ) : <span style={{ color: 'var(--text3)', fontSize: '12px' }}>…</span>}
            </div>
          )}
        </div>

        {/* ── Birthday ── */}
        <div style={slotStyle}>
          <div style={slotHeadStyle}>
            <span style={slotLabelStyle}>🎂 {t.myDay.birthdayTitle}</span>
            <button className="icon-btn" style={gearBtnStyle} onClick={() => setEditing(editing === 'birthday' ? null : 'birthday')}>⚙️</button>
          </div>
          {editing === 'birthday' ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <select defaultValue={dob?.day ?? ''} onChange={e => saveDob(Number(e.target.value), dob?.month ?? 1, dob?.year ?? 2000)} style={{ ...miniInputStyle, flex: 1 }}>
                <option value="" disabled>D</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select defaultValue={dob?.month ?? ''} onChange={e => saveDob(dob?.day ?? 1, Number(e.target.value), dob?.year ?? 2000)} style={{ ...miniInputStyle, flex: 1 }}>
                <option value="" disabled>M</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select defaultValue={dob?.year ?? ''} onChange={e => saveDob(dob?.day ?? 1, dob?.month ?? 1, Number(e.target.value))} style={{ ...miniInputStyle, flex: 1.2 }}>
                <option value="" disabled>Y</option>
                {Array.from({ length: 110 }, (_, i) => 2025 - i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          ) : !dob || !birthday ? (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.birthdayEmpty}</div>
          ) : birthday.isToday ? (
            <div style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: '700', color: 'var(--purple3)' }}>{t.myDay.birthdayToday}</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: '700', color: '#fff' }}>{birthday.days}</span>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.birthdayDaysLeft}</span>
            </div>
          )}
        </div>

        {/* ── Challenge & streak ── */}
        <div style={slotStyle}>
          <div style={slotHeadStyle}>
            <span style={slotLabelStyle}>🔥 {t.myDay.challengeTitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: 'Poppins', fontSize: '24px', fontWeight: '700', color: '#fff' }}>{boostDone}/{DAILY_BOOST_ACTIVITY_COUNT}</span>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.myDay.challengeDone}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--purple3)', fontWeight: '600' }}>
            🔥 {streakState.currentStreak} {t.myDay.streakDays}
          </div>
        </div>
      </div>

      <MyDayStyles />
    </div>
  );
}

function MyDayStyles() {
  return (
    <style>{`
      .myday-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 10px;
      }
      @media (max-width: 560px) {
        .myday-grid { grid-template-columns: 1fr 1fr; }
      }
      .myday-compact {
        display: flex;
        align-items: center;
        gap: 12px;
        max-height: 80px;
        box-sizing: border-box;
        padding: 0.75rem 1rem;
        margin-bottom: 1.25rem;
        background: rgba(15,20,40,0.92);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: var(--card-radius);
        box-shadow: var(--card-shadow);
      }
      .myday-compact-icon { font-size: 22px; line-height: 1; flex-shrink: 0; }
      .myday-compact-text {
        flex: 1;
        min-width: 0;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .myday-compact-btn {
        flex-shrink: 0;
        min-height: 36px;
        padding: 0 16px;
        border: none;
        border-radius: 999px;
        background: var(--purple, #7c3aed);
        color: #fff;
        font-family: 'Poppins', sans-serif;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .myday-compact-btn:hover { filter: brightness(1.1); }
    `}</style>
  );
}
