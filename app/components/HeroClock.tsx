'use client';

import { useEffect, useState } from 'react';
import { useLang } from '../../lib/LanguageContext';

const TICKS = Array.from({ length: 60 }, (_, i) => i);

/** Thin analog clock showing the visitor's real local time, plus digital time and city. */
export default function HeroClock() {
  const { lang } = useLang();
  // null until mounted — server and client clocks never agree, so render the face only at first
  const [now, setNow] = useState<Date | null>(null);
  const [city, setCity] = useState('');

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    setCity(tz.split('/').pop()?.replace(/_/g, ' ') ?? '');

    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      // re-align to the next full second so the second hand never drifts
      timer = setTimeout(tick, 1000 - d.getMilliseconds());
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const h = now ? now.getHours() % 12 : 0;
  const m = now ? now.getMinutes() : 0;
  const s = now ? now.getSeconds() : 0;
  const hourDeg = h * 30 + m * 0.5;
  const minuteDeg = m * 6 + s * 0.1;
  const secondDeg = s * 6;

  const digital = now
    ? new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)
    : '--:--:--';

  return (
    <div className="hero-clock" aria-label={now ? `${digital}${city ? `, ${city}` : ''}` : undefined}>
      <svg className="hero-clock-face" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="rgba(2,4,14,0.18)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
        {TICKS.map(i => {
          const major = i % 5 === 0;
          return (
            <line
              key={i}
              x1="50" y1={major ? 5 : 4} x2="50" y2={major ? 12 : 7.5}
              stroke={major ? '#fff' : 'rgba(255,255,255,0.45)'}
              strokeWidth={major ? 1.6 : 0.6}
              strokeLinecap="round"
              transform={`rotate(${i * 6} 50 50)`}
            />
          );
        })}
        {now && (
          <>
            <line x1="50" y1="54" x2="50" y2="27" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" transform={`rotate(${hourDeg} 50 50)`} />
            <line x1="50" y1="56" x2="50" y2="15" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${minuteDeg} 50 50)`} />
            <line x1="50" y1="60" x2="50" y2="10" stroke="#FF9500" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${secondDeg} 50 50)`} />
          </>
        )}
        <circle cx="50" cy="50" r="2" fill="#FF9500" />
      </svg>
      <div className="hero-clock-digital tabular-nums">{digital}</div>
      {city && <div className="hero-clock-city">{city}</div>}
    </div>
  );
}
