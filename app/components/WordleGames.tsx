'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { recordGameCompleted } from '../../lib/streak';
import { LeaderboardPanel, type LBEntry as SharedLBEntry } from './Leaderboard';
import CountrySelect from './CountrySelect';
import { KB_ROWS, WordleBoard, WordleKeyboard, type TileState } from './games/WordleBoard';
import { GameBanner, GameFrame, GameTopBar } from './games/GameFrame';
import { getCatalogGame, gameText } from '../../lib/gamesCatalog';
import { wordleTarget } from '../../lib/games/wordleWords';
import { ensureGameSession, takeGameSession } from '../../lib/gameSession';
import { lbErrorText } from '../../lib/leaderboardI18n';

function lsGetStr(key: string, fb: string): string {
  if (typeof window === 'undefined') return fb;
  try { return localStorage.getItem(key) ?? fb; } catch { return fb; }
}

/* ── Word lists per category (5-letter, uppercase) ── */


function getModes(t: Translations) {
  return [
    { id: 'classic',  label: t.wordle.var_classic,  emoji: '🔤', color: '#22C55E', desc: 'Common 5-letter words' },
    { id: 'football', label: t.wordle.var_football, emoji: '⚽', color: '#10B981', desc: 'Football terms & clubs' },
    { id: 'hockey',   label: t.wordle.var_hockey,   emoji: '🏒', color: '#38BDF8', desc: 'Ice hockey vocabulary' },
    { id: 'car',      label: t.wordle.var_car,      emoji: '🚗', color: '#F43F5E', desc: 'Automotive world' },
    { id: 'crypto',   label: t.wordle.var_crypto,   emoji: '₿',  color: '#F59E0B', desc: 'Blockchain & finance' },
    { id: 'animal',   label: t.wordle.var_animal,   emoji: '🦁', color: '#F97316', desc: 'Animals & wildlife' },
    { id: 'plant',    label: t.wordle.var_plant,    emoji: '🌿', color: '#84CC16', desc: 'Flora & botany' },
    { id: 'city',     label: t.wordle.var_city,     emoji: '🌆', color: '#6366F1', desc: 'Cities of the world' },
  ];
}

export type { TileState };
export { KB_ROWS };

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Today's result of one variant, shown on the variant picker. */
type DayResult = { date: number; won: boolean; guesses: number };
const dayKey = (modeId: string) => `wordle_v2_${modeId}_day`;

function readDayResult(modeId: string): DayResult | null {
  try {
    const r = JSON.parse(localStorage.getItem(dayKey(modeId)) ?? 'null') as DayResult | null;
    return r && r.date === dateSeed() ? r : null;
  } catch { return null; }
}

function getTarget(modeId: string): string {
  return wordleTarget(modeId, dateSeed());
}

export function evaluate(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(5).fill('absent');
  const remaining = target.split('');
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) { result[i] = 'correct'; remaining[i] = ''; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'absent') {
      const j = remaining.indexOf(guess[i]);
      if (j !== -1) { result[i] = 'present'; remaining[j] = ''; }
    }
  }
  return result;
}

