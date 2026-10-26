'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmt2, fmtCompact, fmtNumber, fmtUnit } from '../../lib/formatNumber';
import { useIsClient } from '../../lib/games/useIsClient';
import { myDaySet, useMyDayRaw } from '../../lib/myDay';
import { toolStrings } from '../../lib/toolsI18n';
import { formatDays } from '../../lib/homeI18n';
import ToolFrame, { ToolButton, ToolCard, ToolCards, ToolField, ToolHero, ToolTiles, useShare } from './tools/ToolFrame';

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

function getStats(t: Translations) {
  return [
    { key: 'totalDays', label: t.ageCalculator.statDays },
    { key: 'totalHours', label: t.ageCalculator.statHours },
    { key: 'totalMinutes', label: t.ageCalculator.statMinutes },
    { key: 'totalSeconds', label: t.ageCalculator.statSeconds },
  ] as const;
}

const ZODIAC = [
  { sign: 'Capricorn', emoji: '♑', start: [12, 22], end: [1, 19] },
  { sign: 'Aquarius', emoji: '♒', start: [1, 20], end: [2, 18] },
  { sign: 'Pisces', emoji: '♓', start: [2, 19], end: [3, 20] },
  { sign: 'Aries', emoji: '♈', start: [3, 21], end: [4, 19] },
  { sign: 'Taurus', emoji: '♉', start: [4, 20], end: [5, 20] },
  { sign: 'Gemini', emoji: '♊', start: [5, 21], end: [6, 20] },
  { sign: 'Cancer', emoji: '♋', start: [6, 21], end: [7, 22] },
  { sign: 'Leo', emoji: '♌', start: [7, 23], end: [8, 22] },
  { sign: 'Virgo', emoji: '♍', start: [8, 23], end: [9, 22] },
  { sign: 'Libra', emoji: '♎', start: [9, 23], end: [10, 22] },
  { sign: 'Scorpio', emoji: '♏', start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius', emoji: '♐', start: [11, 22], end: [12, 21] },
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

function capitalize(s: string, lang: string): string {
  return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
}

function getMonthNames(t: Translations): string[] {
  return [
    t.ageCalculator.months_jan, t.ageCalculator.months_feb, t.ageCalculator.months_mar, t.ageCalculator.months_apr,
    t.ageCalculator.months_may, t.ageCalculator.months_jun, t.ageCalculator.months_jul, t.ageCalculator.months_aug,
    t.ageCalculator.months_sep, t.ageCalculator.months_oct, t.ageCalculator.months_nov, t.ageCalculator.months_dec,
  ];
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
/** Current year down to 1900. */
function yearOptions(now: Date): number[] {
  return Array.from({ length: now.getFullYear() - 1899 }, (_, i) => now.getFullYear() - i);
}

/** "49" + "let" / "years" / "سنة": the number and the language's unit word, split for the big display. */
function splitUnit(n: number, unit: 'year', lang: string): { num: string; word: string } {
  const parts = new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'long' }).formatToParts(n);
  return {
    num: parts.filter(p => p.type === 'integer' || p.type === 'group').map(p => p.value).join(''),
    word: parts.filter(p => p.type === 'unit').map(p => p.value).join('').trim(),
  };
}

export const AGE_CALCULATOR_DOB_KEY = 'age_calculator_dob_v1';

type StoredDob = { day: number; month: number; year: number };

export function loadStoredDob(): StoredDob | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AGE_CALCULATOR_DOB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function AgeCalculator() {
  // The saved birth date lives in localStorage, so the calculator renders in the browser only
  const isClient = useIsClient();
  return isClient
    ? <AgeCalculatorBody />
    : <ToolFrame toolId="vek"><div style={{ minHeight: 640 }} /></ToolFrame>;
}

function AgeCalculatorBody() {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
  const savedRaw = useMyDayRaw(AGE_CALCULATOR_DOB_KEY);
  const [initial] = useState(loadStoredDob);
  const [birthDay,   setBirthDay]   = useState(initial?.day ?? 1);
  const [birthMonth, setBirthMonth] = useState(initial?.month ?? 1);   // 1 = January
  const [birthYear,  setBirthYear]  = useState(initial?.year ?? 2000);
  const [now, setNow] = useState(() => new Date());
  const MONTH_NAMES = getMonthNames(t);
  const STATS = getStats(t);
  const { share, done } = useShare();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const current = JSON.stringify({ day: birthDay, month: birthMonth, year: birthYear });
  const saved = savedRaw === current;

  const birth = new Date(birthYear, birthMonth - 1, birthDay);
  // Guard against day overflow (e.g. Feb 30 rolls to Mar)
  const valid = !isNaN(birth.getTime()) &&
    birth < now &&
    birth.getDate() === birthDay &&
    birth.getMonth() === birthMonth - 1;

  const age    = valid ? calcAge(birth, now) : null;
  const zodiac = valid ? getZodiac(birthMonth, birthDay) : null;
  const years  = age ? splitUnit(age.years, 'year', lang) : null;
  const clock = age && (
    <span dir="ltr" className="tabular-nums">
      {fmt2(age.hours, lang)}:{fmt2(age.minutes, lang)}:<span className="ac-sec">{fmt2(age.seconds, lang)}</span>
    </span>
  );

  function shareAge() {
    if (!age) return;
    const ageText = [fmtUnit(age.years, 'year', lang, 'long'), fmtUnit(age.months, 'month', lang, 'long'), formatDays(age.days, lang)].join(', ');
    share(`${s.ageShareText.replace('{age}', ageText)}\nhttps://www.everyday1234567.com/age-calculator`);
  }

  return (
    <ToolFrame
      toolId="vek"
      myDay={{ saved, onSave: () => myDaySet(AGE_CALCULATOR_DOB_KEY, { day: birthDay, month: birthMonth, year: birthYear }) }}
    >

      <div className="tf-panel">
        <ToolField label={t.ageCalculator.dateOfBirth} htmlFor="ac-day"
          hint={birthDay > 28 && !valid && birth.getDate() !== birthDay
            ? `⚠️ ${t.ageCalculator.invalidDay.replace('{month}', MONTH_NAMES[birthMonth - 1]).replace('{day}', fmtNumber(birthDay, lang))}`
            : undefined}>
          <div className="tf-row">
            <select id="ac-day" className="tf-input" style={{ flex: 1 }} value={birthDay} onChange={e => setBirthDay(Number(e.target.value))} aria-label={t.ageCalculator.dateOfBirth}>
              {DAYS.map(d => <option key={d} value={d}>{fmtNumber(d, lang)}</option>)}
            </select>
            <select className="tf-input" style={{ flex: 2 }} value={birthMonth} onChange={e => setBirthMonth(Number(e.target.value))} aria-label={t.ageCalculator.dateOfBirth}>
              {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select className="tf-input" style={{ flex: 1.3 }} value={birthYear} onChange={e => setBirthYear(Number(e.target.value))} aria-label={t.ageCalculator.dateOfBirth}>
              {yearOptions(now).map(y => <option key={y} value={y}>{new Intl.NumberFormat(lang, { useGrouping: false }).format(y)}</option>)}
            </select>
          </div>
        </ToolField>
      </div>

      {!valid && <div className="tf-note" style={{ padding: '2rem 0' }}>{t.ageCalculator.enterDateOfBirth}</div>}

      {age && years && zodiac && (
        <>
          <ToolHero
            label={t.ageCalculator.yourAge}
            value={years.num}
            unit={years.word}
            sub={<>{fmtUnit(age.months, 'month', lang, 'long')} · {formatDays(age.days, lang)} · {clock}</>}
          />

          <ToolCards>
            <ToolCard
              wide icon="🎂" color="#D946EF"
              label={t.ageCalculator.nextBirthday}
              value={age.isToday
                ? t.ageCalculator.happyBirthday
                : capitalize(age.nextBirthdayDate.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), lang)}
              sub={age.isToday ? undefined : formatDays(age.nextBirthday, lang)}
            />
            <ToolCard
              icon={zodiac.emoji} color="#F59E0B"
              label={t.ageCalculator.zodiac}
              value={t.ageCalculator.zodiacSigns[ZODIAC.indexOf(zodiac)]}
            />
            <ToolCard
              icon="📅" color="#38BDF8"
              label={t.ageCalculator.dayOfBirth}
              value={capitalize(birth.toLocaleDateString(lang, { weekday: 'long' }), lang)}
            />
          </ToolCards>

          <ToolTiles items={STATS.map(({ key, label }) => ({
            label, value: fmtCompact(age[key], lang), accent: key === 'totalSeconds',
          }))} />

          <ToolButton onClick={shareAge}>{done ? s.copied : <>📤 {s.shareAge}</>}</ToolButton>
        </>
      )}

      <style>{`
        .ac-sec { color: #C4B5FD; }
      `}</style>
    </ToolFrame>
  );
}
