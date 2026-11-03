'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { useIsClient } from '../../../lib/games/useIsClient';
import { dailyLeaderboardId, utcDayKey } from '../../../lib/gamesCatalog';
import {
  dailySeed, HINTS, LIVES, levelCfg, mulberry, pointsFor, SLOWS, speedDots,
} from '../../../lib/games/shells';
import { shellsTexts, type ShellsTexts } from '../../../lib/games/shellsI18n';
import { useIncomingChallenge } from '../../../lib/share/client';
import GameShell, { useGameShell } from './GameShell';

/* Shells (Skořápky) — port of games-reference/shells.
   The ball shows under a porcelain cup, the cups swap along arcs, tap the right one.
   Levels speed up and add swaps (4 cups from level 6, 5 from level 11). 100 points × streak
   multiplier (max ×5), 3 lives, Slow down (2×) and Hint (1×, half points).
   Two modes: a normal game (random seed, which a challenge link passes on) and the daily
   challenge (seed from the UTC date, the same for everybody; only the first attempt is saved).
   Rules and the server check live in lib/games/shells.ts. */

type Mode = 'normal' | 'daily';
type Phase = 'idle' | 'show' | 'shuffle' | 'choose' | 'reveal' | 'over';
type TextKey = Exclude<keyof ShellsTexts, 'cups'>;
type Msg = { k: TextKey; n?: number; a?: number; b?: number; score?: string } | null;

interface Cup { id: number; slot: number }

interface DailyStore { last: string | null; streak: number; best: Record<string, number>; tried: Record<string, boolean> }

const DAILY_KEY = 'sk-daily';
const SOUND_KEY = 'sk-sound';

function lsGet<T>(key: string, fb: T): T {
  try { const v = localStorage.getItem(key); return v == null ? fb : JSON.parse(v) as T; } catch { return fb; }
}
function lsSet(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}
function readDaily(): DailyStore {
  const d = lsGet<Partial<DailyStore>>(DAILY_KEY, {});
  return { last: d.last ?? null, streak: d.streak ?? 0, best: d.best ?? {}, tried: d.tried ?? {} };
}
function prevDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDayKey(d);
}
function randomSeed(): number {
  try { return crypto.getRandomValues(new Uint32Array(1))[0]; } catch { return Math.floor(Math.random() * 2 ** 32); }
}

export default function Shells() {
  const isClient = useIsClient();
  const [day] = useState(utcDayKey);
  const [mode, setMode] = useState<Mode | null>(null);
  const incoming = useIncomingChallenge();
  const [appliedChallenge, setAppliedChallenge] = useState<string | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);

  // The mode comes from the URL (?mode=daily) or from a friend's challenge, in the browser only
  if (isClient && mode === null) {
    setMode(new URLSearchParams(window.location.search).get('mode') === 'daily' ? 'daily' : 'normal');
  }
  if (incoming && appliedChallenge !== incoming.id) {
    setAppliedChallenge(incoming.id);
    setMode(incoming.board.startsWith('shells_daily') ? 'daily' : 'normal');
  }
  const current: Mode = mode ?? 'normal';
  const challengeSeed = incoming && incoming.board === 'shells' ? incoming.seed : undefined;
  const lbId = current === 'daily' ? dailyLeaderboardId('shells_daily', day) : 'shells';

  return (
    <GameShell gameId="shells" leaderboardId={lbId} onHide={() => pauseRef.current?.()}>
      {isClient && mode !== null
        ? <ShellsGame key={`${current}-${challengeSeed ?? ''}`} mode={current} day={day} challengeSeed={challengeSeed} onMode={setMode} pauseRef={pauseRef} />
        : <div className="sk-placeholder" />}
      <ShellsStyles />
    </GameShell>
  );
}

interface View {
  phase: Phase;
  score: number;
  streak: number;
  lives: number;
  level: number;
  slow: number;
  hint: number;
  slowNext: boolean;
  hintUsed: boolean;
  n: number;
  pill: Msg;
  pillKind: '' | 'ok' | 'bad';
  hintText: Msg;
  shake: number;
  paused: boolean;
  /** Cups lifted (ball visible under them) and the one glowing from the hint. */
  up: number[];
  glow: number | null;
  ballVisible: boolean;
  pickable: boolean;
  over: null | { score: number; level: number; text: Msg; extra: Msg };
}

