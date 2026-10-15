'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function resolveLaunchDate(): Date {
  const raw = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(Date.now() + 30 * 86400000);
}

function getTimeLeft(diffMs: number): TimeLeft {
  const diff = Math.max(0, diffMs);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function MaintenancePage() {
  const { t } = useLang();
  // Computed once on mount so the countdown has a fixed target for the session.
  const [launchDate] = useState<Date>(() => resolveLaunchDate());
  // Start null so server and first client render match exactly (both show
  // placeholders) — Date.now() must not run until after mount, otherwise the
  // SSR-computed and hydration-computed second can differ and React flags a
  // hydration mismatch.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = launchDate.getTime() - Date.now();
      setTimeLeft(getTimeLeft(diff));
      if (diff <= 0) setLaunched(true);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [launchDate]);

  const units = [
    { value: timeLeft?.days, label: t.maintenance.days },
    { value: timeLeft?.hours, label: t.maintenance.hours },
    { value: timeLeft?.minutes, label: t.maintenance.minutes },
    { value: timeLeft?.seconds, label: t.maintenance.seconds },
  ];

  return (
    <div className="maintenance-page">
      <div className="maintenance-glow" />

      <h1 className="maintenance-title">EVERY DAY</h1>
      <p className="maintenance-tagline">{t.maintenance.tagline}</p>

      {launched ? (
        <p className="maintenance-launching">{t.maintenance.launchingSoon}</p>
      ) : (
        <div className="maintenance-countdown">
          {units.map(u => (
            <div key={u.label} className="maintenance-countdown-unit">
              <span key={u.value ?? 'pending'} className="maintenance-countdown-value tabular-nums">
                {u.value != null ? String(u.value).padStart(2, '0') : '--'}
              </span>
              <span className="maintenance-countdown-label">{u.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
