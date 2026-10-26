'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { recordDailyBoostActivity } from '../../lib/streak';
import type { Lang } from '../../lib/i18n';
import { fmtNumber } from '../../lib/formatNumber';
import { formatDays } from '../../lib/homeI18n';
import { useIsClient } from '../../lib/games/useIsClient';
import { boostStrings, type ActivityId } from '../../lib/dailyBoostI18n';
import ToolFrame, { ToolHero } from './tools/ToolFrame';

/* ═══════════════════════ DATA ═══════════════════════ */

type Activity = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  duration?: number; // seconds
  durationLabel?: string;
};

const BANK: Activity[] = [
  { id: 'walk',      icon: '🚶', name: 'Family walk',          desc: 'Step outside for fresh air. Your body and mind will thank you.', duration: 1200, durationLabel: '20 min' },
  { id: 'squats',    icon: '🏋️', name: '30 squats',            desc: 'Slow and controlled. Back straight, knees over toes.' },
  { id: 'plank',     icon: '🧱', name: 'Plank 30 seconds',     desc: 'Keep your body in a straight line. Breathe steadily.', duration: 30, durationLabel: '30 s' },
  { id: 'breathing', icon: '🌬️', name: 'Box breathing',        desc: '4 s inhale → 4 s hold → 4 s exhale → 4 s hold. Repeat 4×.', duration: 64, durationLabel: '4 cycles' },
  { id: 'stretch',   icon: '🧘', name: 'Morning stretch',      desc: 'Stretch your shoulders, back and hips. Gently, without straining.', duration: 300, durationLabel: '5 min' },
  { id: 'pushups',   icon: '💪', name: '10 push-ups',          desc: 'Slow tempo, full range of motion. Keep your hips level.' },
  { id: 'water',     icon: '💧', name: '2 glasses of water',   desc: 'Right now! Hydration improves focus and mood.' },
  { id: 'steps',     icon: '👣', name: '1,000 extra steps',    desc: 'Get off one stop early, take stairs, go for a walk after lunch.' },
  { id: 'eyes',      icon: '👁️', name: '20-20-20 rule',        desc: 'Look 6 m away and hold your gaze for 20 seconds.', duration: 20, durationLabel: '20 s' },
  { id: 'praise',    icon: '🌟', name: 'Compliment someone',   desc: 'A sincere compliment brightens someone\'s day and yours too.' },
  { id: 'catcow',    icon: '🐱', name: 'Cat–cow stretch',      desc: 'Alternate cat and cow 10×. Releases your back and spine.', duration: 120, durationLabel: '2 min' },
  { id: 'jumps',     icon: '🤸', name: '30 jumping jacks',     desc: 'Get your whole body moving, boost your circulation!' },
];

const QUOTES = [
  { text: 'Small steps every day lead to great results.', author: 'Anonymous' },
  { text: 'The best time to start was yesterday. The second best is now.', author: 'Chinese proverb' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'Every day is a new opportunity to be a better version of yourself.', author: 'Anonymous' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Movement is medicine. Start now, your body will thank you.', author: 'Hippocrates (adapted)' },
  { text: 'The most important steps are the first ones — take them.', author: 'Anonymous' },
  { text: 'Self-care is not selfishness, it is a necessity.', author: 'Audre Lorde' },
  { text: 'Strength doesn\'t come from what you can do. It comes from overcoming what you thought you couldn\'t.', author: 'Rikki Rogers' },
  { text: 'Your biggest project is you.', author: 'Anonymous' },
  { text: 'One good habit is not enough, but it\'s a start.', author: 'Anonymous' },
  { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
  { text: 'You will never regret a good workout.', author: 'Anonymous' },
  { text: 'The energy you give your body returns to you as mental energy.', author: 'Anonymous' },
  { text: 'Every minute of movement adds hours to your life.', author: 'Anonymous' },
];

/* ═══════════════════════ HELPERS ═══════════════════════ */

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dateSeed(d = new Date()) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DAILY_BOOST_DONE_PREFIX = 'db_done_';
export const DAILY_BOOST_ACTIVITY_COUNT = 4;

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0
    ? `${m}:${String(sec).padStart(2, '0')}`
    : `${sec}`;
}

function formatDate(lang: string, d = new Date()) {
  const s = d.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
}

/** "20 min", "30 s", "4 cykly" in the UI language. */
function durationLabel(a: Activity, lang: Lang): string | null {
  if (!a.duration) return null;
  if (a.id === 'breathing') return boostStrings(lang).cycles.replace('{n}', fmtNumber(4, lang));
  const unit = a.duration >= 60 ? 'minute' : 'second';
  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short' }).format(a.duration >= 60 ? a.duration / 60 : a.duration);
}

/** Name and description of an activity in the UI language. */
function activityText(a: Activity, lang: Lang): [string, string] {
  return boostStrings(lang).acts[a.id as ActivityId] ?? [a.name, a.desc];
}

function quoteAuthor(author: string, lang: Lang): string {
  const b = boostStrings(lang);
  return author === 'Anonymous' ? b.anonymous : author === 'Chinese proverb' ? b.proverb : author === 'Hippocrates (adapted)' ? b.hippocrates : author;
}

/* ═══════════════════════ TIMER RING ═══════════════════════ */

function TimerRing({ progress, size = 52 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - progress);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--purple3)" strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
      />
    </svg>
  );
}

