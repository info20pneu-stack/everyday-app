'use client';

import { useState, useEffect } from 'react';

type Diff = {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  past: boolean;
};

function calcDiff(from: Date, to: Date): Diff {
  const past = to < from;
  const [start, end] = past ? [to, from] : [from, to];

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { months += 12; years--; }

  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.floor(totalMs / 86400000);
  const weeks = Math.floor(totalDays / 7);

  return { years, months, weeks, days, hours, minutes, seconds, totalDays, past };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

const STAT_LABELS = [
  { key: 'years', label: 'Roky' },
  { key: 'months', label: 'Měsíce' },
  { key: 'weeks', label: 'Týdny' },
  { key: 'days', label: 'Dny' },
  { key: 'hours', label: 'Hodiny' },
  { key: 'minutes', label: 'Minuty' },
  { key: 'seconds', label: 'Sekundy' },
] as const;

function toLocalInput(d: Date) {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function DateCounter() {
  const now = new Date();
  const [fromVal, setFromVal] = useState(toLocalInput(now));
  const [toVal, setToVal] = useState(() => {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() + 1);
    return toLocalInput(d);
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const from = new Date(fromVal);
  const to = new Date(toVal);
  const valid = !isNaN(from.getTime()) && !isNaN(to.getTime());
  const diff = valid ? calcDiff(from, to) : null;

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    padding: '6px 10px',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
    colorScheme: 'dark',
  };

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
    }}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        ⏳ Datum a čas — rozdíl
      </h2>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Od</div>
          <input
            type="datetime-local"
            value={fromVal}
            onChange={e => setFromVal(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>Do</div>
          <input
            type="datetime-local"
            value={toVal}
            onChange={e => setToVal(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Direction badge */}
      {diff && (
        <div style={{
          textAlign: 'center',
          marginBottom: '.75rem',
          fontSize: '12px',
          color: diff.past ? 'var(--amber)' : 'var(--green2)',
        }}>
          {diff.past ? '⬅ v minulosti' : '➡ v budoucnosti'}
        </div>
      )}

      {/* Big clock */}
      {diff && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          padding: '1.25rem 1rem',
          marginBottom: '.75rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'Poppins, monospace',
            fontSize: '32px',
            fontWeight: '300',
            color: '#fff',
            letterSpacing: '2px',
          }}>
            {pad(diff.hours)}
            <span style={{ color: 'var(--text3)', margin: '0 2px' }}>:</span>
            {pad(diff.minutes)}
            <span style={{ color: 'var(--text3)', margin: '0 2px' }}>:</span>
            <span style={{ color: 'var(--purple3)' }}>{pad(diff.seconds)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
            + {diff.years > 0 ? `${diff.years} r. ` : ''}{diff.months > 0 ? `${diff.months} m. ` : ''}{diff.days > 0 ? `${diff.days} d.` : ''}
          </div>
        </div>
      )}

      {/* Stats grid */}
      {diff && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '.5rem',
        }}>
          {STAT_LABELS.map(({ key, label }) => {
            const val = key === 'weeks' ? diff.weeks : key === 'days' ? diff.days : diff[key];
            const isSeconds = key === 'seconds';
            return (
              <div key={key} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '.6rem .4rem',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  fontFamily: 'Poppins',
                  color: isSeconds ? 'var(--purple3)' : '#fff',
                }}>
                  {val}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>{label}</div>
              </div>
            );
          })}

          {/* Total days — span 3 */}
          <div style={{
            background: 'rgba(93,76,255,0.12)',
            border: '1px solid rgba(93,76,255,0.25)',
            borderRadius: '10px',
            padding: '.6rem .4rem',
            textAlign: 'center',
            gridColumn: 'span 3',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '500', fontFamily: 'Poppins', color: 'var(--purple3)' }}>
              {diff.totalDays.toLocaleString('cs-CZ')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>celkem dní</div>
          </div>
        </div>
      )}

      {!valid && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '2rem 0' }}>
          Zadej obě data
        </div>
      )}

      {/* Now shortcut */}
      <button
        onClick={() => setFromVal(toLocalInput(new Date()))}
        style={{
          marginTop: '.75rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: 'var(--text2)',
          fontSize: '11px',
          padding: '5px 12px',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Nastav Od = nyní
      </button>
    </div>
  );
}
