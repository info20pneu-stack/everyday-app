'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { getDailyPuzzleWords } from '../../lib/dailyPuzzleWords';
import { recordGameCompleted } from '../../lib/streak';
import {
  type TileState, evaluate, tileBg, tileBorder, KB_ROWS, Confetti,
} from './WordleGames';

const MAX = 6;
const WORD_LEN = 5;
const PUZZLE_COLOR = '#538d4e';
const PUZZLE_EPOCH_UTC = Date.UTC(2026, 0, 1); // Puzzle #1

const STATE_KEY = 'daily_puzzle_state_v1';
const STATS_KEY = 'daily_puzzle_stats_v1';

type Phase = 'playing' | 'won' | 'lost';
type PuzzleState = { puzzleNum: number; lang: string; guesses: string[]; phase: Phase };
type PuzzleStats = {
  played: number; wins: number; currentStreak: number; bestStreak: number;
  lastPuzzleNum: number; distribution: number[];
};

const DEFAULT_STATS: PuzzleStats = {
  played: 0, wins: 0, currentStreak: 0, bestStreak: 0, lastPuzzleNum: 0,
  distribution: [0, 0, 0, 0, 0, 0],
};

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function utcDayIndex(): number {
  return Math.floor((Date.now() - PUZZLE_EPOCH_UTC) / 86400000);
}

function msUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DailyPuzzle() {
  const { t, lang } = useLang();

  const dayIndex = useMemo(() => utcDayIndex(), []);
  const puzzleNum = dayIndex + 1;
  const words = useMemo(() => getDailyPuzzleWords(lang), [lang]);
  const target = useMemo(() => words[((dayIndex % words.length) + words.length) % words.length].toUpperCase(), [words, dayIndex]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [evals, setEvals] = useState<TileState[][]>([]);
  const [current, setCurrent] = useState('');
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState<Phase>('playing');
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<PuzzleStats>(DEFAULT_STATS);
  const [countdown, setCountdown] = useState('');
  const [mounted, setMounted] = useState(false);

  /* Restore today's puzzle progress + stats on mount */
  useEffect(() => {
    setMounted(true);
    const stored = lsGet<PuzzleState | null>(STATE_KEY, null);
    if (stored && stored.puzzleNum === puzzleNum && stored.lang === lang) {
      const evs = stored.guesses.map(g => evaluate(g, target));
      setGuesses(stored.guesses);
      setEvals(evs);
      setPhase(stored.phase);
      setRevealed(new Set(evs.flatMap((row, ri) => row.map((_, ci) => `${ri}-${ci}`))));
    }
    setStats(lsGet<PuzzleStats>(STATS_KEY, DEFAULT_STATS));
  }, [puzzleNum, lang, target]);

  /* Countdown to next puzzle */
  useEffect(() => {
    const tick = () => setCountdown(fmtCountdown(msUntilNextUtcMidnight()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const keyColors: Record<string, TileState> = {};
  evals.forEach((row, ri) => {
    row.forEach((s, ci) => {
      const k = guesses[ri]?.[ci];
      if (!k) return;
      const prev = keyColors[k];
      if (!prev || s === 'correct' || (s === 'present' && prev === 'absent')) keyColors[k] = s;
    });
  });

  function showMsg(msg: string, ms = 2000) {
    setMessage(msg);
    setTimeout(() => setMessage(''), ms);
  }

  function persistState(nextGuesses: string[], nextPhase: Phase) {
    lsSet(STATE_KEY, { puzzleNum, lang, guesses: nextGuesses, phase: nextPhase });
  }

  function finishPuzzle(won: boolean, attempts: number) {
    const prev = lsGet<PuzzleStats>(STATS_KEY, DEFAULT_STATS);
    const isConsecutive = prev.lastPuzzleNum === puzzleNum - 1;
    const currentStreak = won ? (isConsecutive ? prev.currentStreak + 1 : 1) : 0;
    const distribution = [...prev.distribution];
    if (won) distribution[attempts - 1] += 1;
    const next: PuzzleStats = {
      played: prev.played + 1,
      wins: prev.wins + (won ? 1 : 0),
      currentStreak,
      bestStreak: Math.max(prev.bestStreak, currentStreak),
      lastPuzzleNum: puzzleNum,
      distribution,
    };
    lsSet(STATS_KEY, next);
    setStats(next);
    recordGameCompleted();
  }

  const submit = useCallback(() => {
    if (animating || phase !== 'playing') return;
    if (current.length < WORD_LEN) {
      setShake(true); setTimeout(() => setShake(false), 500);
      showMsg(t.dailyPuzzle.notEnoughLetters); return;
    }
    const guess = current.toUpperCase();
    const ev = evaluate(guess, target);
    const rowIdx = guesses.length;
    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setEvals(e => [...e, ev]);
    setCurrent('');
    setAnimating(true);

    for (let i = 0; i < WORD_LEN; i++) {
      setTimeout(() => {
        setRevealed(r => new Set([...r, `${rowIdx}-${i}`]));
      }, i * 300 + 250);
    }

    setTimeout(() => {
      setAnimating(false);
      if (ev.every(s => s === 'correct')) {
        setPhase('won');
        const msgs = [t.dailyPuzzle.genius, t.dailyPuzzle.magnificent, t.dailyPuzzle.impressive, t.dailyPuzzle.splendid, t.dailyPuzzle.great, t.dailyPuzzle.phew];
        showMsg(msgs[rowIdx] ?? '🎉', 3000);
        persistState(nextGuesses, 'won');
        finishPuzzle(true, rowIdx + 1);
      } else if (rowIdx + 1 >= MAX) {
        setPhase('lost');
        showMsg(target, 5000);
        persistState(nextGuesses, 'lost');
        finishPuzzle(false, MAX);
      } else {
        persistState(nextGuesses, 'playing');
      }
    }, WORD_LEN * 300 + 400);
  }, [animating, current, guesses, target, phase, puzzleNum, lang, t]);

  const handleKey = useCallback((k: string) => {
    if (phase !== 'playing' || animating) return;
    if (k === '⌫' || k === 'BACKSPACE') { setCurrent(c => c.slice(0, -1)); return; }
    if (k === 'ENTER') { submit(); return; }
    if (/^[A-Z]$/.test(k) && current.length < WORD_LEN) setCurrent(c => c + k);
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
    const result = phase === 'won' ? `${evals.length}/${MAX}` : `X/${MAX}`;
    const text = `🧩 EVERY DAY – ${t.dailyPuzzle.title} #${puzzleNum}\n${result}\n\n${buildGrid()}\neveryday1234567.com`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  }

  if (!mounted) return null;

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  const maxDist = Math.max(1, ...stats.distribution);

  return (
    <div className="card" style={{
      background: `linear-gradient(145deg, rgba(83,141,78,0.14), rgba(15,20,40,0.94))`,
      border: `1px solid ${PUZZLE_COLOR}55`,
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: `var(--card-shadow), 0 0 32px ${PUZZLE_COLOR}22`,
      marginBottom: '1.25rem',
      animation: 'widgetIn 0.4s ease both',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '22px' }}>🧩</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: '800', color: '#fff' }}>
            {t.dailyPuzzle.title} <span style={{ color: PUZZLE_COLOR, fontWeight: '700' }}>#{puzzleNum}</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text3)' }}>{t.dailyPuzzle.subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
          <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 8px', color: '#FFB300' }}>🔥 {stats.currentStreak}</span>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div style={{
          textAlign: 'center', marginBottom: '8px',
          background: 'rgba(255,255,255,0.92)', color: '#111',
          borderRadius: '8px', padding: '7px 16px',
          fontWeight: '700', fontSize: '13px',
          animation: 'dpToast 0.18s ease',
        }}>{message}</div>
      )}

      {/* Grid */}
      <div style={{ position: 'relative' }}>
        {phase === 'won' && <Confetti />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', marginBottom: '14px' }}>
          {Array.from({ length: MAX }, (_, row) => {
            const isCur = row === guesses.length && phase === 'playing';
            const letters = row < guesses.length
              ? guesses[row].split('')
              : isCur
                ? [...current.split(''), ...Array(WORD_LEN - current.length).fill('')]
                : Array(WORD_LEN).fill('');

            return (
              <div key={row} style={{
                display: 'flex', gap: '5px',
                animation: isCur && shake ? 'dpShake 0.4s ease' : 'none',
              }}>
                {letters.map((ch, col) => {
                  const isRev = revealed.has(`${row}-${col}`);
                  const evalState: TileState | undefined = (row < guesses.length && isRev) ? evals[row]?.[col] : undefined;
                  const state: TileState = evalState ?? (ch ? (row < guesses.length ? 'absent' : 'typed') : 'empty');
                  const isFlipping = row < guesses.length && !isRev;

                  return (
                    <div key={col} style={{
                      width: '48px', height: '48px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Poppins', fontSize: '20px', fontWeight: '800', color: '#fff',
                      background: tileBg(evalState ?? state, PUZZLE_COLOR),
                      border: tileBorder(state, PUZZLE_COLOR),
                      borderRadius: '6px',
                      animation: isFlipping
                        ? `dpFlipDown 0.25s ease-in ${col * 0.3}s both, dpFlipUp 0.25s ease-out ${col * 0.3 + 0.25}s both`
                        : (state === 'typed' && ch ? 'dpPop 0.1s ease' : 'none'),
                    }}>
                      {ch}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', marginBottom: '12px' }}>
        {KB_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '4px' }}>
            {row.map(key => {
              const kc = keyColors[key];
              const bg = kc === 'correct' ? PUZZLE_COLOR : kc === 'present' ? '#b59f3b' : kc === 'absent' ? '#3a3a3c' : 'rgba(255,255,255,0.12)';
              return (
                <button key={key} onClick={() => handleKey(key)} style={{
                  height: '42px', width: (key === 'ENTER' || key === '⌫') ? '54px' : '30px',
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: bg, color: '#fff',
                  fontSize: key.length > 1 ? '10px' : '13px',
                  fontWeight: '700', fontFamily: 'Poppins',
                }}>{key === 'ENTER' ? t.wordle.keyboard_enter : key === '⌫' ? t.wordle.keyboard_backspace : key}</button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Win/lose actions */}
      {(phase === 'won' || phase === 'lost') && (
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <button onClick={share} style={{
            background: copied ? `${PUZZLE_COLOR}33` : 'rgba(255,255,255,0.07)',
            border: copied ? `1px solid ${PUZZLE_COLOR}77` : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', color: copied ? PUZZLE_COLOR : '#fff',
            fontSize: '13px', fontWeight: '600',
            padding: '9px 22px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? t.dailyPuzzle.copied : t.dailyPuzzle.shareResult}
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
            {t.dailyPuzzle.nextPuzzleIn} <span style={{ fontFamily: 'monospace', color: '#fff' }}>{countdown}</span>
            {phase === 'lost' ? ` · ${t.dailyPuzzle.answer.replace('{word}', target)}` : ''}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats.played > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {t.dailyPuzzle.statsTitle}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
            <StatBox value={stats.played} label={t.dailyPuzzle.played} />
            <StatBox value={`${winRate}%`} label={t.dailyPuzzle.winRate} />
            <StatBox value={stats.currentStreak} label={t.dailyPuzzle.currentStreak} />
            <StatBox value={stats.bestStreak} label={t.dailyPuzzle.maxStreak} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px' }}>{t.dailyPuzzle.distribution}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {stats.distribution.map((count, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', width: '10px' }}>{i + 1}</span>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', height: '14px' }}>
                  <div style={{
                    width: `${(count / maxDist) * 100}%`, minWidth: count > 0 ? '14px' : 0,
                    background: PUZZLE_COLOR, height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '4px',
                  }}>
                    {count > 0 && <span style={{ fontSize: '9px', color: '#fff', fontWeight: '700' }}>{count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dpFlipDown { from{transform:scaleY(1)} to{transform:scaleY(0)} }
        @keyframes dpFlipUp   { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes dpPop      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.14)} }
        @keyframes dpShake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes dpToast    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '700', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '9.5px', color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}
