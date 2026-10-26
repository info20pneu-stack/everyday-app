'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmtNumber } from '../../lib/formatNumber';
import { MYDAY_WEATHER_KEY, myDaySet, useMyDayRaw, type MyDayPlace } from '../../lib/myDay';
import ToolFrame, { plain, ToolButton, ToolCard, ToolCards, ToolHero } from './tools/ToolFrame';
import { localizedCity } from '../../lib/cityNames';

/* ── WMO weather code → label + emoji ── */
const WMO: Record<number, [string, string]> = {
  0:  ['Clear', '☀️'],
  1:  ['Mainly clear', '🌤️'],
  2:  ['Partly cloudy', '⛅'],
  3:  ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Freezing fog', '🌫️'],
  51: ['Light drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌧️'],
  63: ['Rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  71: ['Light snow', '🌨️'],
  73: ['Snow', '🌨️'],
  75: ['Heavy snow', '❄️'],
  77: ['Snow grains', '🌨️'],
  80: ['Showers', '🌦️'],
  81: ['Heavy showers', '🌧️'],
  82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'],
  86: ['Heavy snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with hail', '⛈️'],
  99: ['Heavy thunderstorm with hail', '⛈️'],
};

/** [description in the UI language, emoji] for a WMO weather code. */
function wmo(code: number, t: Translations): [string, string] {
  const key = `wmo${code}` as keyof Translations['weather'];
  const label = WMO[code] ? (t.weather[key] as string | undefined) ?? WMO[code][0] : t.weather.wmoUnknown;
  return [label, WMO[code]?.[1] ?? '🌡️'];
}

type Current = {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  pressure: number;
  uv: number;
  code: number;
};

type DayForecast = {
  date: string;
  code: number;
  max: number;
  min: number;
  precip: number;
};

type HourForecast = {
  time: string;
  temp: number;
  code: number;
  precip: number;
};

type WeatherData = {
  city: string;
  current: Current;
  forecast: DayForecast[];
  hourly: HourForecast[];
};

const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

function getOutfitRecs(t: Translations, tempC: number, code: number): string[] {
  const recs: string[] = [];
  if (tempC < 0) recs.push(t.weather.outfit_freezing);
  else if (tempC < 10) recs.push(t.weather.outfit_cold);
  else if (tempC < 16) recs.push(t.weather.outfit_cool);
  else if (tempC < 22) recs.push(t.weather.outfit_mild);
  else if (tempC < 28) recs.push(t.weather.outfit_warm);
  else recs.push(t.weather.outfit_hot);

  if (RAIN_CODES.has(code)) recs.push(t.weather.outfit_umbrella);
  if (SNOW_CODES.has(code)) recs.push(t.weather.outfit_snowBoots);
  return recs;
}

function fmtHour(iso: string, lang: string): string {
  try { return new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--'; }
}

type Status = 'idle' | 'locating' | 'loading' | 'ok' | 'error';
type DataSource = 'open-meteo' | 'weatherapi';

/** City name in the UI language; '' when unknown (shown as "My location"). */
async function fetchCity(lat: number, lon: number, lang: string): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': lang } }
    );
    const j = await r.json();
    return j.address?.city || j.address?.town || j.address?.village || j.address?.county || '';
  } catch {
    return '';
  }
}

/* WeatherAPI condition code → WMO equivalent */
function weatherApiCodeToWmo(code: number): number {
  if (code === 1000) return 0;
  if (code === 1003) return 2;
  if (code <= 1009) return 3;
  if (code === 1030 || code === 1135) return 45;
  if (code === 1147) return 48;
  if (code >= 1150 && code <= 1153) return 53;
  if (code >= 1168 && code <= 1171) return 55;
  if (code === 1063 || code === 1180 || code === 1183) return 61;
  if (code >= 1186 && code <= 1189) return 63;
  if (code >= 1192 && code <= 1201) return 65;
  if (code === 1066 || code === 1210 || code === 1213) return 71;
  if (code >= 1216 && code <= 1219) return 73;
  if (code >= 1222 && code <= 1225) return 75;
  if (code === 1069 || code === 1204 || code === 1207 || code === 1237) return 77;
  if (code === 1240) return 80;
  if (code === 1243) return 81;
  if (code === 1246) return 82;
  if (code >= 1249 && code <= 1264) return 85;
  if (code >= 1273 && code <= 1276) return 95;
  if (code >= 1279 && code <= 1282) return 99;
  return 3;
}

