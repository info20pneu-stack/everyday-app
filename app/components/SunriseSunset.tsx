'use client';

import { useState, useEffect } from 'react';

type SunData = {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  civilTwilightBegin: Date;
  civilTwilightEnd: Date;
  dayLength: number;
  city: string;
};

type Status = 'idle' | 'locating' | 'loading' | 'ok' | 'error';

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

async function fetchSunData(lat: number, lon: number): Promise<SunData> {
  const [sunRes, city] = await Promise.all([
    fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat.toFixed(6)}&lng=${lon.toFixed(6)}&formatted=0`
    ),
    fetchCity(lat, lon),
  ]);
  if (!sunRes.ok) throw new Error('API error');
  const d = await sunRes.json();
  if (d.status !== 'OK') throw new Error('API error');
  const r = d.results;
  return {
    sunrise: new Date(r.sunrise),
    sunset: new Date(r.sunset),
    solarNoon: new Date(r.solar_noon),
    civilTwilightBegin: new Date(r.civil_twilight_begin),
    civilTwilightEnd: new Date(r.civil_twilight_end),
    dayLength: r.day_length,
    city,
  };
}

function fmt(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}min`;
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

/* ── Compact star positions (deterministic) ── */
const STARS = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 53 + 11) % 270) + 15,
  y: ((i * 37 + 5) % 70) + 8,
  r: i % 3 === 0 ? 1.2 : 0.8,
  o: 0.3 + (i % 4) * 0.15,
}));

const card: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  padding: '1.25rem',
  boxShadow: 'var(--card-shadow)',
};

const statBox = (accent?: string): React.CSSProperties => ({
  background: accent ? `rgba(${accent},0.08)` : 'rgba(255,255,255,0.03)',
  border: `1px solid ${accent ? `rgba(${accent},0.22)` : 'rgba(255,255,255,0.06)'}`,
  borderRadius: '12px',
  padding: '.75rem',
});