/* ═══════════════════════ ACTIVITY CARD ═══════════════════════ */

function ActivityCard({
  activity, done, onDone, t, lang,
}: {
  activity: Activity;
  done: boolean;
  onDone: () => void;
  t: Translations;
  lang: Lang;
}) {
  const [name, desc] = activityText(activity, lang);
  const dur = durationLabel(activity, lang);
  const hasDuration = !!activity.duration;
  const [remaining, setRemaining] = useState(activity.duration ?? 0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  function reset() {
    setRunning(false);
    setFinished(false);
    setRemaining(activity.duration ?? 0);
    if (ref.current) clearInterval(ref.current);
  }

  const progress = activity.duration ? 1 - remaining / activity.duration : 0;

  return (
    <div style={{
      background: done ? 'linear-gradient(160deg, rgba(34,197,94,0.16), rgba(18,22,64,0.8))' : 'linear-gradient(160deg, #1C2258, #121640)',
      border: done ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.07)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      transition: 'border 0.3s, background 0.3s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Done overlay shimmer */}
      {done && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06), transparent)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon + name row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          fontSize: '28px', lineHeight: 1,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '6px 8px',
          flexShrink: 0,
        }}>
          {done ? '✅' : activity.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: done ? 'var(--green2)' : '#fff', marginBottom: '2px', fontFamily: 'Poppins' }}>
            {name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.4 }}>
            {desc}
          </div>
          {dur && (
            <div style={{ fontSize: '12px', color: '#FCD34D', marginTop: '3px' }}>
              ⏱ {dur}
            </div>
          )}
        </div>
      </div>

      {/* Timer */}
      {hasDuration && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <TimerRing progress={progress} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: remaining >= 60 ? '12px' : '12px',
              fontWeight: '700', color: finished ? 'var(--green2)' : '#fff',
              fontFamily: 'Poppins',
            }}>
              <span dir="ltr">{finished ? '✓' : fmtTime(remaining)}</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {/* Progress bar */}
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', marginBottom: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: finished ? 'var(--green2)' : 'var(--purple3)', borderRadius: '2px', transition: 'width 0.9s linear' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="icon-btn"
                onClick={() => setRunning(r => !r)}
                disabled={finished}
                style={{
                  flex: 1, padding: '5px', borderRadius: '7px', border: 'none', cursor: finished ? 'default' : 'pointer',
                  background: running ? 'rgba(239,68,68,0.2)' : 'rgba(93,76,255,0.25)',
                  color: running ? '#EF4444' : 'var(--purple3)',
                  fontSize: '12px', fontWeight: '600',
                }}
              >
                {running ? t.dailyBoost.pause : finished ? t.dailyBoost.finished : t.dailyBoost.start}
              </button>
              <button className="icon-btn"
                onClick={reset}
                style={{
                  padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer',
                }}
              >↺</button>
            </div>
          </div>
        </div>
      )}

      {/* Done button */}
      {!done && (
        <button type="button" className="tf-chip" style={{ width: '100%' }} onClick={onDone}>
          {t.dailyBoost.markAsDone}
        </button>
      )}

      {done && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--green2)', fontWeight: '600' }}>
          {t.dailyBoost.done}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ STREAK BADGE ═══════════════════════ */

function StreakBadge({ count, lang }: { count: number; lang: Lang }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: count >= 7 ? 'rgba(255,107,0,0.15)' : 'rgba(255,179,0,0.12)',
      border: `1px solid ${count >= 7 ? 'rgba(255,107,0,0.35)' : 'rgba(255,179,0,0.25)'}`,
      borderRadius: '8px', padding: '3px 10px',
    }}>
      <span style={{ fontSize: '14px' }}>{count >= 7 ? '🔥' : count >= 3 ? '⚡' : '✨'}</span>
      <span style={{ fontSize: '12px', fontWeight: '700', color: count >= 7 ? '#FF6B00' : 'var(--amber)' }}>
        {formatDays(count, lang)}
      </span>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function DailyBoost() {
  // Today's progress lives in localStorage, so the page renders in the browser only
  const isClient = useIsClient();
  return isClient
    ? <DailyBoostBody />
    : <ToolFrame toolId="boost"><div style={{ minHeight: 600 }} /></ToolFrame>;
}

