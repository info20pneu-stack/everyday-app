'use client';

import { useState, useEffect, useRef } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { getDisplayState, BADGES, STREAK_UPDATED_EVENT, type StreakState, type BadgeId } from '../../lib/streak';

export default function StreakBadge() {
  const { t, rtl } = useLang();
  const [state, setState] = useState<StreakState | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(getDisplayState());
    const onUpdate = () => setState(getDisplayState());
    window.addEventListener(STREAK_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!state) return null;

  const badgeLabel: Record<BadgeId, string> = {
    streak3: t.streak.badge_streak3,
    streak7: t.streak.badge_streak7,
    streak30: t.streak.badge_streak30,
    streak100: t.streak.badge_streak100,
    games10: t.streak.badge_games10,
    games100: t.streak.badge_games100,
    top100: t.streak.badge_top100,
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={t.streak.title}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: open ? 'rgba(255,149,0,0.18)' : 'rgba(255,255,255,0.04)',
          border: open ? '1px solid rgba(255,149,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px', color: '#fff', padding: '4px 9px',
          fontSize: '13px', cursor: 'pointer', height: '32px',
        }}
      >
        <span>🔥</span>
        <span style={{ fontSize: '12px', fontWeight: '700' }}>{state.currentStreak}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          right: rtl ? undefined : 0, left: rtl ? 0 : undefined,
          background: '#0f1428', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px', padding: '14px', zIndex: 200,
          width: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>
            {t.streak.title}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <StatBox label={t.streak.currentStreak} value={state.currentStreak} />
            <StatBox label={t.streak.longestStreak} value={state.longestStreak} />
            <StatBox label={t.streak.totalDays} value={state.totalCompletedDays} />
            <StatBox label={t.streak.totalGames} value={state.totalGamesPlayed} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {t.streak.badgesTitle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {BADGES.map(b => {
              const unlocked = state.unlockedBadges.includes(b.id);
              return (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: unlocked ? 1 : 0.35,
                }}>
                  <span style={{ fontSize: '15px' }}>{b.emoji}</span>
                  <span style={{ fontSize: '11.5px', color: unlocked ? '#fff' : 'var(--text3)' }}>
                    {badgeLabel[b.id]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px', padding: '8px 10px',
    }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: '700', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}
