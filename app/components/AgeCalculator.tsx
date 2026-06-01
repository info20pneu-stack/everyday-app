'use client';

import { useState, useEffect } from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Age = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  nextBirthday: number;
  nextBirthdayDate: Date;
  isToday: boolean;
};

function calcAge(birth: Date, now: Date): Age {
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  let hours = now.getHours() - birth.getHours();
  let minutes = now.getMinutes() - birth.getMinutes();
  let seconds = now.getSeconds() - birth.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    months--;
    const prev = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) { months += 12; years--; }

  const totalMs = now.getTime() - birth.getTime();
  const totalDays = Math.floor(totalMs / 86_400_000);
  const totalHours = Math.floor(totalMs / 3_600_000);
  const totalMinutes = Math.floor(totalMs / 60_000);
  const totalSeconds = Math.floor(totalMs / 1_000);

  // Next birthday
  let nextYear = now.getFullYear();
  const thisYearBirthday = new Date(nextYear, birth.getMonth(), birth.getDate());
  if (thisYearBirthday <= now) {
    thisYearBirthday.setFullYear(nextYear + 1);
  }
  const nextBirthday = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / 86_400_000);
  const isToday = nextBirthday === 0 ||
    (now.getMonth() === birth.getMonth() && now.getDate() === birth.getDate());

  return {
    years, months, days, hours, minutes, seconds,
    totalDays, totalHours, totalMinutes, totalSeconds,
    nextBirthday: isToday ? 0 : nextBirthday,
    nextBirthdayDate: thisYearBirthday,
    isToday,
  };
}

const STATS = [
  { key: 'totalDays', label: 'Dní' },
  { key: 'totalHours', label: 'Hodin' },
  { key: 'totalMinutes', label: 'Minut' },
  { key: 'totalSeconds', label: 'Sekund' },
] as const;

const ZODIAC = [
  { sign: 'Kozoroh', emoji: '♑', start: [12, 22], end: [1, 19] },
  { sign: 'Vodnář', emoji: '♒', start: [1, 20], end: [2, 18] },
  { sign: 'Ryby', emoji: '♓', start: [2, 19], end: [3, 20] },
  { sign: 'Beran', emoji: '♈', start: [3, 21], end: [4, 19] },
  { sign: 'Býk', emoji: '♉', start: [4, 20], end: [5, 20] },
  { sign: 'Blíženci', emoji: '♊', start: [5, 21], end: [6, 20] },
  { sign: 'Rak', emoji: '♋', start: [6, 21], end: [7, 22] },
  { sign: 'Lev', emoji: '♌', start: [7, 23], end: [8, 22] },
  { sign: 'Panna', emoji: '♍', start: [8, 23], end: [9, 22] },
  { sign: 'Váhy', emoji: '♎', start: [9, 23], end: [10, 22] },
  { sign: 'Štír', emoji: '♏', start: [10, 23], end: [11, 21] },
  { sign: 'Střelec', emoji: '♐', start: [11, 22], end: [12, 21] },
];

function getZodiac(month: number, day: number) {
  for (const z of ZODIAC) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm === 12) {
      if ((month === 12 && day >= sd) || (month === 1 && day <= ed)) return z;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return z;
    }
  }
  return ZODIAC[0];
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS  = Array.from({ length: 126 }, (_, i) => 2025 - i); // 2025..1900

export default function AgeCalculator() {
  const [birthDay,   setBirthDay]   = useState(1);
  const [birthMonth, setBirthMonth] = useState(1);   // 1 = January
  const [birthYear,  setBirthYear]  = useState(2000);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const birth = new Date(birthYear, birthMonth - 1, birthDay);
  // Guard against day overflow (e.g. Feb 30 rolls to Mar)
  const valid = !isNaN(birth.getTime()) &&
    birth < now &&
    birth.getDate() === birthDay &&
    birth.getMonth() === birthMonth - 1;

  const age    = valid ? calcAge(birth, now) : null;
  const zodiac = valid ? getZodiac(birthMonth, birthDay) : null;

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    padding: '6px 8px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    flex: 1,
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
        🎂 Kalkulačka věku
      </h2>

      {/* Birth date — three selects */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>Datum narození</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Day */}
          <select value={birthDay} onChange={e => setBirthDay(Number(e.target.value))} style={selectStyle}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {/* Month */}
          <select value={birthMonth} onChange={e => setBirthMonth(Number(e.target.value))} style={{ ...selectStyle, flex: 2 }}>
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          {/* Year */}
          <select value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} style={{ ...selectStyle, flex: 1.2 }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {birthDay > 28 && !valid && birth.getDate() !== birthDay && (
          <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '4px' }}>
            ⚠️ {MONTH_NAMES[birthMonth - 1]} nemá {birthDay} dní
          </div>
        )}
      </div>

      {!valid && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '2rem 0' }}>
          Zadej datum narození
        </div>
      )}

      {age && (
        <>
          {/* Main age display */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '1.25rem 1rem',
            marginBottom: '.75rem',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text3)',
              marginBottom: '6px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              Tvůj věk
            </div>
            <div style={{
              fontFamily: 'Poppins',
              fontSize: '48px',
              fontWeight: '600',
              color: '#fff',
              lineHeight: 1,
            }}>
              {age.years}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
              {age.months} měs. · {age.days} dní · {pad(age.hours)}:{pad(age.minutes)}:
              <span style={{ color: 'var(--purple3)' }}>{pad(age.seconds)}</span>
            </div>
          </div>

          {/* Next birthday */}
          <div style={{
            background: age.isToday
              ? 'rgba(93,76,255,0.15)'
              : 'rgba(255,255,255,0.03)',
            border: age.isToday
              ? '1px solid rgba(93,76,255,0.4)'
              : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '.875rem 1rem',
            marginBottom: '.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>
                Další narozeniny
              </div>
              <div style={{ fontSize: '13px', color: '#fff' }}>
                {age.isToday
                  ? '🎉 Dnes máš narozeniny!'
                  : `${age.nextBirthdayDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}`}
              </div>
            </div>
            {!age.isToday && (
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  fontFamily: 'Poppins',
                  color: 'var(--purple3)',
                }}>
                  {age.nextBirthday}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>dní</div>
              </div>
            )}
          </div>

          {/* Zodiac + totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            {zodiac && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '.6rem .75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '22px' }}>{zodiac.emoji}</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>{zodiac.sign}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Zvěrokruh</div>
                </div>
              </div>
            )}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '.6rem .75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '22px' }}>📅</span>
              <div>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>
                  {birth.toLocaleDateString('cs-CZ', { weekday: 'long' })}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Den narození</div>
              </div>
            </div>
          </div>

          {/* Totals grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
            {STATS.map(({ key, label }) => (
              <div key={key} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '.625rem .75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{label}</span>
                <span style={{
                  fontSize: key === 'totalSeconds' ? '11px' : '12px',
                  fontWeight: '500',
                  color: key === 'totalSeconds' ? 'var(--purple3)' : '#fff',
                }}>
                  {age[key].toLocaleString('cs-CZ')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
