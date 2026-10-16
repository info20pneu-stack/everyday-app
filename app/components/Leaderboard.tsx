'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';

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

function flagEmoji(code: string) {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

export function LeaderboardPanel({
  game, accentColor, renderValue,
}: {
  game: string;
  accentColor: string;
  renderValue: (e: LBEntry) => React.ReactNode;
}) {
  const { t } = useLang();
  const [season, setSeason] = useState<'week' | 'all'>('week');
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<LBEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setExpanded(false);
    fetch(`/api/leaderboard?game=${game}&season=${season}`)
      .then(r => r.json() as Promise<{ entries: LBEntry[] }>)
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [game, season]);

  const visible = entries.slice(0, expanded ? 100 : 20);

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Season tabs */}
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
                  <span style={{ fontSize: '13px', flexShrink: 0 }} title={e.city || e.country}>{flagEmoji(e.country)}</span>
                )}
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: accentColor, fontWeight: '700', flexShrink: 0 }}>
                  {renderValue(e)}
                </span>
              </div>
            ))}
          </div>
          {entries.length > 20 && (
            <button onClick={() => setExpanded(ex => !ex)} style={{
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