function ShellsGame({ mode, day, challengeSeed, onMode, pauseRef }: {
  mode: Mode; day: string; challengeSeed?: number;
  onMode: (m: Mode) => void;
  pauseRef: React.RefObject<(() => void) | null>;
}) {
  const { lang } = useLang();
  const tx = shellsTexts(lang);
  const { onGameOver, startRound, best } = useGameShell();

  const tableRef = useRef<HTMLDivElement>(null);
  const cupRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ballRef = useRef<HTMLDivElement>(null);

  const [soundOn, setSoundOn] = useState(() => lsGet(SOUND_KEY, true));
  const [daily, setDaily] = useState(readDaily);

  const initialView = (): View => ({
    phase: 'idle', score: 0, streak: 0, lives: LIVES, level: 1, slow: SLOWS, hint: HINTS, slowNext: false, hintUsed: false,
    n: levelCfg(1).n, pill: mode === 'daily' ? { k: 'dailySame' } : { k: 'ready' }, pillKind: '', hintText: { k: 'memorize' },
    shake: 0, paused: false, up: [], glow: null, ballVisible: false, pickable: false, over: null,
  });
  const [view, setView] = useState<View>(initialView);

  // Mutable game state for the async flow; `view` mirrors it for rendering
  const S = useRef({
    ...initialView(),
    cups: [] as Cup[],
    ballCup: -1,
    rng: Math.random as () => number,
    seed: 0,
    gen: 0,
    firstDaily: false,
    W: 0, H: 0, cw: 90,
  });
  const anims = useRef(new Set<Animation>());
  const latest = useRef({ onGameOver, startRound, soundOn, best });
  useEffect(() => { latest.current = { onGameOver, startRound, soundOn, best }; });

  const sync = (p: Partial<View>) => { Object.assign(S.current, p); setView(v => ({ ...v, ...p })); };

  /* ── sound ── */
  function tone(f: number, d: number, type: OscillatorType = 'sine', vol = 0.08) {
    if (!latest.current.soundOn) return;
    const ac = getGameAudio();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
    } catch {}
  }

  /* ── layout (cups are absolutely positioned; transforms are set directly) ── */
  function slotX(slot: number) { const s = S.current; return (slot + 0.5) * s.W / s.cups.length - s.cw / 2; }
  function baseY() { const s = S.current; return Math.min(s.H * 0.62, s.H - 80) - s.cw * 1.2; }
  function placeCup(c: Cup) {
    const el = cupRefs.current[c.id];
    if (el) el.style.transform = `translate(${slotX(c.slot)}px, ${baseY()}px)`;
  }
  function placeBall() {
    const s = S.current, el = ballRef.current;
    if (!el || s.ballCup < 0) return;
    const c = s.cups[s.ballCup], bs = s.cw * 0.34;
    el.style.width = el.style.height = `${bs}px`;
    el.style.transform = `translate(${slotX(c.slot) + s.cw / 2 - bs / 2}px, ${baseY() + s.cw * 1.2 * 0.88 - bs}px)`;
  }
  function layout() {
    const s = S.current, t = tableRef.current;
    if (!t) return;
    s.W = t.clientWidth; s.H = t.clientHeight;
    const n = s.cups.length || 3;
    s.cw = Math.min(100, (s.W / n) * (n === 3 ? 0.72 : 0.8));
    s.cups.forEach(c => { const el = cupRefs.current[c.id]; if (el) el.style.width = `${s.cw}px`; placeCup(c); });
    placeBall();
  }

  function buildCups(level: number) {
    const n = levelCfg(level).n;
    S.current.cups = Array.from({ length: n }, (_, i) => ({ id: i, slot: i }));
    S.current.ballCup = -1;
    sync({ n, up: [], glow: null, ballVisible: false, pickable: false });
  }

  // New cups are rendered → position them
  useLayoutEffect(() => { layout(); }, [view.n]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── pausable timing (boss key, hidden tab) ── */
  function wait(ms: number, gen: number): Promise<boolean> {
    return new Promise(res => {
      let left = ms, last = performance.now();
      const tick = (now: number) => {
        if (S.current.gen !== gen) { res(false); return; }
        if (!S.current.paused) left -= now - last;
        last = now;
        if (left <= 0) res(true); else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function swap(c1: Cup, c2: Cup, d: number) {
    const x1 = slotX(c1.slot), x2 = slotX(c2.slot), y = baseY();
    const lift = Math.min(70, Math.abs(x2 - x1) * 0.35 + 18);
    const e1 = cupRefs.current[c1.id], e2 = cupRefs.current[c2.id];
    if (!e1 || !e2) return;
    e1.style.zIndex = '2'; e2.style.zIndex = '3';
    const opts: KeyframeAnimationOptions = { duration: d, easing: 'cubic-bezier(.45,.05,.35,1)' };
    const a = e1.animate([
      { transform: `translate(${x1}px,${y}px) scale(1)` },
      { transform: `translate(${(x1 + x2) / 2}px,${y - lift}px) scale(.93)` },
      { transform: `translate(${x2}px,${y}px) scale(1)` }], opts);
    const b = e2.animate([
      { transform: `translate(${x2}px,${y}px) scale(1)` },
      { transform: `translate(${(x1 + x2) / 2}px,${y + lift * 0.35}px) scale(1.06)` },
      { transform: `translate(${x1}px,${y}px) scale(1)` }], opts);
    [a, b].forEach(x => anims.current.add(x));
    if (S.current.paused) { a.pause(); b.pause(); }
    const t = c1.slot; c1.slot = c2.slot; c2.slot = t;
    placeCup(c1); placeCup(c2);
    tone(320 + Math.random() * 60, 0.05, 'triangle', 0.04);
    await Promise.all([a.finished, b.finished]).catch(() => {});
    anims.current.delete(a); anims.current.delete(b);
  }

  /* ── game flow ── */
  /** Seed, random generator and cups of a fresh game (no React state). */
  function resetEngine() {
    const s = S.current;
    s.gen++;
    anims.current.forEach(a => a.cancel()); anims.current.clear();
    s.seed = mode === 'daily' ? dailySeed(day) : (challengeSeed ?? randomSeed());
    s.rng = mulberry(s.seed);
    s.firstDaily = false;
    s.cups = Array.from({ length: levelCfg(1).n }, (_, i) => ({ id: i, slot: i }));
    s.ballCup = -1;
  }

  function newGame() {
    resetEngine();
    sync({ ...initialView(), paused: false });
    layout();
  }

  async function playRound() {
    const s = S.current;
    if (s.phase !== 'idle') return;
    const gen = s.gen;
    getGameAudio(); // created inside the tap so sound is allowed
    const c = levelCfg(s.level);
    if (c.n !== s.cups.length) buildCups(s.level);
    // A game starts with its first round: restart the leaderboard timer, remember the daily try
    if (s.level === 1 && s.score === 0 && s.lives === LIVES) {
      latest.current.startRound();
      if (mode === 'daily') {
        const d = readDaily();
        s.firstDaily = !d.tried[day];
        d.tried = { [day]: true };
        lsSet(DAILY_KEY, d);
        setDaily(d);
      }
    }
    const slow = s.slowNext;
    sync({ phase: 'show', hintUsed: false, up: [], glow: null, slowNext: false, slow: slow ? s.slow - 1 : s.slow });
    const rand = (n: number) => Math.floor(s.rng() * n);
    s.ballCup = rand(s.cups.length);
    placeBall();
    sync({ ballVisible: true, pill: { k: 'ballHere' }, pillKind: '', hintText: { k: 'watch' } });
    if (!(await wait(150, gen))) return;
    sync({ up: [s.ballCup] }); tone(520, 0.15);
    if (!(await wait(1000, gen))) return;
    sync({ up: [] });
    if (!(await wait(380, gen))) return;
    sync({ ballVisible: false, phase: 'shuffle' });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = Math.round(c.dur * (slow ? 1.7 : 1) * (reduce ? 1.4 : 1));
    for (let k = 0; k < c.swaps; k++) {
      while (s.paused) { if (!(await wait(50, gen))) return; }
      if (s.gen !== gen) return;
      sync({ pill: { k: 'shuffling', a: k + 1, b: c.swaps } });
      const a = rand(s.cups.length);
      let b = rand(s.cups.length - 1); if (b >= a) b++;
      const ca = s.cups.find(x => x.slot === a)!, cb = s.cups.find(x => x.slot === b)!;
      await swap(ca, cb, dur);
    }
    if (s.gen !== gen) return;
    sync({ phase: 'choose', pill: { k: 'where' }, hintText: { k: 'tapCup' }, pickable: true });
  }

  async function choose(cupId: number) {
    const s = S.current;
    if (s.phase !== 'choose' || s.paused) return;
    const gen = s.gen;
    const right = cupId === s.ballCup;
    placeBall();
    sync({ pickable: false, phase: 'reveal', ballVisible: true, up: [cupId], glow: null });
    if (right) {
      const gain = pointsFor(s.streak, s.hintUsed);
      const streak = s.streak + 1;
      sync({ score: s.score + gain, streak, level: s.level + 1, pill: { k: 'correct', n: gain }, pillKind: 'ok', hintText: streak >= 2 ? { k: 'streakN', n: streak } : { k: 'great' } });
      tone(660, 0.12); setTimeout(() => tone(880, 0.18), 110);
    } else {
      const lives = s.lives - 1;
      sync({ streak: 0, lives, pill: { k: 'miss' }, pillKind: 'bad', shake: s.shake + 1, hintText: lives > 0 ? { k: 'tryAgain' } : null });
      tone(200, 0.3, 'sawtooth', 0.05);
      if (!(await wait(350, gen))) return;
      sync({ up: [cupId, s.ballCup] });
    }
    if (!(await wait(900, gen))) return;
    if (s.lives <= 0) { gameOver(); return; }
    sync({ up: [] });
    if (!(await wait(300, gen))) return;
    sync({ ballVisible: false, phase: 'idle', hintText: { k: 'memorize' } });
    if (levelCfg(s.level).n !== s.cups.length) { buildCups(s.level); sync({ pill: { k: 'newCup' }, pillKind: 'ok' }); }
    else sync({ pill: { k: 'ready' }, pillKind: '' });
  }

  function showHint() {
    const s = S.current;
    if (s.phase !== 'choose' || s.hint === 0 || s.hintUsed || s.paused) return;
    const gen = s.gen;
    sync({ hint: s.hint - 1, hintUsed: true, glow: s.ballCup, hintText: { k: 'hintUsed' } });
    tone(740, 0.1);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    void wait(reduce ? 900 : 550, gen).then(ok => { if (ok) sync({ glow: null }); });
  }

  function toggleSlow() {
    const s = S.current;
    if (s.phase !== 'idle') return;
    if (s.slowNext) sync({ slowNext: false, hintText: { k: 'memorize' } });
    else if (s.slow > 0) sync({ slowNext: true, hintText: { k: 'slowNext' } });
  }

  function gameOver() {
    const s = S.current;
    const score = s.score, level = s.level, cleared = s.level - 1;
    let text: Msg = null, extra: Msg = null;
    let report = score > 0;
    if (mode === 'daily') {
      const d = readDaily();
      if (d.last !== day) { d.streak = d.last === prevDay(day) ? d.streak + 1 : 1; d.last = day; }
      d.best = { [day]: Math.max(d.best[day] ?? 0, score) };
      lsSet(DAILY_KEY, d);
      setDaily(d);
      text = { k: 'dailyDone', n: d.streak };
      // Only the first daily attempt goes to the leaderboard
      if (!s.firstDaily) { report = false; text = null; extra = { k: 'dailyPractice' }; }
    }
    sync({ phase: 'over', ballVisible: true, pickable: false });
    const { newRecord } = report
      ? latest.current.onGameOver({ score, moves: cleared, seed: mode === 'normal' ? s.seed : undefined })
      : { newRecord: false };
    if (mode === 'normal') {
      const prev = latest.current.best?.score ?? 0;
      text = newRecord ? { k: 'newBest' } : { k: 'yourBest', n: Math.max(prev, score) };
    }
    tone(newRecord ? 880 : 300, 0.25);
    sync({ over: { score, level, text, extra } });
  }

  /* ── pause ── */
  function pause() {
    const s = S.current;
    if (s.paused || (s.phase !== 'show' && s.phase !== 'shuffle' && s.phase !== 'reveal')) return;
    anims.current.forEach(a => a.pause());
    sync({ paused: true });
  }
  function resume() {
    if (!S.current.paused) return;
    anims.current.forEach(a => a.play());
    sync({ paused: false });
  }

  // Engine lifecycle: first game, resize, hidden tab, unmount
  useEffect(() => {
    const s = S.current;
    resetEngine();
    layout();
    const t = tableRef.current!;
    const ro = new ResizeObserver(() => layout());
    ro.observe(t);
    const onVis = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVis);
    pauseRef.current = pause;
    const running = anims.current;
    return () => {
      s.gen++;
      running.forEach(a => a.cancel());
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      pauseRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Space / Enter = start / resume, 1–5 = pick a cup (by position)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      const s = S.current;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (s.paused) { e.preventDefault(); resume(); }
        else if (s.phase === 'idle') { e.preventDefault(); void playRound(); }
        return;
      }
      const k = Number(e.key);
      if (s.phase === 'choose' && k >= 1 && k <= s.cups.length) {
        const cup = s.cups.find(c => c.slot === k - 1);
        if (cup) { e.preventDefault(); void choose(cup.id); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    lsSet(SOUND_KEY, next);
    latest.current.soundOn = next;
    if (next) tone(660, 0.12);
  }

  /* ── render ── */
  const say = (m: Msg) => {
    if (!m) return '';
    return tx[m.k]
      .replace('{n}', m.n !== undefined ? m.n.toLocaleString(lang) : '')
      .replace('{a}', String(m.a ?? '')).replace('{b}', String(m.b ?? ''))
      .replace('{score}', m.score ?? '');
  };
  const cfg = levelCfg(view.level);
  const dots = speedDots(view.level);
  const mult = Math.min(5, 1 + view.streak);
  const dailyStreak = daily.last === day || daily.last === prevDay(day) ? daily.streak : 0;
  const todayBest = daily.best[day];
  const busy = view.phase !== 'idle' && view.phase !== 'over';

  return (
    <div className="sk">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="sk-porc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#B9AE9B" /><stop offset=".32" stopColor="#FCFAF5" /><stop offset=".62" stopColor="#EDE6D9" /><stop offset="1" stopColor="#A89C87" />
          </linearGradient>
          <linearGradient id="sk-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9C7428" /><stop offset=".35" stopColor="#F3CF7E" /><stop offset=".7" stopColor="#D9A544" /><stop offset="1" stopColor="#8A6420" />
          </linearGradient>
          <symbol id="sk-cup" viewBox="0 0 100 120">
            <ellipse cx="50" cy="112" rx="46" ry="7" fill="rgba(0,0,0,.35)" />
            <path d="M20 8 Q20 4 25 4 L75 4 Q80 4 80 8 L93 98 Q94 106 86 106 L14 106 Q6 106 7 98 Z" fill="url(#sk-porc)" />
            <path d="M8.6 90 L91.4 90 L92.4 97 L7.6 97 Z" fill="url(#sk-gold)" />
            <path d="M30 12 L26 86" stroke="rgba(255,255,255,.75)" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="50" cy="6" rx="26" ry="3" fill="rgba(255,255,255,.55)" />
            <circle cx="50" cy="50" r="13" fill="none" stroke="#2C7D6B" strokeWidth="2.5" opacity=".55" />
            <path d="M50 40 L53 47 L60 50 L53 53 L50 60 L47 53 L40 50 L47 47 Z" fill="#2C7D6B" opacity=".55" />
          </symbol>
        </defs>
      </svg>

      <div className="sk-modes" role="tablist">
        {(['normal', 'daily'] as Mode[]).map(m => (
          <button
            key={m} type="button" role="tab" aria-selected={mode === m} className={`sk-mode${mode === m ? ' is-on' : ''}`}
            disabled={busy} onClick={() => { if (m !== mode) onMode(m); }}
          >
            {m === 'daily' ? `📅 ${tx.daily}` : `🥜 ${tx.regular}`}
          </button>
        ))}
        <button type="button" className="sk-snd" aria-pressed={soundOn} aria-label={tx.sound} onClick={toggleSound}>
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      <p className="sk-sub">
        {mode === 'daily' ? `${tx.daily} · ` : ''}{tx.level.replace('{n}', String(view.level))} · {tx.cups[cfg.n - 3]}
      </p>

      <div className="sk-hud" role="group">
        <div className="sk-stat"><span className="sk-lab">{tx.score}</span><span className="sk-val">{view.score.toLocaleString(lang)}</span></div>
        <div className="sk-stat"><span className="sk-lab">{tx.streak}</span><span className="sk-val sk-gold">×{mult}</span></div>
        <div className="sk-stat">
          <span className="sk-lab">{tx.lives}</span>
          <span className="sk-hearts" role="img" aria-label={`${view.lives}/${LIVES}`}>
            {Array.from({ length: LIVES }, (_, i) => (
              <svg key={i} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"
                  fill={i < view.lives ? '#E8735A' : 'none'} stroke={i < view.lives ? 'none' : '#6E8F87'} strokeWidth="1.8" />
              </svg>
            ))}
          </span>
        </div>
      </div>

      <div className={`sk-table${view.shake % 2 ? ' sk-shake-a' : view.shake ? ' sk-shake-b' : ''}`} ref={tableRef}>
        <svg className="sk-medal" viewBox="0 0 300 300" aria-hidden="true">
          <circle cx="150" cy="150" r="140" fill="none" stroke="#E2B04A" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="128" fill="none" stroke="#E2B04A" strokeDasharray="2 6" />
          <circle cx="150" cy="150" r="96" fill="none" stroke="#E2B04A" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="60" fill="none" stroke="#E2B04A" />
          <path d="M150 98 L162 138 L202 150 L162 162 L150 202 L138 162 L98 150 L138 138 Z" fill="none" stroke="#E2B04A" strokeWidth="1.5" />
          <path d="M150 118 L156 144 L182 150 L156 156 L150 182 L144 156 L118 150 L144 144 Z" fill="#E2B04A" opacity=".5" />
        </svg>
        <div className={`sk-pill${view.pillKind ? ` ${view.pillKind}` : ''}`} role="status" aria-live="polite"><i />{say(view.pill)}</div>

        <div className="sk-cups">
          <div className="sk-ball" ref={ballRef} hidden={!view.ballVisible} />
          {Array.from({ length: view.n }, (_, id) => (
            <button
              key={id} type="button" ref={el => { cupRefs.current[id] = el; }}
              className={`sk-cup${view.up.includes(id) ? ' up' : ''}${view.glow === id ? ' glow' : ''}${view.pickable ? ' pickable' : ''}`}
              disabled={!view.pickable} aria-label={tx.cupLabel.replace('{n}', String(id + 1))}
              onClick={() => void choose(id)}
            >
              <span className="sk-body"><svg viewBox="0 0 100 120" aria-hidden="true"><use href="#sk-cup" /></svg></span>
            </button>
          ))}
        </div>

        <div className="sk-speed">
          <span className="sk-lab">{tx.speed}</span>
          <div className="sk-dots" role="img" aria-label={`${dots}/5`}>
            {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < dots ? 'on' : ''} />)}
          </div>
        </div>

        {view.paused && (
          <div className="sk-over">
            <div className="sk-card">
              <h2>{tx.paused}</h2>
              <button type="button" className="sk-go" onClick={resume}>{tx.resume}</button>
            </div>
          </div>
        )}

        {view.over && (
          <div className="sk-over">
            <div className="sk-card">
              <h2>{mode === 'daily' ? tx.daily : tx.overTitle}</h2>
              <span className="sk-lab">{tx.score}</span>
              <span className="sk-big">{view.over.score.toLocaleString(lang)}</span>
              <p>{tx.overLevel.replace('{n}', String(view.over.level))} {say(view.over.text)}</p>
              {view.over.extra && <p className="sk-note">{say(view.over.extra)}</p>}
              <button type="button" className="sk-go" onClick={newGame}>{tx.again}</button>
              <button type="button" className="sk-ghost" onClick={() => onMode(mode === 'daily' ? 'normal' : 'daily')}>
                {mode === 'daily' ? tx.regular : tx.daily}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="sk-hint">{say(view.hintText)}</p>

      <div className="sk-dock">
        <button type="button" className="sk-tool" aria-pressed={view.slowNext} onClick={toggleSlow}
          disabled={view.phase !== 'idle' || (view.slow === 0 && !view.slowNext)}>
          ⏱ {tx.slow} <span className="sk-badge">{view.slow}</span>
        </button>
        <button type="button" className="sk-go" onClick={() => void playRound()} disabled={view.phase !== 'idle'}>
          {view.level === 1 && view.score === 0 && view.lives === LIVES ? tx.start : tx.nextRound}
        </button>
        <button type="button" className="sk-tool" onClick={showHint}
          disabled={view.phase !== 'choose' || view.hint === 0 || view.hintUsed}>
          👁 {tx.hint} <span className="sk-badge">{view.hint}</span>
        </button>
      </div>

      <button type="button" className="sk-daily" disabled={busy} onClick={() => onMode('daily')}
        style={{ '--sk-daily-on': mode === 'daily' ? 1 : 0 } as CSSProperties}>
        <b>📅 {tx.daily}</b>
        <span>{todayBest !== undefined
          ? say({ k: 'dailyToday', score: todayBest.toLocaleString(lang), n: dailyStreak })
          : tx.dailyStreak.replace('{n}', String(dailyStreak))}</span>
      </button>
    </div>
  );
}

function ShellsStyles() {
  return (
    <style>{`
      .sk-placeholder { min-height: 620px; }
      .sk {
        --felt1: #2C7D6B; --felt2: #1E5E51; --felt3: #123C35; --ink: #F3EEE4; --muted: #A9C3BB; --soft: #CFE0DA;
        --gold: #E2B04A; --gold-hi: #F3CF7E; --coral: #E8735A; --mint: #7FD3B2;
        display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 20px; color: var(--ink);
        background: #0E2321; border: 1px solid rgba(226,176,74,.25);
        -webkit-tap-highlight-color: transparent;
      }
      .sk-modes { display: flex; gap: 8px; align-items: center; }
      .sk-mode {
        flex: 1; min-height: 40px; border-radius: 12px; border: none; cursor: pointer; padding: 0 8px;
        background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); color: var(--soft);
        font: 700 13px 'Poppins', sans-serif;
      }
      .sk-mode.is-on { background: rgba(226,176,74,.2); box-shadow: inset 0 0 0 1.5px var(--gold); color: var(--ink); }
      .sk-mode:disabled { cursor: default; opacity: .6; }
      .sk-mode.is-on:disabled { opacity: 1; }
      .sk-snd {
        width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px; border: none; cursor: pointer; font-size: 18px;
        background: rgba(255,255,255,.07);
      }
      .sk-snd[aria-pressed="true"] { background: rgba(226,176,74,.22); }
      .sk-sub { margin: 0; text-align: center; font-size: 13px; font-weight: 700; color: var(--muted); }
      .sk-hud {
        border-radius: 18px; padding: 10px 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
        background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1);
      }
      .sk-stat { display: flex; flex-direction: column; gap: 2px; }
      .sk-stat:nth-child(2) { align-items: center; }
      .sk-stat:nth-child(3) { align-items: flex-end; }
      .sk-lab { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 700; }
      .sk-val { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .sk-gold { color: var(--gold-hi); }
      .sk-hearts { display: flex; gap: 4px; height: 28px; align-items: center; }
      .sk-table {
        position: relative; height: clamp(300px, 52vh, 420px); border-radius: 26px; overflow: hidden;
        background: radial-gradient(120% 90% at 50% 42%, var(--felt1) 0%, var(--felt2) 52%, var(--felt3) 100%);
        box-shadow: inset 0 0 0 1px rgba(226,176,74,.45), inset 0 0 0 7px rgba(0,0,0,.18), inset 0 24px 60px rgba(0,0,0,.35);
      }
      .sk-table::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background-image: repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,.06) 0 2px, transparent 2px 6px);
      }
      .sk-medal { position: absolute; left: 50%; top: 44%; width: min(300px, 80%); transform: translate(-50%, -50%); opacity: .3; pointer-events: none; }
      .sk-pill {
        position: absolute; top: 14px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px;
        white-space: nowrap; max-width: calc(100% - 24px); overflow: hidden; text-overflow: ellipsis;
        padding: 8px 14px; border-radius: 999px; background: rgba(8,26,23,.6); box-shadow: inset 0 0 0 1px rgba(226,176,74,.35);
        font-size: 14px; font-weight: 700; z-index: 5;
      }
      .sk-pill i { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--gold-hi); box-shadow: 0 0 10px var(--gold-hi); }
      .sk-pill.ok i { background: var(--mint); box-shadow: 0 0 10px var(--mint); }
      .sk-pill.bad i { background: var(--coral); box-shadow: 0 0 10px var(--coral); }
      .sk-cups { position: absolute; inset: 0; direction: ltr; }
      .sk-cup { position: absolute; left: 0; top: 0; padding: 0; border: none; background: none; z-index: 2; touch-action: manipulation; cursor: pointer; }
      .sk-cup:disabled { cursor: default; }
      .sk-body { display: block; transition: transform .32s cubic-bezier(.3,.7,.3,1.2), filter .2s; }
      .sk-cup.up .sk-body { transform: translateY(-62%) rotate(-4deg); }
      .sk-cup.glow .sk-body { filter: drop-shadow(0 0 14px var(--gold-hi)) drop-shadow(0 0 4px var(--gold-hi)); }
      .sk-cup.pickable:hover .sk-body { transform: translateY(-6px); }
      .sk-cup svg { display: block; width: 100%; height: auto; overflow: visible; }
      .sk-ball {
        position: absolute; left: 0; top: 0; border-radius: 50%; z-index: 1; pointer-events: none;
        background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #F4EEDF 30%, #D8CDB4 70%, #A99B7E 100%);
        box-shadow: 0 4px 6px rgba(0,0,0,.35), 0 0 18px rgba(243,207,126,.45);
      }
      .sk-ball[hidden] { display: none; }
      .sk-speed { position: absolute; left: 0; right: 0; bottom: 16px; display: flex; justify-content: center; align-items: center; gap: 10px; z-index: 4; }
      .sk-speed .sk-lab { color: var(--soft); }
      .sk-dots { display: flex; gap: 5px; }
      .sk-dots span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,.2); }
      .sk-dots span.on { background: var(--gold-hi); }
      .sk-hint { margin: 0; text-align: center; font-size: 15px; color: var(--soft); min-height: 20px; }
      .sk-dock { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1fr); gap: 8px; }
      .sk-tool {
        min-height: 54px; border: none; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 6px;
        font: 700 13px 'Poppins', sans-serif; color: var(--ink); cursor: pointer; padding: 0 6px; flex-wrap: wrap;
        background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1);
      }
      .sk-tool:disabled { opacity: .4; cursor: default; }
      .sk-tool[aria-pressed="true"] { background: rgba(226,176,74,.2); box-shadow: inset 0 0 0 1.5px var(--gold); }
      .sk-badge {
        min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: var(--gold); color: #0E2321;
        font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center;
      }
      .sk-go {
        min-height: 54px; border: none; border-radius: 16px; cursor: pointer; color: #1D1608;
        background: linear-gradient(180deg, var(--gold-hi), var(--gold)); font: 800 16px 'Poppins', sans-serif;
        box-shadow: 0 6px 18px rgba(226,176,74,.25); padding: 0 10px;
      }
      .sk-go:disabled { opacity: .45; cursor: default; box-shadow: none; }
      .sk-daily {
        display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 48px; padding: 8px 14px;
        border: none; border-radius: 16px; cursor: pointer; color: var(--ink); text-align: start;
        background: rgba(226,176,74,.12); box-shadow: inset 0 0 0 1px rgba(226,176,74,.35);
      }
      .sk-daily:disabled { cursor: default; }
      .sk-daily b { font-size: 14px; }
      .sk-daily span { font-size: 13px; font-weight: 700; color: var(--gold-hi); text-align: end; }
      .sk-over {
        position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 18px;
        background: rgba(8,26,23,.72); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      }
      .sk-card {
        width: 100%; max-width: 300px; border-radius: 22px; padding: 20px 18px; display: flex; flex-direction: column; align-items: center; gap: 8px;
        text-align: center; background: linear-gradient(180deg, #183F37, #10302A);
        box-shadow: inset 0 0 0 1px rgba(226,176,74,.45), 0 20px 50px rgba(0,0,0,.4);
      }
      .sk-card h2 { margin: 0; font: 800 24px 'Poppins', sans-serif; }
      .sk-card p { margin: 0; color: var(--soft); line-height: 1.45; font-size: 14px; }
      .sk-card .sk-note { font-size: 12px; color: var(--muted); }
      .sk-big { font-size: 42px; font-weight: 800; color: var(--gold-hi); font-variant-numeric: tabular-nums; line-height: 1; }
      .sk-card .sk-go { width: 100%; margin-top: 4px; }
      .sk-ghost {
        min-height: 44px; width: 100%; border: none; border-radius: 14px; cursor: pointer; color: var(--ink); font-weight: 700;
        background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1);
      }
      .sk-shake-a { animation: skShakeA .4s; }
      .sk-shake-b { animation: skShakeB .4s; }
      @keyframes skShakeA { 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
      @keyframes skShakeB { 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
      @media (prefers-reduced-motion: reduce) { .sk-body { transition: none; } .sk-shake-a, .sk-shake-b { animation: none; } }
      @media (max-width: 380px) { .sk-tool { font-size: 12px; } .sk-mode { font-size: 12px; } }
    `}</style>
  );
}