export default function SunriseSunset() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<SunData | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

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
        try {
          const d = await fetchSunData(pos.coords.latitude, pos.coords.longitude);
          setData(d);
          setStatus('ok');
        } catch {
          setStatus('error');
          setError('Failed to load sun data.');
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

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── Loading / error ── */
  if (status !== 'ok') {
    return (
      <div className="card" style={card}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1.5rem' }}>
          🌅 Sun
        </h2>
        {status !== 'error' ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text3)', fontSize: '13px' }}>
            <div style={{ fontSize: '32px', marginBottom: '1rem' }}>
              {status === 'locating' ? '📍' : '☀️'}
            </div>
            {status === 'locating' ? 'Locating…' : 'Loading data…'}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '.75rem' }}>⚠️</div>
            <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>{error}</div>
            <button onClick={load} style={{
              background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontSize: '12px',
              padding: '7px 16px', cursor: 'pointer',
            }}>Try again</button>
          </div>
        )}
      </div>
    );
  }

  /* ── Computed values ── */
  const { sunrise, sunset, solarNoon, dayLength, city } = data!;
  const nowMs = now.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();

  const isAboveHorizon = nowMs >= sunriseMs && nowMs <= sunsetMs;
  const progress = Math.max(0, Math.min(1, (nowMs - sunriseMs) / (sunsetMs - sunriseMs)));

  const goldenMorningEndMs = sunriseMs + 60 * 60 * 1000;
  const goldenEveningStartMs = sunsetMs - 60 * 60 * 1000;
  const isGoldenHour = isAboveHorizon && (nowMs <= goldenMorningEndMs || nowMs >= goldenEveningStartMs);

  const msUntilSunset = sunsetMs - nowMs;
  const msUntilSunrise = sunriseMs - nowMs;
  const countdownSunset = fmtCountdown(msUntilSunset);
  const countdownSunrise = fmtCountdown(msUntilSunrise);

  /* ── SVG arc geometry ── */
  const W = 300;
  const H = 150;
  const cx = W / 2;
  const cy = H - 22;
  const r = 105;

  // angle: π at sunrise (left), 0 at sunset (right)
  const angle = Math.PI * (1 - progress);
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);

  // golden hour boundary points
  const ghMorningT = Math.min(1, (goldenMorningEndMs - sunriseMs) / (sunsetMs - sunriseMs));
  const ghEveningT = Math.max(0, (goldenEveningStartMs - sunriseMs) / (sunsetMs - sunriseMs));
  const ghMorningAngle = Math.PI * (1 - ghMorningT);
  const ghEveningAngle = Math.PI * (1 - ghEveningT);

  const gmX = cx + r * Math.cos(ghMorningAngle);
  const gmY = cy - r * Math.sin(ghMorningAngle);
  const geX = cx + r * Math.cos(ghEveningAngle);
  const geY = cy - r * Math.sin(ghEveningAngle);

  // night sky or day sky
  const skyBg = !isAboveHorizon
    ? 'linear-gradient(180deg,#010614 0%,#020A1E 70%,#0A1428 100%)'
    : isGoldenHour
      ? 'linear-gradient(180deg,#0D0818 0%,#2A1008 50%,#5C2400 100%)'
      : 'linear-gradient(180deg,#030C22 0%,#071840 55%,#0F2A5E 100%)';

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>🌅 Sun</h2>
        <button onClick={load} title="Refresh" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px', color: 'var(--text3)',
          fontSize: '13px', padding: '3px 8px', cursor: 'pointer',
        }}>↺</button>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '.85rem' }}>📍 {city}</div>

      {/* ── Sky visualization ── */}
      <div style={{
        borderRadius: '14px',
        overflow: 'hidden',
        background: skyBg,
        marginBottom: '1rem',
        position: 'relative',
        transition: 'background 1s ease',
      }}>
        {/* Horizon glow */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '30%',
          background: isGoldenHour
            ? 'linear-gradient(0deg, rgba(120,50,0,0.6) 0%, transparent 100%)'
            : 'linear-gradient(0deg, rgba(10,30,80,0.5) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          <defs>
            <radialGradient id="ss-sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isGoldenHour ? '#FF9500' : '#FFE066'} stopOpacity="1" />
              <stop offset="35%" stopColor={isGoldenHour ? '#FF6A00' : '#FFB800'} stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FF4400" stopOpacity="0" />
            </radialGradient>
            <filter id="ss-blur">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>

          {/* Stars — visible at night */}
          {!isAboveHorizon && STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
          ))}

          {/* Dashed guide arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />

          {/* Golden hour arcs */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${gmX} ${gmY}`}
            fill="none"
            stroke="rgba(255,140,0,0.55)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M ${geX} ${geY} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255,140,0,0.55)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Progress arc — portion of day elapsed */}
          {isAboveHorizon && progress > 0.01 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${progress > 0.5 ? 1 : 0} 1 ${sunX} ${sunY}`}
              fill="none"
              stroke="rgba(255,200,50,0.3)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Horizon line */}
          <line x1="8" y1={cy} x2={W - 8} y2={cy} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

          {/* Sunrise dot */}
          <circle cx={cx - r} cy={cy} r="4" fill={isAboveHorizon || nowMs < sunriseMs ? '#FF8C00' : 'rgba(255,140,0,0.3)'} />
          <text x={cx - r} y={cy + 13} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="8.5">
            {fmt(sunrise)}
          </text>

          {/* Sunset dot */}
          <circle cx={cx + r} cy={cy} r="4" fill={nowMs < sunsetMs ? '#C080FF' : 'rgba(180,100,255,0.3)'} />
          <text x={cx + r} y={cy + 13} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="8.5">
            {fmt(sunset)}
          </text>

          {/* Solar noon tick */}
          <line x1={cx} y1={cy - r - 5} x2={cx} y2={cy - r + 5} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <text x={cx} y={cy - r - 9} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7.5">
            {fmt(solarNoon)}
          </text>

          {/* Sun glow halo */}
          {isAboveHorizon && (
            <circle cx={sunX} cy={sunY} r="22" fill="url(#ss-sun-glow)" filter="url(#ss-blur)" />
          )}

          {/* Sun body */}
          {isAboveHorizon && (
            <>
              <circle cx={sunX} cy={sunY} r="9" fill={isGoldenHour ? '#FF9A00' : '#FFD700'} stroke={isGoldenHour ? '#FF6A00' : '#FFA800'} strokeWidth="1.5">
                <animate attributeName="r" values="8.5;10;8.5" dur="4s" repeatCount="indefinite" />
              </circle>
              {/* Sun rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                const rad = (deg * Math.PI) / 180;
                const x1 = sunX + 12 * Math.cos(rad);
                const y1 = sunY + 12 * Math.sin(rad);
                const x2 = sunX + 17 * Math.cos(rad);
                const y2 = sunY + 17 * Math.sin(rad);
                return (
                  <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isGoldenHour ? '#FF8C00' : '#FFD700'}
                    strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                );
              })}
            </>
          )}

          {/* Moon when night */}
          {!isAboveHorizon && (
            <text x={cx} y={cy - 55} textAnchor="middle" fontSize="28">🌙</text>
          )}
        </svg>
      </div>

      {/* ── Info grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.5rem' }}>
        {/* Sunrise */}
        <div style={statBox('255,140,0')}>
          <div style={{ fontSize: '10px', color: 'rgba(255,140,0,0.75)', marginBottom: '3px' }}>🌅 Sunrise</div>
          <div style={{ fontSize: '19px', fontWeight: '600', color: '#FFB300', fontFamily: 'Poppins' }}>
            {fmt(sunrise)}
          </div>
        </div>

        {/* Sunset */}
        <div style={statBox('160,100,255')}>
          <div style={{ fontSize: '10px', color: 'rgba(160,100,255,0.8)', marginBottom: '3px' }}>🌇 Sunset</div>
          <div style={{ fontSize: '19px', fontWeight: '600', color: 'var(--purple3)', fontFamily: 'Poppins' }}>
            {fmt(sunset)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.5rem' }}>
        {/* Day length */}
        <div style={statBox()}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px' }}>⏱ Day length</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>{fmtDuration(dayLength)}</div>
        </div>

        {/* Countdown / golden hour */}
        <div style={statBox(isGoldenHour ? '255,160,0' : undefined)}>
          <div style={{ fontSize: '10px', color: isGoldenHour ? 'rgba(255,160,0,0.8)' : 'var(--text3)', marginBottom: '3px' }}>
            {isGoldenHour
              ? '✨ Golden hour'
              : !isAboveHorizon && nowMs < sunriseMs
                ? '🌅 Until sunrise'
                : countdownSunset
                  ? '⏳ Until sunset'
                  : '🌙 Sun has set'}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: isGoldenHour ? '#FFB300' : '#fff' }}>
            {isGoldenHour
              ? (nowMs <= goldenMorningEndMs
                  ? fmtCountdown(goldenMorningEndMs - nowMs)
                  : fmtCountdown(sunsetMs - nowMs))
              : !isAboveHorizon && nowMs < sunriseMs
                ? countdownSunrise ?? '—'
                : countdownSunset ?? '—'}
          </div>
        </div>
      </div>

      {/* Golden hour info row */}
      <div style={statBox()}>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '4px' }}>✨ Golden hour</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#FFB300' }}>
          <span>🌄 {fmt(sunrise)} – {fmt(new Date(goldenMorningEndMs))}</span>
          <span>🌆 {fmt(new Date(goldenEveningStartMs))} – {fmt(sunset)}</span>
        </div>
      </div>

      {/* Golden hour active banner */}
      {isGoldenHour && (
        <div style={{
          marginTop: '.5rem',
          background: 'linear-gradient(135deg, rgba(255,140,0,0.14), rgba(255,69,0,0.08))',
          border: '1px solid rgba(255,140,0,0.3)',
          borderRadius: '10px',
          padding: '.55rem 1rem',
          fontSize: '11px',
          color: '#FFB300',
          textAlign: 'center',
        }}>
          ✨ Golden hour is now! Perfect time for photography.
        </div>
      )}

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
        Sunrise-Sunset API · Nominatim OSM
      </div>
    </div>
  );
}
