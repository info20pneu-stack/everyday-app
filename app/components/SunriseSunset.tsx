'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { fmt2, fmtNumber, fmtUnit } from '../../lib/formatNumber';
import { toolStrings } from '../../lib/toolsI18n';
import { homeStrings } from '../../lib/homeI18n';
import ToolFrame, { plain, ToolButton, ToolCard, ToolCards, ToolHero } from './tools/ToolFrame';
import { localizedCity } from '../../lib/cityNames';

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

/** City name in the UI language; '' when unknown (the caller shows "My location"). */
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

async function fetchSunData(lat: number, lon: number, lang: string): Promise<SunData> {
  const [sunRes, city] = await Promise.all([
    fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat.toFixed(6)}&lng=${lon.toFixed(6)}&formatted=0`
    ),
    fetchCity(lat, lon, lang),
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

/** Clock time in the language's own format (24 h or 12 h). */
function fmt(date: Date, lang: string) {
  return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
}

/** "13 h 5 min" with the language's unit names. */
function fmtDuration(seconds: number, lang: string) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${fmtUnit(h, 'hour', lang)} ${fmtUnit(m, 'minute', lang)}` : fmtUnit(m, 'minute', lang);
}

function fmtCountdown(ms: number, lang: string) {
  if (ms <= 0) return null;
  return fmtDuration(Math.floor(ms / 1000), lang);
}

/** Big "H:MM" for the hero plus its unit. */
function heroCountdown(ms: number, lang: string): { value: string; unit: string } | null {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return { value: fmtNumber(m, lang), unit: unitName('minute', lang) };
  return { value: `${fmtNumber(h, lang)}:${fmt2(m, lang)}`, unit: unitName('hour', lang) };
}

function unitName(unit: string, lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short' })
    .formatToParts(2).filter(p => p.type === 'unit').map(p => p.value).join('').trim();
}

/* ── Compact star positions (deterministic) ── */
const STARS = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 53 + 11) % 270) + 15,
  y: ((i * 37 + 5) % 70) + 8,
  r: i % 3 === 0 ? 1.2 : 0.8,
  o: 0.3 + (i % 4) * 0.15,
}));

type ErrorKind = 'geo' | 'denied' | 'load';

export default function SunriseSunset() {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<SunData | null>(null);
  const [error, setError] = useState<ErrorKind>('load');
  const [now, setNow] = useState(() => new Date());

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
        try {
          const d = await fetchSunData(pos.coords.latitude, pos.coords.longitude, lang);
          setData(d);
          setStatus('ok');
        } catch {
          setStatus('error');
          setError('load');
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

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  /* ── Loading / error ── */
  if (status !== 'ok') {
    return (
      <ToolFrame toolId="slunce">
        <div className="tf-panel" style={{ alignItems: 'center', textAlign: 'center', padding: '2.5rem 1rem' }}>
          {status !== 'error' ? (
            <>
              <div style={{ fontSize: 34 }}>{status === 'locating' ? '📍' : '☀️'}</div>
              <div className="tf-note">{status === 'locating' ? t.sunriseSunset.locating : t.sunriseSunset.loadingData}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 34 }}>⚠️</div>
              <div>{error === 'geo' ? st.geoUnavailable : error === 'denied' ? st.locationDenied : st.sunLoadFailed}</div>
              <ToolButton onClick={load}>{t.sunriseSunset.tryAgain}</ToolButton>
            </>
          )}
        </div>
      </ToolFrame>
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
  const countdownSunset = fmtCountdown(msUntilSunset, lang);
  const countdownSunrise = fmtCountdown(msUntilSunrise, lang);

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

  const heroLabel = isGoldenHour
    ? t.sunriseSunset.goldenHour
    : !isAboveHorizon && nowMs < sunriseMs
      ? t.sunriseSunset.untilSunrise
      : countdownSunset
        ? t.sunriseSunset.untilSunset
        : t.sunriseSunset.sunHasSet;
  const heroMs = isGoldenHour
    ? (nowMs <= goldenMorningEndMs ? goldenMorningEndMs - nowMs : sunsetMs - nowMs)
    : !isAboveHorizon && nowMs < sunriseMs ? msUntilSunrise : msUntilSunset;
  const hero = heroCountdown(heroMs, lang);

  return (
    <ToolFrame toolId="slunce">
      <ToolHero
        label={plain(heroLabel)}
        value={hero ? <span dir="ltr">{hero.value}</span> : '—'}
        unit={hero?.unit}
        sub={<>📍 {city ? localizedCity(city, lang) : homeStrings(lang).myDay.myLocation}</>}
      >
      {/* ── Sky visualization ── */}
      <div dir="ltr" style={{
        borderRadius: '14px',
        overflow: 'hidden',
        background: skyBg,
        marginTop: '14px',
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
            {fmt(sunrise, lang)}
          </text>

          {/* Sunset dot */}
          <circle cx={cx + r} cy={cy} r="4" fill={nowMs < sunsetMs ? '#C080FF' : 'rgba(180,100,255,0.3)'} />
          <text x={cx + r} y={cy + 13} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="8.5">
            {fmt(sunset, lang)}
          </text>

          {/* Solar noon tick */}
          <line x1={cx} y1={cy - r - 5} x2={cx} y2={cy - r + 5} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <text x={cx} y={cy - r - 9} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7.5">
            {fmt(solarNoon, lang)}
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

      </ToolHero>

      <ToolCards>
        <ToolCard icon="🌅" color="#FF8C00" label={plain(t.sunriseSunset.sunrise)} value={fmt(sunrise, lang)} />
        <ToolCard icon="🌇" color="#A78BFA" label={plain(t.sunriseSunset.sunset)} value={fmt(sunset, lang)} />
        <ToolCard icon="☀️" color="#FACC15" label={plain(t.sunriseSunset.dayLength)} value={fmtDuration(dayLength, lang)} />
        <ToolCard icon="⏳" color="#38BDF8"
          label={plain(!isAboveHorizon && nowMs < sunriseMs ? t.sunriseSunset.untilSunrise : countdownSunset ? t.sunriseSunset.untilSunset : t.sunriseSunset.sunHasSet)}
          value={!isAboveHorizon && nowMs < sunriseMs ? countdownSunrise ?? '—' : countdownSunset ?? '—'} />
        <ToolCard wide icon="🌄" color="#F59E0B" label={plain(t.sunriseSunset.goldenHour)}
          value={<span className="ss-golden"><span>{fmt(sunrise, lang)} – {fmt(new Date(goldenMorningEndMs), lang)}</span><span>{fmt(new Date(goldenEveningStartMs), lang)} – {fmt(sunset, lang)}</span></span>}
          sub={isGoldenHour ? t.sunriseSunset.goldenHourNow : undefined} />
      </ToolCards>

      <ToolButton onClick={load}>↺ {st.refresh}</ToolButton>

      <div className="tf-note">{t.sunriseSunset.source}</div>
      <style>{`.ss-golden { display: flex; flex-wrap: wrap; gap: 4px 16px; }`}</style>
    </ToolFrame>
  );
}
