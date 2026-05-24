'use client';

import { useState, useEffect } from 'react';

/* ── WMO weather code → label + emoji ── */
const WMO: Record<number, [string, string]> = {
  0:  ['Jasno', '☀️'],
  1:  ['Převážně jasno', '🌤️'],
  2:  ['Polojasno', '⛅'],
  3:  ['Zataženo', '☁️'],
  45: ['Mlha', '🌫️'],
  48: ['Mrznoucí mlha', '🌫️'],
  51: ['Mrholení', '🌦️'],
  53: ['Mrholení', '🌦️'],
  55: ['Silné mrholení', '🌧️'],
  61: ['Slabý déšť', '🌧️'],
  63: ['Déšť', '🌧️'],
  65: ['Silný déšť', '🌧️'],
  71: ['Slabé sněžení', '🌨️'],
  73: ['Sněžení', '🌨️'],
  75: ['Silné sněžení', '❄️'],
  77: ['Sněhové krupky', '🌨️'],
  80: ['Přeháňky', '🌦️'],
  81: ['Silné přeháňky', '🌧️'],
  82: ['Přívalové srážky', '⛈️'],
  85: ['Sněhové přeháňky', '🌨️'],
  86: ['Silné sněhové přeháňky', '🌨️'],
  95: ['Bouřka', '⛈️'],
  96: ['Bouřka s krupobitím', '⛈️'],
  99: ['Silná bouřka s krupobitím', '⛈️'],
};

function wmo(code: number): [string, string] {
  return WMO[code] ?? ['Neznámo', '🌡️'];
}

const DAYS_CS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

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

async function fetchCity(lat: number, lon: number): Promise<string> {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'cs' } }
    );
    const j = await r.json();
    return j.address?.city || j.address?.town || j.address?.village || j.address?.county || 'Moje poloha';
  } catch {
    return 'Moje poloha';
  }
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
  if (uv <= 2) return { label: 'Nízký', color: 'var(--green2)' };
  if (uv <= 5) return { label: 'Střední', color: 'var(--amber)' };
  if (uv <= 7) return { label: 'Vysoký', color: '#FF8C00' };
  return { label: 'Extrémní', color: '#FF4444' };
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

  function load() {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolokace není v tomto prohlížeči dostupná.');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setStatus('loading');
        try {
          const d = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          setData(d);
          setStatus('ok');
        } catch {
          setStatus('error');
          setError('Nepodařilo se načíst data počasí.');
        }
      },
      () => {
        setStatus('error');
        setError('Přístup k poloze byl zamítnut.');
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
      <div style={card}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1.5rem' }}>
          🌤️ Počasí
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text3)', fontSize: '13px' }}>
          <div style={{ fontSize: '32px', marginBottom: '1rem' }}>
            {status === 'locating' ? '📍' : '🌐'}
          </div>
          {status === 'locating' ? 'Zjišťuji polohu…' : 'Načítám počasí…'}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={card}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1.5rem' }}>
          🌤️ Počasí
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
            Zkusit znovu
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
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>🌤️ Počasí</h2>
        <button
          onClick={load}
          title="Obnovit"
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
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Pocitově {current.feels}°C</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>💧 Vlhkost</div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--blue2)' }}>{current.humidity}%</div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>💨 Vítr</div>
          <div style={{ fontSize: '18px', fontWeight: '500', color: '#fff' }}>{current.wind} <span style={{ fontSize: '11px' }}>km/h</span></div>
        </div>
        <div style={statBox}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>🔭 Tlak</div>
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
        5denní předpověď
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
                {isToday ? 'Dnes' : DAYS_CS[d.getDay()]}
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
        Zdroj: Open-Meteo · Nominatim OSM
      </div>
    </div>
  );
}