function DailyBoostBody() {
  const { t, lang } = useLang();
  const bs = boostStrings(lang);
  const today = todayKey();
  const seed  = dateSeed();

  // Pick 4 activities seeded by today's date
  const activities = seededShuffle(BANK, seed).slice(0, 4);

  // Pick daily quote
  const quote = QUOTES[seed % QUOTES.length];

  // Completion state (persisted per day)
  const [completed, setCompleted] = useState<boolean[]>(() => {
    if (typeof window === 'undefined') return [false, false, false, false];
    try {
      const raw = localStorage.getItem(`${DAILY_BOOST_DONE_PREFIX}${today}`);
      return raw ? JSON.parse(raw) : [false, false, false, false];
    } catch { return [false, false, false, false]; }
  });

  // Streak (persisted)
  const [streak, setStreak] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem('db_streak');
      return raw ? JSON.parse(raw).count ?? 0 : 0;
    } catch { return 0; }
  });

  // Save completed to localStorage
  useEffect(() => {
    try { localStorage.setItem(`${DAILY_BOOST_DONE_PREFIX}${today}`, JSON.stringify(completed)); } catch {}
  }, [completed, today]);

  // Update streak when all completed
  useEffect(() => {
    if (!completed.every(Boolean)) return;
    try {
      const raw = localStorage.getItem('db_streak');
      const stored = raw ? JSON.parse(raw) : { lastDate: '', count: 0 };
      if (stored.lastDate === today) return; // already counted today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const newCount = stored.lastDate === yKey ? stored.count + 1 : 1;
      const updated = { lastDate: today, count: newCount };
      localStorage.setItem('db_streak', JSON.stringify(updated));
      setStreak(newCount);
    } catch {}
  }, [completed, today]);

  function markDone(i: number) {
    setCompleted(prev => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
    recordDailyBoostActivity();
  }

  const doneCount  = completed.filter(Boolean).length;
  const allDone    = doneCount === 4;

  const quoteIdx = QUOTES.indexOf(quote);

  return (
    <ToolFrame toolId="boost">
      <ToolHero
        label={formatDate(lang)}
        value={<span dir="ltr">{fmtNumber(doneCount, lang)}/{fmtNumber(4, lang)}</span>}
        sub={
          <div className="bo-sub">
            <span>{t.dailyBoost.todaysChallenges}</span>
            <div className="bo-bar"><i style={{ width: `${(doneCount / 4) * 100}%`, background: allDone ? 'linear-gradient(90deg, #22C55E, #4ADE80)' : 'linear-gradient(90deg, #F59E0B, #FCD34D)' }} /></div>
            <StreakBadge count={streak} lang={lang} />
          </div>
        }
      />

      <div className="tf-card bo-quote" style={{ '--cc': '#F59E0B' } as React.CSSProperties}>
        <span className="tf-card-icon" aria-hidden="true">💬</span>
        <div className="tf-card-body">
          <div className="tf-card-value" style={{ fontWeight: 600, fontStyle: 'italic', fontSize: 14 }}>„{bs.quotes[quoteIdx] ?? quote.text}“</div>
          <div className="tf-card-sub">— {quoteAuthor(quote.author, lang)}</div>
        </div>
      </div>

      {allDone && (
        <div className="tf-panel" style={{ alignItems: 'center', textAlign: 'center', borderColor: 'rgba(34,197,94,.4)' }}>
          <div style={{ fontSize: 26 }}>🎉</div>
          <div style={{ fontWeight: 800, color: '#4ADE80' }}>{t.dailyBoost.allCompleted}</div>
          <div className="tf-note">{streak > 1 ? t.dailyBoost.streakMessage.replace('{streak}', fmtNumber(streak, lang)) : t.dailyBoost.greatStart}</div>
        </div>
      )}

      <div className="bo-grid">
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} done={completed[i]} onDone={() => markDone(i)} t={t} lang={lang} />
        ))}
      </div>

      <div className="tf-note">{t.dailyBoost.activitiesNote}</div>

      <style>{`
        .bo-sub { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .bo-bar { width: min(280px, 100%); height: 8px; border-radius: 4px; background: rgba(255,255,255,.1); overflow: hidden; }
        .bo-bar i { display: block; height: 100%; border-radius: 4px; transition: width .5s ease; }
        .bo-quote { align-items: flex-start; }
        .bo-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        @media (max-width: 400px) { .bo-grid { grid-template-columns: 1fr; } }
      `}</style>
    </ToolFrame>
  );
}