async function fetchWeatherFallback(lat: number, lon: number, lang: string): Promise<WeatherData> {
  const key = process.env.NEXT_PUBLIC_WEATHERAPI_KEY;
  if (!key) throw new Error('WeatherAPI key not configured');
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${lat},${lon}&days=5&aqi=no`;
  const [res, city] = await Promise.all([fetch(url), fetchCity(lat, lon, lang)]);
  if (!res.ok) throw new Error(`WeatherAPI HTTP ${res.status}`);
  const d = await res.json();
  const c = d.current;
  const forecast: DayForecast[] = d.forecast.forecastday.map((day: any) => ({
    date: day.date,
    code: weatherApiCodeToWmo(day.day.condition.code),
    max: Math.round(day.day.maxtemp_c),
    min: Math.round(day.day.mintemp_c),
    precip: day.day.daily_chance_of_rain ?? 0,
  }));
  return {
    city,
    current: {
      temp: Math.round(c.temp_c),
      feels: Math.round(c.feelslike_c),
      humidity: c.humidity,
      wind: Math.round(c.wind_kph),
      pressure: Math.round(c.pressure_mb),
      uv: Math.round(c.uv),
      code: weatherApiCodeToWmo(c.condition.code),
    },
    forecast,
    hourly: [],
  };
}

async function fetchWeather(lat: number, lon: number, lang: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    timezone: 'auto',
    forecast_days: '5',
    wind_speed_unit: 'kmh',
  });

  const [weatherRes, city] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`),
    fetchCity(lat, lon, lang),
  ]);

  if (!weatherRes.ok) throw new Error('API error');
  const d = await weatherRes.json();
  const c = d.current;

  const forecast: DayForecast[] = d.daily.time.map((date: string, i: number) => ({
    date,
    code: d.daily.weather_code[i],
    max: Math.round(d.daily.temperature_2m_max[i]),
    min: Math.round(d.daily.temperature_2m_min[i]),
    precip: d.daily.precipitation_probability_max[i] ?? 0,
  }));

  const hourlyTimes: string[] = d.hourly?.time ?? [];
  const nowMs = Date.now();
  let startIdx = hourlyTimes.findIndex(hTime => new Date(hTime).getTime() >= nowMs);
  if (startIdx === -1) startIdx = 0;
  const hourly: HourForecast[] = hourlyTimes.slice(startIdx, startIdx + 24).map((time, i) => ({
    time,
    temp: Math.round(d.hourly.temperature_2m[startIdx + i]),
    code: d.hourly.weather_code[startIdx + i],
    precip: d.hourly.precipitation_probability[startIdx + i] ?? 0,
  }));

  return {
    city,
    current: {
      temp: Math.round(c.temperature_2m),
      feels: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      wind: Math.round(c.wind_speed_10m),
      pressure: Math.round(c.surface_pressure),
      uv: Math.round(c.uv_index),
      code: c.weather_code,
    },
    forecast,
    hourly,
  };
}

function uvLabel(uv: number, t: Translations) {
  if (uv <= 2) return { label: t.weather.uvLow, color: '#4ADE80' };
  if (uv <= 5) return { label: t.weather.uvModerate, color: '#FFB300' };
  if (uv <= 7) return { label: t.weather.uvHigh, color: '#FF8C00' };
  return { label: t.weather.uvExtreme, color: '#FF4444' };
}