/* ── Confetti ── */
const CONFETTI_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a78bfa','#ec4899'];
export function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    x: 5 + (i % 12) * 8,
    delay: (i % 6) * 120,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: i % 3 === 0 ? 10 : 7,
    round: i % 2 === 0,
  }));
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${p.x}%`,
          width: p.size, height: p.size,
          borderRadius: p.round ? '50%' : '2px',
          background: p.color,
          animation: `wCf 1.4s ease-in ${p.delay}ms both`,
        }} />
      ))}
    </div>
  );
}

type SubPhase = 'idle' | 'form' | 'submitting' | 'done';

function fmtWordleTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/* ── Game component ── */
function WordleGame({ modeId, onBack }: { modeId: string; onBack: () => void }) {
  const { t, lang } = useLang();
  const MODES = getModes(t);
  const mode = MODES.find(m => m.id === modeId)!;
  const target = getTarget(modeId);
  const MAX = 6;
  const lsKey = `wordle_v2_${modeId}`;
  const lbGameId = `wordle_${modeId}`;
  const startRef = useRef(performance.now());

  const [guesses,   setGuesses]   = useState<string[]>([]);
  const [evals,     setEvals]     = useState<TileState[][]>([]);
  const [current,   setCurrent]   = useState('');
  const [revealed,  setRevealed]  = useState<Set<string>>(new Set()); // "row-col"
  const [animating, setAnimating] = useState(false);
  const [phase,     setPhase]     = useState<'playing'|'won'|'lost'>('playing');
  const [shake,     setShake]     = useState(false);
  const [message,   setMessage]   = useState('');
  const [copied,    setCopied]    = useState(false);
  const [streak,    setStreak]    = useState<{ cur: number; best: number; lastDate: number }>(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '{"cur":0,"best":0,"lastDate":0}'); } catch { return { cur: 0, best: 0, lastDate: 0 }; }
  });

  const [subPhase, setSubPhase] = useState<SubPhase>('idle');
  const [nick,     setNick]     = useState(() => lsGetStr('lb_nick', ''));
  const [country,  setCountry]  = useState(() => lsGetStr('lb_country', ''));
  const [city,      setCity]    = useState(() => lsGetStr('lb_city', ''));
  const [rank,      setRank]    = useState<number | null>(null);
  const [subErr,    setSubErr]  = useState('');
  // Anti-cheat session token (lib/gameSession.ts): fetched as the board opens, taken on the first submit
  useEffect(() => { ensureGameSession(lbGameId); }, [lbGameId]);
  const session = useRef<Promise<string | null> | null>(null);

  async function submitScore() {
    if (!nick.trim() || subPhase === 'submitting') return;
    setSubPhase('submitting'); setSubErr('');
    try {
      try {
        localStorage.setItem('lb_nick', nick.trim());
        localStorage.setItem('lb_country', country);
        localStorage.setItem('lb_city', city.trim());
      } catch {}
      const elapsedMs = Math.round(performance.now() - startRef.current);
      const guessesUsed = guesses.length;
      const score = MAX + 1 - guessesUsed;
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: lbGameId, name: nick.trim(), country, city: city.trim(), timeMs: elapsedMs, score, moves: guessesUsed,
          // The server re-checks the guesses against the day's word
          proof: { day: dateSeed(), guesses },
          token: await (session.current ??= takeGameSession(lbGameId)),
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 201 || data.notBetter || data.notInTop) {
        setRank((data.rank as number) ?? null);
        setSubPhase('done');
      } else {
        setSubErr(lbErrorText(data.code ?? data.error, lang, t.games.submitError)); setSubPhase('form');
      }
    } catch { setSubErr(t.games.connectionError); setSubPhase('form'); }
  }

  // Key colors derived from completed rows
  const keyColors: Record<string, TileState> = {};
  evals.forEach((row, ri) => {
    row.forEach((s, ci) => {
      const k = guesses[ri]?.[ci];
      if (!k) return;
      const prev = keyColors[k];
      if (!prev || (s === 'correct') || (s === 'present' && prev === 'absent')) keyColors[k] = s;
    });
  });

  function showMsg(msg: string, ms = 2000) {
    setMessage(msg);
    setTimeout(() => setMessage(''), ms);
  }

  const submit = useCallback(() => {
    if (animating || phase !== 'playing') return;
    if (current.length < 5) {
      setShake(true); setTimeout(() => setShake(false), 500);
      showMsg(t.wordle.notEnoughLetters); return;
    }
    const guess = current.toUpperCase();
    const ev = evaluate(guess, target);
    const rowIdx = guesses.length;
    setGuesses(g => [...g, guess]);
    setEvals(e => [...e, ev]);
    setCurrent('');
    setAnimating(true);

    // Reveal tiles one by one
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setRevealed(r => new Set([...r, `${rowIdx}-${i}`]));
      }, i * 300 + 250);
    }

    setTimeout(() => {
      setAnimating(false);
      if (ev.every(s => s === 'correct')) {
        setPhase('won');
        const msgs = [t.wordle.genius, t.wordle.magnificent, t.wordle.impressive, t.wordle.splendid, t.wordle.great, t.wordle.phew];
        showMsg(msgs[rowIdx] ?? '🎉', 3000);
        const today = dateSeed();
        const newCur = streak.lastDate === today - 1 ? streak.cur + 1 : 1;
        const s = { cur: newCur, best: Math.max(streak.best, newCur), lastDate: today };
        setStreak(s);
        try {
          localStorage.setItem(lsKey, JSON.stringify(s));
          localStorage.setItem(dayKey(modeId), JSON.stringify({ date: today, won: true, guesses: rowIdx + 1 } satisfies DayResult));
        } catch {}
        recordGameCompleted();
      } else if (rowIdx + 1 >= MAX) {
        setPhase('lost');
        showMsg(target, 5000);
        const s = { ...streak, cur: 0 };
        setStreak(s);
        try {
          localStorage.setItem(lsKey, JSON.stringify(s));
          localStorage.setItem(dayKey(modeId), JSON.stringify({ date: dateSeed(), won: false, guesses: MAX } satisfies DayResult));
        } catch {}
        recordGameCompleted();
      }
    }, 5 * 300 + 400);
  }, [animating, current, guesses, target, phase, streak, lsKey, modeId, t]);

  const handleKey = useCallback((k: string) => {
    if (phase !== 'playing' || animating) return;
    if (k === '⌫' || k === 'BACKSPACE') { setCurrent(c => c.slice(0, -1)); return; }
    if (k === 'ENTER') { submit(); return; }
    if (/^[A-Z]$/.test(k) && current.length < 5) setCurrent(c => c + k);
  }, [phase, animating, current, submit]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => handleKey(e.key.toUpperCase());
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleKey]);

  function buildGrid(): string {
    return evals.map(row =>
      row.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')
    ).join('\n');
  }

  async function share() {
    const text = `${mode.emoji} EVERY DAY Wordle – ${mode.label}\n${evals.length}/${MAX}\n\n${buildGrid()}\neveryday1234567.com`;
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  }

  return (
    <GameFrame color={mode.color}>
      <GameTopBar back={{ onClick: onBack, label: 'Wordle' }}>
        <span className="gx-pill" title={t.wordle.streak}><span aria-hidden="true">🔥</span> <b>{streak.cur}</b></span>
        <span className="gx-pill" title={t.wordle.maxStreak}><span aria-hidden="true">🏅</span> <b>{streak.best}</b></span>
        <a className="gx-pill gx-gold" href="#wordle-lb"><span aria-hidden="true">🏆</span> {t.games.leaderboard}</a>
      </GameTopBar>
      <GameBanner title={`${mode.label} Wordle`} desc={mode.desc} icon={mode.emoji} />

      <div className="wb-toast" role="status" aria-live="polite">{message && <span>{message}</span>}</div>

      <div style={{ position: 'relative' }}>
        {phase === 'won' && <Confetti />}
        <WordleBoard
          guesses={guesses} evals={evals} current={current} revealed={revealed}
          max={MAX} playing={phase === 'playing'} shake={shake}
        />
      </div>

      <WordleKeyboard
        keyColors={keyColors} onKey={handleKey}
        enterLabel={t.wordle.keyboard_enter} backLabel={t.wordle.keyboard_backspace}
      />

      {/* Win/lose actions */}
      {(phase === 'won' || phase === 'lost') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <button type="button" className="gx-btn gx-primary" onClick={share}>
            {copied ? t.wordle.copied : t.wordle.shareGrid}
          </button>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {t.wordle.newWordTomorrow}{phase === 'lost' ? ` · ${t.wordle.answer.replace('{word}', target)}` : ''}
          </div>
        </div>
      )}

      {/* Submit to leaderboard — wins only */}
      {phase === 'won' && subPhase === 'idle' && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button type="button" className="gx-btn gx-gold-btn" onClick={() => setSubPhase('form')}>🏅 {t.games.submitToLb}</button>
        </div>
      )}
      {phase === 'won' && (subPhase === 'form' || subPhase === 'submitting') && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text" placeholder={t.games.nickPlaceholder} value={nick} maxLength={16}
              onChange={e => setNick(e.target.value.slice(0, 16))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '9px 11px', outline: 'none', boxSizing: 'border-box' }}
            />
            <CountrySelect
              value={country} onChange={setCountry} lang={lang} placeholder={t.games.countryPlaceholder}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '9px 11px', boxSizing: 'border-box' }}
            />
            <input
              type="text" placeholder={t.games.cityPlaceholder} value={city} maxLength={60}
              onChange={e => setCity(e.target.value.slice(0, 60))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '9px 11px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {subErr && <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '6px', textAlign: 'center' }}>{subErr}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="gx-btn gx-primary gx-sm" style={{ flex: 2, minWidth: 0 }} onClick={submitScore} disabled={!nick.trim() || subPhase === 'submitting'}>
              {subPhase === 'submitting' ? '…' : t.games.submitToLb}
            </button>
            <button type="button" className="gx-btn gx-ghost gx-sm" style={{ flex: 1, minWidth: 0 }} onClick={() => setSubPhase('idle')}>
              {t.games.skip}
            </button>
          </div>
        </div>
      )}
      {phase === 'won' && subPhase === 'done' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--green2)' }}>✅ {t.games.addedToLb}</div>
          {rank && (
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '3px' }}>
              {t.games.rankIs} <span style={{ color: '#FFB300', fontWeight: '700' }}>#{rank}</span> {t.games.rankGlobal}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard — always visible below the game, auto-switches with the active mode */}
      <div id="wordle-lb" style={{ scrollMarginTop: '80px' }}>
      <LeaderboardPanel
        game={lbGameId}
        accentColor={mode.color}
        renderValue={(e: SharedLBEntry) => `${e.moves ?? '?'}/${MAX} · ${fmtWordleTime(e.timeMs)}`}
      />
      </div>

      <style>{`
        @keyframes wCf       { 0%{opacity:1;transform:translateY(0) rotate(0)} 100%{opacity:0;transform:translateY(380px) rotate(600deg)} }
      `}</style>
    </GameFrame>
  );
}

/* ── Mode picker / exported component ── */
export default function WordleGames() {
  const { t } = useLang();
  const MODES = getModes(t);
  const [selected, setSelected] = useState<string | null>(null);
  const game = getCatalogGame('wordle');
  // Today's results from localStorage. This component only renders in the browser (DailyGames is
  // client-only), and it re-renders when the player comes back from a game.
  const results: Record<string, DayResult | null> = selected
    ? {}
    : Object.fromEntries(MODES.map(m => [m.id, readDayResult(m.id)]));

  if (selected) {
    return <WordleGame modeId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <GameFrame color={game?.color}>
      <GameTopBar />
      <GameBanner
        title={game ? gameText(t, game.nameKey) : t.wordle.title}
        desc={game ? gameText(t, game.descKey) : undefined}
        icon={game?.icon ?? '🟩'}
      />
      <div className="wg-modes">
        {MODES.map(m => (
          <button key={m.id} type="button" className="gx-tile wg-mode" style={{ '--wg': m.color } as React.CSSProperties} onClick={() => setSelected(m.id)}>
            <span className="wg-emoji" aria-hidden="true">{m.emoji}</span>
            <span className="wg-name">{m.label}</span>
            <span className="wg-desc">{m.desc}</span>
            <span className="wg-meta">
              <span>{t.wordle.letters.replace('{n}', String(getTarget(m.id).length))}</span>
              <WordleDayStatus result={results[m.id] ?? null} t={t} />
            </span>
          </button>
        ))}
      </div>
      <style>{`
        .wg-modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .wg-mode {
          display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 14px; text-align: start;
          border-color: color-mix(in srgb, var(--wg) 35%, transparent);
        }
        .wg-emoji { font-size: 26px; line-height: 1; margin-bottom: 6px; filter: drop-shadow(0 2px 10px var(--wg)); }
        .wg-name { font: 800 14px 'Poppins', system-ui, sans-serif; color: #fff; }
        .wg-desc { font-size: 12px; color: #9AA0D0; line-height: 1.3; }
        .wg-meta { margin-top: 8px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; color: #9AA0D0; }
        .wg-status { padding: 2px 8px; border-radius: 999px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(255,255,255,.12); }
        .wg-status.won { color: #2FE39A; border-color: rgba(47,227,154,.45); background: rgba(47,227,154,.12); }
        .wg-status.lost { color: #FF7A90; border-color: rgba(255,84,112,.45); background: rgba(255,84,112,.12); }
      `}</style>
    </GameFrame>
  );
}

function WordleDayStatus({ result, t }: { result: DayResult | null; t: Translations }) {
  if (!result) return <span className="wg-status">{t.wordle.todayNotPlayed}</span>;
  return result.won
    ? <span className="wg-status won">✓ {t.wordle.todaySolved.replace('{n}', String(result.guesses))}</span>
    : <span className="wg-status lost">✗ {t.wordle.todayFailed}</span>;
}
