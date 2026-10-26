'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmt2, fmtCompact, fmtNumber, fmtUnit } from '../../lib/formatNumber';
import { useIsClient } from '../../lib/games/useIsClient';
import { toolStrings } from '../../lib/toolsI18n';
import { dayWord, formatDays } from '../../lib/homeI18n';
import ToolFrame, { ToolButton, ToolField, ToolHero, ToolTiles, useShare } from './tools/ToolFrame';

type Diff = {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  /** Time left over after the whole days of the total difference (for the big clock). */
  restHours: number;
  restMinutes: number;
  restSeconds: number;
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
  const restSec = Math.floor((totalMs % 86400000) / 1000);
  const restHours = Math.floor(restSec / 3600);
  const restMinutes = Math.floor((restSec % 3600) / 60);
  const restSeconds = restSec % 60;

  return { years, months, weeks, days, hours, minutes, seconds, totalDays, restHours, restMinutes, restSeconds, past };
}

function getStatLabels(t: Translations) {
  return [
    { key: 'years', label: t.dateCounter.years },
    { key: 'months', label: t.dateCounter.months },
    { key: 'weeks', label: t.dateCounter.weeks },
    { key: 'days', label: t.dateCounter.days },
    { key: 'hours', label: t.dateCounter.hours },
    { key: 'minutes', label: t.dateCounter.minutes },
    { key: 'seconds', label: t.dateCounter.seconds },
  ] as const;
}

function toLocalInput(d: Date) {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function DateCounter() {
  // The default dates are "now", so the inputs render in the browser only (no hydration mismatch)
  const isClient = useIsClient();
  return (
    <ToolFrame toolId="dny">
      {isClient ? <DateCounterBody /> : <div style={{ minHeight: 560 }} />}
    </ToolFrame>
  );
}

function DateCounterBody() {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
  const STAT_LABELS = getStatLabels(t);
  const [fromVal, setFromVal] = useState(() => toLocalInput(new Date()));
  const [toVal, setToVal] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toLocalInput(d);
  });
  const [, setTick] = useState(0);
  const { share, done } = useShare();

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const from = new Date(fromVal);
  const to = new Date(toVal);
  const valid = !isNaN(from.getTime()) && !isNaN(to.getTime());
  const diff = valid ? calcDiff(from, to) : null;
  const dateFmt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };

  function shareDiff() {
    if (!diff) return;
    share(`${from.toLocaleString(lang, dateFmt)} → ${to.toLocaleString(lang, dateFmt)}: ${formatDays(diff.totalDays, lang)}\nhttps://www.everyday1234567.com/date-counter`);
  }

  return (
    <>
      <div className="tf-panel">
        <div className="tf-row dc-row">
          <ToolField label={t.dateCounter.from} htmlFor="dc-from">
            <input id="dc-from" type="datetime-local" className="tf-input dc-input" value={fromVal} onChange={e => setFromVal(e.target.value)} />
          </ToolField>
          <ToolField label={t.dateCounter.to} htmlFor="dc-to">
            <input id="dc-to" type="datetime-local" className="tf-input dc-input" value={toVal} onChange={e => setToVal(e.target.value)} />
          </ToolField>
        </div>
        <button type="button" className="tf-chip" style={{ alignSelf: 'flex-start' }} onClick={() => setFromVal(toLocalInput(new Date()))}>
          ⏱ {t.dateCounter.setFromNow}
        </button>
      </div>

      {!valid && <div className="tf-note" style={{ padding: '2rem 0' }}>{t.dateCounter.enterBothDates}</div>}

      {diff && (
        <>
          <ToolHero
            label={diff.past ? t.dateCounter.inThePast : t.dateCounter.inTheFuture}
            value={fmtNumber(diff.totalDays, lang)}
            unit={dayWord(diff.totalDays, lang)}
            sub={
              <>
                {[
                  diff.years > 0 && fmtUnit(diff.years, 'year', lang, 'long'),
                  diff.months > 0 && fmtUnit(diff.months, 'month', lang, 'long'),
                  diff.days > 0 && formatDays(diff.days, lang),
                ].filter(Boolean).join(' · ')}
                {(diff.years > 0 || diff.months > 0 || diff.days > 0) && ' · '}
                <span dir="ltr" className="tabular-nums">
                  {fmt2(diff.restHours, lang)}:{fmt2(diff.restMinutes, lang)}:<span style={{ color: '#FDBA74' }}>{fmt2(diff.restSeconds, lang)}</span>
                </span>
              </>
            }
          />

          <ToolTiles items={STAT_LABELS.map(({ key, label }) => ({
            label,
            value: fmtCompact(key === 'weeks' ? diff.weeks : key === 'days' ? diff.days : diff[key], lang),
            accent: key === 'seconds',
          }))} />

          <ToolButton onClick={shareDiff}>{done ? s.copied : <>📤 {s.share}</>}</ToolButton>
        </>
      )}

      <style>{`
        .dc-input { color-scheme: dark; }
        @media (max-width: 520px) { .dc-row { flex-direction: column; align-items: stretch; } }
      `}</style>
    </>
  );
}