export default function Weather() {
  const { t, lang } = useLang();
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<'geo' | 'denied' | 'load'>('load');
  const [source, setSource] = useState<DataSource>('open-meteo');
  const savedRaw = useMyDayRaw(MYDAY_WEATHER_KEY);

  function load() {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('geo');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setStatus('loading');
        const { latitude: lat, longitude: lon } = pos.coords;
        setCoords({ lat, lon });
        try {
          const d = await fetchWeather(lat, lon, lang);
          setData(d);
          setSource('open-meteo');
          setStatus('ok');
        } catch {
          // Fallback: WeatherAPI
          try {
            const d2 = await fetchWeatherFallback(lat, lon, lang);
            setData(d2);
            setSource('weatherapi');
            setStatus('ok');
          } catch {
            setStatus('error');
            setError('load');
          }
        }
      },
      () => {
        setStatus('error');
        setError('denied');
      },
      { timeout: 10_000 }
    );
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on open; the refresh button reloads
  useEffect(() => { load(); }, []);

  /* ── Loading / error states ── */
  if (status === 'idle' || status === 'locating' || status === 'loading') {
    return (
      <ToolFrame toolId="pocasi">
        <div className="tf-note">{status === 'locating' ? t.weather.locating : t.weather.loading}</div>
        <div className="wx-skel" style={{ height: 200 }} />
        <div className="tf-cards">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="wx-skel" style={{ height: 66 }} />)}</div>
        <style>{`.wx-skel { border-radius: 18px; background: rgba(255,255,255,0.04); animation: shimmer 1.5s infinite; } @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      </ToolFrame>
    );
  }

  if (status === 'error') {
    return (
      <ToolFrame toolId="pocasi">
        <div className="tf-panel" style={{ alignItems: 'center', textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ fontSize: 34 }}>⚠️</div>
          <div>{error === 'geo' ? t.weather.geoUnavailable : error === 'denied' ? t.weather.locationDenied : t.weather.loadError}</div>
          <ToolButton onClick={load}>{t.weather.retry}</ToolButton>
        </div>
      </ToolFrame>
    );
  }

  /* ── Main view ── */
  const { city, current, forecast, hourly } = data!;
  const [desc, emoji] = wmo(current.code, t);
  const uv = uvLabel(current.uv, t);
  const outfitRecs = getOutfitRecs(t, current.temp, current.code);
  const place: MyDayPlace | null = coords ? { name: city ? localizedCity(city, lang) : t.weather.myLocation, lat: coords.lat, lon: coords.lon, source: 'saved' } : null;
  const savedPlace = (() => { try { return savedRaw ? JSON.parse(savedRaw) as MyDayPlace : null; } catch { return null; } })();
  const saved = !!(place && savedPlace && Math.abs(savedPlace.lat - place.lat) < 0.01 && Math.abs(savedPlace.lon - place.lon) < 0.01);
  const num = (n: number) => fmtNumber(n, lang);

  return (
    <ToolFrame toolId="pocasi" myDay={place ? { saved, onSave: () => myDaySet(MYDAY_WEATHER_KEY, place) } : undefined}>
      <ToolHero
        label={<>📍 {city ? localizedCity(city, lang) : t.weather.myLocation}</>}
        value={<span dir="ltr">{num(current.temp)}</span>}
        unit="°C"
        sub={<><span className="wx-emoji">{emoji}</span> {desc} · {t.weather.feelsLike} {num(current.feels)} °C</>}
      />

      <ToolCards>
        <ToolCard wide icon="👕" color="#A78BFA" label={t.weather.outfitTitle}
          value={<span className="wx-outfit">{outfitRecs.map(r => <span key={r}>{r}</span>)}</span>} />
        <ToolCard icon="💧" color="#38BDF8" label={plain(t.weather.humidity)} value={`${num(current.humidity)} %`} />
        <ToolCard icon="💨" color="#94A3B8" label={plain(t.weather.wind)} value={<span dir="ltr">{num(current.wind)} km/h</span>} />
        <ToolCard icon="🔭" color="#818CF8" label={plain(t.weather.pressure)} value={<span dir="ltr">{num(current.pressure)} hPa</span>} />
        <ToolCard icon="☀️" color={uv.color} label={plain(t.weather.uvIndex)} value={num(current.uv)} sub={uv.label} />
      </ToolCards>

      {hourly.length > 0 && (
        <div className="tf-panel">
          <div className="tf-label">🕐 {t.weather.hourlyForecast}</div>
          <div className="wx-hours">
            {hourly.map(h => {
              const [, hEmoji] = wmo(h.code, t);
              return (
                <div key={h.time} className="wx-hour">
                  <span className="wx-h-time">{fmtHour(h.time, lang)}</span>
                  <span className="wx-h-emoji">{hEmoji}</span>
                  <b>{num(h.temp)}°</b>
                  {h.precip > 0 && <span className="wx-h-rain">{num(h.precip)} %</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="tf-panel">
        <div className="tf-label">📅 {t.weather.forecast5day}</div>
        {forecast.map((day, i) => {
          const d = new Date(day.date + 'T12:00:00');
          const [dayDesc, dayEmoji] = wmo(day.code, t);
          return (
            <div key={day.date} className={`wx-day${i === 0 ? ' is-today' : ''}`}>
              <span className="wx-d-name">{i === 0 ? t.weather.today : d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'numeric' })}</span>
              <span className="wx-d-emoji" title={dayDesc}>{dayEmoji}</span>
              <span className="wx-d-rain">{day.precip > 0 && <>🌂 {num(day.precip)} %</>}</span>
              <span className="wx-d-temp"><b>{num(day.max)}°</b> <span>{num(day.min)}°</span></span>
            </div>
          );
        })}
      </div>

      <ToolButton onClick={load}>↺ {t.weather.refresh}</ToolButton>

      <div className="tf-note">
        {t.weather.source} {source === 'open-meteo' ? 'Open-Meteo' : `WeatherAPI ${t.weather.backup}`} · Nominatim OSM
      </div>

      <style>{`
        .wx-emoji { font-size: 18px; }
        .wx-outfit { display: flex; flex-direction: column; gap: 2px; font-size: 14px; font-weight: 600; }
        .wx-hours { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
        .wx-hour {
          flex-shrink: 0; min-width: 56px; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 6px;
          border-radius: 14px; background: linear-gradient(160deg, #1C2258, #121640); border: 1px solid rgba(255,255,255,.07);
        }
        .wx-h-time { font-size: 11px; color: var(--tf-dim); }
        .wx-h-emoji { font-size: 18px; }
        .wx-hour b { font-size: 14px; }
        .wx-h-rain { font-size: 11px; color: #7DD3FC; }
        .wx-day { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; background: rgba(10,14,42,.5); }
        .wx-day.is-today { background: color-mix(in srgb, var(--tc) 16%, rgba(10,14,42,.6)); border: 1px solid color-mix(in srgb, var(--tc) 40%, transparent); }
        .wx-d-name { width: 92px; font-size: 13px; font-weight: 600; text-transform: capitalize; }
        .wx-d-emoji { font-size: 20px; }
        .wx-d-rain { flex: 1; font-size: 12px; color: #7DD3FC; }
        .wx-d-temp { font-size: 14px; white-space: nowrap; }
        .wx-d-temp span { color: var(--tf-dim); margin-inline-start: 6px; }
      `}</style>
    </ToolFrame>
  );
}
