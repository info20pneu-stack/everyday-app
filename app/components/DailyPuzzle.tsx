'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../../lib/LanguageContext';
import { getDailyPuzzleWords } from '../../lib/dailyPuzzleWords';
import { recordGameCompleted } from '../../lib/streak';
import { PUZZLE_MAX, PUZZLE_STATE_KEY, PUZZLE_STATS_KEY, puzzleDayIndex } from '../../lib/dailyTrio';
import { type TileState, evaluate, Confetti } from './WordleGames';
import GameShell from './games/GameShell';
import { WordleBoard, WordleKeyboard, WordleStatsBar } from './games/WordleBoard';

const MAX = PUZZLE_MAX;
const WORD_LEN = 5;
const STATE_KEY = PUZZLE_STATE_KEY;
const STATS_KEY = PUZZLE_STATS_KEY;

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

const utcDayIndex = () => puzzleDayIndex();

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
  const [statsOpen, setStatsOpen] = useState(false);

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
    const fn = (e: KeyboardEvent) => {
      if (statsOpen) { if (e.key === 'Escape') setStatsOpen(false); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return;
      handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleKey, statsOpen]);

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

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  const maxDist = Math.max(1, ...stats.distribution);
  const tp = t.dailyPuzzle;

  return (
    <GameShell
      gameId="daily-puzzle"
      title={<>{tp.title} <span className="dp-num">#{puzzleNum}</span></>}
    >
      {!mounted ? <div className="dp-placeholder" /> : (
        <div className="dp-app">
          <div className="wb-toast" role="status" aria-live="polite">{message && <span>{message}</span>}</div>

          <div style={{ position: 'relative' }}>
            {phase === 'won' && <Confetti />}
            <WordleBoard
              guesses={guesses} evals={evals} current={current} revealed={revealed}
              max={MAX} len={WORD_LEN} playing={phase === 'playing'} shake={shake}
            />
          </div>

          <WordleKeyboard
            keyColors={keyColors} onKey={handleKey}
            enterLabel={t.wordle.keyboard_enter} backLabel={t.wordle.keyboard_backspace}
          />

          {(phase === 'won' || phase === 'lost') && (
            <div className="dp-end">
              <button type="button" className="gx-btn gx-primary" onClick={share}>
                {copied ? tp.copied : tp.shareResult}
              </button>
              <div className="dp-next">
                {tp.nextPuzzleIn} <b className="tabular-nums">{countdown}</b>
                {phase === 'lost' ? ` · ${tp.answer.replace('{word}', target)}` : ''}
              </div>
            </div>
          )}

          <WordleStatsBar
            items={[
              { label: tp.played, value: stats.played },
              { label: tp.winRate, value: `${winRate}%` },
              { label: tp.currentStreak, value: stats.currentStreak },
              { label: tp.maxStreak, value: stats.bestStreak },
            ]}
            onOpen={() => setStatsOpen(true)} openLabel={tp.statsTitle}
          />
        </div>
      )}

      {statsOpen && createPortal(
        <div className="gs-overlay" onClick={e => { if (e.target === e.currentTarget) setStatsOpen(false); }}>
          <div className="gs-modal" role="dialog" aria-modal="true" aria-label={tp.statsTitle}>
            <div className="gs-modal-head">
              <span>📊 {tp.statsTitle}</span>
              <button type="button" className="gs-close" onClick={() => setStatsOpen(false)} aria-label={t.games.close}>✕</button>
            </div>
            <div className="dp-modal-stats">
              <StatBox value={stats.played} label={tp.played} />
              <StatBox value={`${winRate}%`} label={tp.winRate} />
              <StatBox value={stats.currentStreak} label={tp.currentStreak} />
              <StatBox value={stats.bestStreak} label={tp.maxStreak} />
            </div>
            <div className="dp-dist-title">{tp.distribution}</div>
            <div className="dp-dist">
              {stats.distribution.map((count, i) => (
                <div key={i} className="dp-dist-row">
                  <span>{i + 1}</span>
                  <div className="dp-dist-track">
                    <div className="dp-dist-bar" style={{ width: `${(count / maxDist) * 100}%`, minWidth: count > 0 ? '22px' : 0 }}>
                      {count > 0 && <b>{count}</b>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}

      <style>{`
        .dp-placeholder { min-height: 560px; }
        .dp-num { color: #2FE39A; text-shadow: 0 0 16px rgba(47,227,154,.6); }
        .dp-app { display: flex; flex-direction: column; gap: 14px; }
        .dp-end { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
        .dp-next { font-size: 12px; color: var(--text3); }
        .dp-next b { color: #fff; }
        .dp-modal-stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px; margin: 14px 0; }
        .dp-dist-title { font-size: 12px; color: #9AA0D0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
        .dp-dist { display: flex; flex-direction: column; gap: 6px; }
        .dp-dist-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9AA0D0; }
        .dp-dist-row > span { width: 12px; text-align: center; }
        .dp-dist-track { flex: 1; height: 20px; border-radius: 6px; background: rgba(255,255,255,0.05); overflow: hidden; }
        .dp-dist-bar {
          height: 100%; border-radius: 6px; display: flex; align-items: center; justify-content: flex-end; padding-right: 6px;
          background: linear-gradient(90deg, #17B978, #4CF0AE); box-shadow: 0 0 12px rgba(47,227,154,.45);
        }
        .dp-dist-bar b { font-size: 12px; color: #04261A; }
        .dp-dist-bar:empty { padding: 0; box-shadow: none; }
      `}</style>
    </GameShell>
  );
}

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#9AA0D0', lineHeight: 1.25 }}>{label}</div>
    </div>
  );
}
