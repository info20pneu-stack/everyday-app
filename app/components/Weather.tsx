'use client';

import { useState, useEffect } from 'react';

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

function wmo(code: number): [string, string] {
  return WMO[code] ?? ['Unknown', '🌡️'];
}

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

type WeatherData = {
  city: string;
  current: Current;
  forecast: DayForecast[];
};

type Status = 'idle' | 'locating' | 'loading' | 'ok' | 'error';
type DataSource = 'open-meteo' | 'weatherapi';

async function fetchCity(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const j = await r.json();
    return j.address?.city || j.address?.town || j.address?.village || j.address?.county || 'My location';
  } catch {
    return 'My location';
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

async function fetchWeatherFallback(lat: number, lon: number): Promise<WeatherData> {
  const key = process.env.NEXT_PUBLIC_WEATHERAPI_KEY;
  if (!key) throw new Error('WeatherAPI key not configured');
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${lat},${lon}&days=5&aqi=no`;
  const [res, city] = await Promise.all([fetch(url), fetchCity(lat, lon)]);
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
  };
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '5',
    wind_speed_unit: 'kmh',
  });

  const [weatherRes, city] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${params}`),
    fetchCity(lat, lon),
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
  };
}

function uvLabel(uv: number) {
  if (uv <= 2) return { label: 'Low', color: 'var(--green2)' };
  if (uv <= 5) return { label: 'Moderate', color: 'var(--amber)' };
  if (uv <= 7) return { label: 'High', color: '#FF8C00' };
  return { label: 'Extreme', color: '#FF4444' };
}

const statBox: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px',
  padding: '.75rem',
};

export default function Weather() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState('');
  const [source, setSource] = useState<DataSource>('open-meteo');

  function load() {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not available in this browser.');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setStatus('loading');
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const d = await fetchWeather(lat, lon);
          setData(d);
          setSource('open-meteo');
          setStatus('ok');
        } catch {
          // Fallback: WeatherAPI
          try {
            const d2 = await fetchWeatherFallback(lat, lon);
            setData(d2);
            setSource('weatherapi');
            setStatus('ok');
          } catch {
            setStatus('error');
            setError('Failed to load weather data.');
          }
        }
      },
      () => {
        setStatus('error');
        setError('Location access was denied.');
      },
      { timeout: 10_000 }
    );
  }

  useEffect(() => { load(); }, []);

  const card: React.CSSProperties = {
    background: 'rgba(15,20,40,0.92)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 'var(--card-radius)',
    padding: '1.25rem',
    boxShadow: 'var(--card-shadow)',
  };

  /* ── Loading / error states ── */
  if (status === 'idle' || status === 'locating' || status === 'loading') {
    return (
      <div className="card" style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>🌤️ Weather</h2>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
            {status === 'locating' ? '📍 Locating…' : '🌐 Loading…'}
          </span>
        </div>
        <div style={{ height: '110px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', marginBottom: '.75rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '58px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card" style={card}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1.5rem' }}>
          🌤️ Weather
        </h2>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '.75rem' }}>⚠️</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>
          <button
            onClick={load}
            style={{
              background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              padding: '7px 16px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ── Main view ── */
  const { city, current, forecast } = data!;
  const [desc, emoji] = wmo(current.code);
  const uv = uvLabel(current.uv);

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>🌤️ Weather</h2>
        <button
          onClick={load}
          title="Refresh"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'var(--text3)',
            fontSize: '13px',
            padding: '3px 8px',
            cursor: 'pointer',
          }}
        >↺</button>
      </div>

      {/* Current hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(93,76,255,0.18), rgba(59,130,246,0.12))',
        border: '1px solid rgba(93,76,255,0.25)',
        borderRadius: '14px',
        padding: '1.25rem',
        marginBottom: '.75rem',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>
          📍 {city}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
          <div style={{ fontSize: '64px', lineHeight: 1 }}>{emoji}</div>
          <div>
            <div style={{ fontSize: '48px', fontFamily: 'Poppins', fontWeight: '300', color: '#fff', lineHeight: 1 }}>
              {current.temp}°
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>{desc}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Feels like {current.feels}°C</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>💧 Humidity</div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--blue2)' }}>{current.humidity}%</div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>💨 Wind</div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#fff' }}>{current.wind} <span style={{ fontSize: '11px' }}>km/h</span></div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>🔭 Pressure</div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#fff' }}>{current.pressure} <span style={{ fontSize: '11px' }}>hPa</span></div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>☀️ UV index</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: '500', color: uv.color }}>{current.uv}</span>
            <span style={{ fontSize: '10px', color: uv.color }}>{uv.label}</span>
          </div>
        </div>
      </div>

      {/* 5-day forecast */}
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        5-day forecast
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {forecast.map((day, i) => {
          const d = new Date(day.date + 'T12:00:00');
          const [, dayEmoji] = wmo(day.code);
          const isToday = i === 0;
          return (
            <div key={day.date} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isToday ? 'rgba(93,76,255,0.10)' : 'rgba(255,255,255,0.02)',
              border: isToday ? '1px solid rgba(93,76,255,0.2)' : '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px',
              padding: '6px 10px',
            }}>
              <div style={{ width: '26px', fontSize: '11px', color: isToday ? 'var(--purple3)' : 'var(--text2)', fontWeight: isToday ? '600' : '400' }}>
                {isToday ? 'Today' : DAYS_EN[d.getDay()]}
              </div>
              <div style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{dayEmoji}</div>
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--text3)' }}>
                {day.precip > 0 && <span>🌂 {day.precip}%</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: '#fff', fontWeight: '500' }}>{day.max}°</span>
                <span style={{ color: 'var(--text3)' }}>{day.min}°</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
        Source: {source === 'open-meteo' ? 'Open-Meteo' : 'WeatherAPI (backup)'} · Nominatim OSM
      </div>
      <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
