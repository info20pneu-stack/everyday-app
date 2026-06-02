'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0
    ? `${m}:${String(sec).padStart(2, '0')}`
    : `${sec}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
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
  activity, done, onDone,
}: {
  activity: Activity;
  done: boolean;
  onDone: () => void;
}) {
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
      background: done ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
      border: done ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
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
            {activity.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.4 }}>
            {activity.desc}
          </div>
          {activity.durationLabel && (
            <div style={{ fontSize: '10px', color: 'var(--purple3)', marginTop: '3px' }}>
              ⏱ {activity.durationLabel}
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
              fontSize: remaining >= 60 ? '10px' : '12px',
              fontWeight: '700', color: finished ? 'var(--green2)' : '#fff',
              fontFamily: 'Poppins',
            }}>
              {finished ? '✓' : fmtTime(remaining)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {/* Progress bar */}
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', marginBottom: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: finished ? 'var(--green2)' : 'var(--purple3)', borderRadius: '2px', transition: 'width 0.9s linear' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setRunning(r => !r)}
                disabled={finished}
                style={{
                  flex: 1, padding: '5px', borderRadius: '7px', border: 'none', cursor: finished ? 'default' : 'pointer',
                  background: running ? 'rgba(239,68,68,0.2)' : 'rgba(93,76,255,0.25)',
                  color: running ? '#EF4444' : 'var(--purple3)',
                  fontSize: '12px', fontWeight: '600',
                }}
              >
                {running ? '⏸ Pauza' : finished ? 'Hotovo!' : '▶ Start'}
              </button>
              <button
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
        <button
          onClick={onDone}
          style={{
            width: '100%', padding: '7px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: 'var(--text2)', fontSize: '12px',
            cursor: 'pointer', fontWeight: '500',
          }}
        >
          Mark as done
        </button>
      )}

      {done && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--green2)', fontWeight: '600' }}>
          Done! Great work 💚
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ STREAK BADGE ═══════════════════════ */

function StreakBadge({ count }: { count: number }) {
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
        {count} {count === 1 ? 'day' : 'days'}
      </span>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function DailyBoost() {
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
      const raw = localStorage.getItem(`db_done_${today}`);
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
    try { localStorage.setItem(`db_done_${today}`, JSON.stringify(completed)); } catch {}
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
  }

  const doneCount  = completed.filter(Boolean).length;
  const allDone    = doneCount === 4;

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '2px' }}>
            🌅 Daily Boost
          </h2>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
            {formatDate()}
          </div>
        </div>
        <StreakBadge count={streak} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '5px' }}>
          <span>Today's challenges</span>
          <span style={{ color: allDone ? 'var(--green2)' : '#fff', fontWeight: '600' }}>{doneCount} / 4</span>
        </div>
        <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(doneCount / 4) * 100}%`,
            background: allDone
              ? 'linear-gradient(90deg, var(--green2), #4ADE80)'
              : 'linear-gradient(90deg, var(--purple), var(--blue2))',
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Quote */}
      <div style={{
        background: 'rgba(93,76,255,0.08)',
        border: '1px solid rgba(93,76,255,0.18)',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.5 }}>
          „{quote.text}"
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', textAlign: 'right' }}>
          — {quote.author}
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(74,222,128,0.08))',
          border: '1px solid rgba(34,197,94,0.35)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '1rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '22px', marginBottom: '4px' }}>🎉</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--green2)', fontFamily: 'Poppins' }}>
            All challenges completed!
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
            {streak > 1 ? `${streak}-day streak! Keep it up 🔥` : 'Great start. Come back tomorrow!'}
          </div>
        </div>
      )}

      {/* Activity cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {activities.map((a, i) => (
          <ActivityCard
            key={a.id}
            activity={a}
            done={completed[i]}
            onDone={() => markDone(i)}
          />
        ))}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '1rem' }}>
        Activities change daily · Streak counts when all 4 are completed
      </div>
    </div>
  );
}
