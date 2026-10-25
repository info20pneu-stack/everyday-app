'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import Flag from './Flag';

export type LBEntry = {
  id: string;
  name: string;
  country: string;
  city: string;
  timeMs: number;
  score?: number;
  moves?: number;
  device?: 'mobile' | 'desktop';
  date: number;
};

export function LeaderboardPanel({
  game, accentColor, renderValue, daily = false,
}: {
  game: string;
  accentColor: string;
  renderValue: (e: LBEntry) => React.ReactNode;
  /** The board itself is one day (e.g. `dailyblocks_20261024`): no week / all-time tabs. */
  daily?: boolean;
}) {
  const { t } = useLang();
  const [season, setSeason] = useState<'week' | 'all'>('week');
  const [loaded, setLoaded] = useState<{ url: string; entries: LBEntry[] } | null>(null);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const url = `/api/leaderboard?game=${game}${daily ? '' : `&season=${season}`}`;

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(r => r.json() as Promise<{ entries: LBEntry[] }>)
      .then(d => { if (!cancelled) setLoaded({ url, entries: d.entries ?? [] }); })
      .catch(() => { if (!cancelled) setLoaded({ url, entries: [] }); });
    return () => { cancelled = true; };
  }, [url]);

  // Derived from the request url, so switching game / tab shows "loading" and collapses the list again
  const loading = loaded?.url !== url;
  const entries = loading ? [] : loaded.entries;
  const expanded = expandedUrl === url;
  const visible = entries.slice(0, expanded ? 100 : 20);

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Season tabs (a daily board only has today) */}
      {daily ? (
        <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: accentColor, textAlign: 'center' }}>{t.games.today}</div>
      ) : (
      <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
        {(['week', 'all'] as const).map(s => (
          <button key={s} onClick={() => setSeason(s)} style={{
            flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: '600',
            background: s === season ? `${accentColor}2a` : 'rgba(255,255,255,0.05)',
            color: s === season ? accentColor : 'var(--text3)',
            outline: s === season ? `1px solid ${accentColor}66` : 'none',
          }}>{s === 'week' ? t.games.thisWeek : t.games.allTimeSeason}</button>
        ))}
      </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--text3)' }}>{t.games.loading}</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--text3)' }}>{t.games.noRecords}</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {visible.map((e, i) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 10px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <span style={{ fontSize: '12px', width: '24px', textAlign: 'right', flexShrink: 0, color: 'var(--text3)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name}
                </span>
                {e.country && (
                  <span style={{ display: 'inline-flex', flexShrink: 0 }} title={e.city || e.country}><Flag code={e.country} size={18} label={e.country} /></span>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: accentColor, fontWeight: '700', flexShrink: 0 }}>
                  {renderValue(e)}
                </span>
              </div>
            ))}
          </div>
          {entries.length > 20 && (
            <button onClick={() => setExpandedUrl(expanded ? null : url)} style={{
              marginTop: '8px', width: '100%', padding: '7px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
              color: 'var(--text2)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}>
              {expanded ? t.games.showTop20 : t.games.showTop100}
            </button>
          )}
        </>
      )}
    </div>
  );
}
