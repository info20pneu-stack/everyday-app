'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../../../lib/LanguageContext';
import { recordLeaderboardRank } from '../../../lib/streak';
import { WORLD_COUNTRIES, flagEmoji, getCountryName } from '../../../lib/games/countries';
import { formatTimeMs, getLeaderboardConfig } from '../../../lib/gamesCatalog';

/* "Save your result" window shared by all games (moved out of DailyGames).
   Pass `result` to replace the default result block; by default the leaderboard config decides:
   points → big score, time → mm:ss.ffff. */

type LBApiEntry = { id: string };

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function detectDevice(): 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

export interface ScoreSubmitModalProps {
  /** Leaderboard id (a key of LEADERBOARD_GAMES, or `<id>_<variant>`). */
  game: string;
  timeMs: number;
  score?: number;
  moves?: number;
  diff?: string;
  /** Heading text, e.g. "🧩 Puzzle completed!". */
  title: ReactNode;
  /** Replaces the default result block. */
  result?: ReactNode;
  /** Rendered between the result and the form (e.g. "challenge a friend"). */
  extra?: ReactNode;
  onClose: () => void;
  onShowLeaderboard: () => void;
}

export const scoreModalInputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9px',
  color: '#fff', fontSize: '14px', padding: '10px 12px', outline: 'none',
  boxSizing: 'border-box',
};

export default function ScoreSubmitModal({
  game, timeMs, score, moves, diff, title, result, extra, onClose, onShowLeaderboard,
}: ScoreSubmitModalProps) {
  const { lang, t, rtl } = useLang();
  const [nick,       setNick]       = useState(() => lsGet<string>('lb_nick', ''));
  const [country,    setCountry]    = useState(() => lsGet<string>('lb_country', ''));
  const [city,       setCity]       = useState(() => lsGet<string>('lb_city', ''));
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');
  const [phase,      setPhase]      = useState<'form' | 'confirm'>('form');
  const [myRank,     setMyRank]     = useState<number | null>(null);
  const device = useMemo(() => detectDevice(), []);

  async function handleSubmit() {
    if (!nick.trim() || submitting) return;
    setSubmitting(true);
    setSubmitErr('');
    try {
      lsSet('lb_nick', nick.trim());
      lsSet('lb_country', country);
      lsSet('lb_city', city.trim());
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, name: nick.trim(), country, city: city.trim(), timeMs, score, moves, diff, device }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 201) {
        const raw = await fetch(`/api/leaderboard?game=${encodeURIComponent(game)}`);
        const lb = await raw.json() as { entries: LBApiEntry[] };
        const idx = lb.entries.findIndex(e => e.id === (data.entry as LBApiEntry).id);
        const rank = idx >= 0 ? idx + 1 : null;
        setMyRank(rank);
        if (rank !== null) recordLeaderboardRank(rank);
        setPhase('confirm');
      } else if (data.notBetter || data.notInTop) {
        setMyRank(data.rank as number);
        recordLeaderboardRank(data.rank as number);
        setPhase('confirm');
      } else {
        setSubmitErr((data.error as string) || t.games.submitError);
      }
    } catch {
      setSubmitErr(t.games.connectionError);
    } finally {
      setSubmitting(false);
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
  };
  const box: React.CSSProperties = {
    background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(93,76,255,0.35)',
    borderRadius: '18px', padding: '24px 20px', width: '100%', maxWidth: '360px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
    animation: 'ssmModalIn 0.22s cubic-bezier(.34,1.56,.64,1)',
    maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', position: 'relative',
  };

  // Portal into <body> so the fixed overlay always covers the viewport (ancestors may create a containing block)
  return createPortal(
    <div style={overlay} dir={rtl ? 'rtl' : 'ltr'} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={box} role="dialog" aria-modal="true">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏆</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: '700', color: '#fff' }}>
            {title}
          </div>
        </div>

        {/* Result display */}
        <div style={{ textAlign: 'center', marginBottom: '16px', padding: '14px 12px', background: 'rgba(93,76,255,0.1)', borderRadius: '12px', border: '1px solid rgba(93,76,255,0.25)' }}>
          {result ?? <DefaultResult game={game} timeMs={timeMs} score={score} lang={lang} />}
        </div>

        {extra}

        {phase === 'form' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <input
                type="text" placeholder={t.games.nickPlaceholder} value={nick} maxLength={30}
                onChange={e => setNick(e.target.value.slice(0, 30))}
                style={scoreModalInputStyle}
              />
              <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...scoreModalInputStyle, cursor: 'pointer' }}>
                <option value="">{t.games.countryPlaceholder}</option>
                {WORLD_COUNTRIES.map(code => (
                  <option key={code} value={code}>
                    {flagEmoji(code)} {getCountryName(code, lang)}
                  </option>
                ))}
              </select>
              <input
                type="text" placeholder={t.games.cityPlaceholder} value={city} maxLength={60}
                onChange={e => setCity(e.target.value.slice(0, 60))}
                style={scoreModalInputStyle}
              />
            </div>
            {submitErr && <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '8px', textAlign: 'center' }}>{submitErr}</div>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSubmit}
                disabled={!nick.trim() || submitting}
                style={{
                  flex: 2, background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
                  border: 'none', borderRadius: '10px', color: '#fff',
                  fontSize: '14px', fontWeight: '600', padding: '11px', cursor: 'pointer',
                  opacity: nick.trim() && !submitting ? 1 : 0.5,
                }}
              >
                {submitting ? '…' : t.games.submitToLb}
              </button>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                {t.games.skip}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: 'var(--green2)' }}>
                {t.games.addedToLb}
              </div>
              {myRank && (
                <div style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '6px' }}>
                  {t.games.rankIs} <span style={{ color: '#FFB300', fontWeight: '700' }}>#{myRank}</span> {t.games.rankGlobal}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { onShowLeaderboard(); onClose(); }} style={{
                flex: 2, background: 'rgba(255,179,0,0.12)', border: '1px solid rgba(255,179,0,0.3)',
                borderRadius: '10px', color: '#FFB300', fontSize: '14px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                {t.games.showLeaderboard}
              </button>
              <button onClick={onClose} style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: 'var(--text2)', fontSize: '13px', fontWeight: '600',
                padding: '11px', cursor: 'pointer',
              }}>
                {t.games.close}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes ssmModalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

/** Default result block, driven by the game's leaderboard config. */
function DefaultResult({ game, timeMs, score, lang }: { game: string; timeMs: number; score?: number; lang: string }) {
  const { t } = useLang();
  const cfg = getLeaderboardConfig(game);
  if (cfg?.scoreType === 'points') {
    return (
      <>
        <div style={{ fontFamily: 'Poppins', fontSize: '60px', fontWeight: '900', background: 'linear-gradient(135deg,var(--purple3),#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
          {(score ?? 0).toLocaleString(lang)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
          {t.games.score} · {formatTimeMs(timeMs)}
        </div>
      </>
    );
  }
  return (
    <>
      <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
        {formatTimeMs(timeMs)}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{t.games.time}</div>
    </>
  );
}
