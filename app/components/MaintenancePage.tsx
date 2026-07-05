'use client';

import { useEffect, useState } from 'react';

// 14 days from today (set 2026-07-05) — fixed target, not a rolling window.
const LAUNCH_DATE = new Date('2026-07-19T00:00:00Z');

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function MaintenancePage() {
  // Start null so server and first client render match exactly (both show
  // placeholders) — Date.now() must not run until after mount, otherwise the
  // SSR-computed and hydration-computed second can differ and React flags a
  // hydration mismatch.
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const iv = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(iv);
  }, []);

  const units = [
    { value: timeLeft?.days, label: 'Days' },
    { value: timeLeft?.hours, label: 'Hours' },
    { value: timeLeft?.minutes, label: 'Minutes' },
    { value: timeLeft?.seconds, label: 'Seconds' },
  ];

  return (
    <div className="maintenance-page">
      <div className="maintenance-glow" />

      <h1 className="maintenance-title">EVERY DAY</h1>
      <p className="maintenance-tagline">We&apos;re building something amazing. Coming soon.</p>

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
    </div>
  );
}
