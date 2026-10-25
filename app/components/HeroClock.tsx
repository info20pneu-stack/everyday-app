'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { localizedZoneCity } from '../../lib/cityNames';

const TICKS = Array.from({ length: 60 }, (_, i) => i);

/** City part of the visitor's IANA time zone in their language, e.g. "Europe/Prague" → "Praha" (cs). */
function localCity(lang: Parameters<typeof localizedZoneCity>[1]): string {
  return localizedZoneCity(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '', lang);
}

/** Short zone name for this date (CET/CEST switch automatically). en-US knows US zones, en-GB European ones. */
function zoneAbbr(d: Date): string {
  let fallback = '';
  for (const locale of ['en-US', 'en-GB']) {
    const name = new Intl.DateTimeFormat(locale, { timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value ?? '';
    if (name && !/^(GMT|UTC)[+-−]/.test(name)) return name;
    fallback ||= name;
  }
  return fallback;
}

/** Visitor's local time: glass analog clock (top right) and digital time, zone, city and date (bottom left).
 *  `below` is rendered under the digital time in the same bottom-anchored block, so the two never overlap. */
export default function HeroClock({ below }: { below?: ReactNode }) {
  const { lang } = useLang();
  // null until mounted — server and client clocks never agree, so render the face only at first
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
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
  const city = now ? localCity(lang) : '';
  const zone = now ? zoneAbbr(now) : '';
  const date = now
    ? new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
    : '';

  return (
    <>
      <div className="hero-clock" aria-hidden="true">
        <svg className="hero-clock-face" viewBox="0 0 100 100">
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
      </div>
      <div className="hero-bottom">
        <div className="hero-time">
          <div className="hero-time-row">
            <span className="hero-time-digital tabular-nums">{digital}</span>
            {zone && <span className="hero-time-zone">{zone}</span>}
          </div>
          {city && (
            <div className="hero-time-city">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#8B7CFF" aria-hidden="true">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
              </svg>
              {city}
            </div>
          )}
          {date && <div className="hero-time-date">— {date}</div>}
        </div>
        {below}
      </div>
    </>
  );
}
