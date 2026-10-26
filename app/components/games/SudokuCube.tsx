'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties,
} from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { useIsClient } from '../../../lib/games/useIsClient';
import { recordGameCompleted } from '../../../lib/streak';
import { dailyVariantLeaderboardId, formatTimeMs, utcDayKey } from '../../../lib/gamesCatalog';
import type { StoredBest } from '../../../lib/personalBest';
import {
  CUBE_LEVELS, FACE_LETTERS, cubeBestKey, cubeLayout, cubeStateKey, generateCube, hasConflict,
  isCubeLevel, isCubeSolved, isFaceDone, type CubeLevel, type CubePuzzle,
} from '../../../lib/games/sudokuCube';
import GameShell, { useGameShell } from './GameShell';

/* Sudoku Cube — port of games-reference/sudoku-cube (engine in lib/games/sudokuCube.ts).
   A CSS 3D cube that turns freely when dragged and snaps to the nearest face on release; arrow
   buttons / keys turn it by 90°. Three levels, each with its own light colour:
     easy (blue)  six 4×4 sudoku · mid (green) bands 1–8 · hard (red) bands 1–16.
   Tapping a cell lights up its rows / bands, conflicts turn yellow, each face gets a split time.
   One daily cube per level (UTC seed). Only the first daily attempt counts: it goes to that
   level's daily board and the personal record. Progress is saved, the clock keeps running while
   away (pauses only for the boss key). The hard level is generated in a Web Worker. */

const SHARE_URL = 'https://www.everyday1234567.com/games/sudoku-cube';
const LEVEL_KEY = 'sc-level';
const STORE_EVENT = 'everyday-sc-change';

const LEVEL_COLOR: Record<CubeLevel, { hex: string; rgb: string; light: string }> = {
  easy: { hex: '#40AAFF', rgb: '64,170,255', light: '#A9DBFF' },
  mid: { hex: '#39FF6A', rgb: '57,255,106', light: '#B6FF8F' },
  hard: { hex: '#FF4058', rgb: '255,64,88', light: '#FFA3AE' },
};
const LEVEL_SQUARE: Record<CubeLevel, string> = { easy: '🟦', mid: '🟩', hard: '🟥' };

/* ── localStorage helpers ── */
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v == null ? null : JSON.parse(v) as T; } catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  window.dispatchEvent(new Event(STORE_EVENT));
}
function subscribeStore(cb: () => void) {
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(STORE_EVENT, cb); window.removeEventListener('storage', cb); };
}
function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribeStore,
    () => { try { return localStorage.getItem(key); } catch { return null; } },
    () => null,
  );
}

function tone(freq: number, dur: number, vol = 0.1) {
  const ac = getGameAudio();
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur + 0.08);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur + 0.1);
  } catch {}
}

/** mm:ss.ff while running and for split times (the final time uses mm:ss.ffff). */
function fmtShort(ms: number): string {
  const s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r.toFixed(2).padStart(5, '0')}`;
}

function nextDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return utcDayKey(d);
}

/** Stopwatch that paints straight into its <span> on every frame (no re-render 60× a second). */
function createTimer() {
  let acc = 0;
  let start: number | null = null;
  let frame = 0;
  let el: HTMLSpanElement | null = null;
  const elapsed = () => acc + (start == null ? 0 : performance.now() - start);
  const paint = () => {
    if (el) el.textContent = fmtShort(elapsed());
    if (start != null) frame = requestAnimationFrame(paint);
  };
  return {
    elapsed,
    running: () => start != null,
    attach(node: HTMLSpanElement | null) { el = node; if (el) el.textContent = fmtShort(elapsed()); },
    set(ms: number) { cancelAnimationFrame(frame); start = null; acc = ms; paint(); },
    run() { if (start != null) return; start = performance.now(); cancelAnimationFrame(frame); frame = requestAnimationFrame(paint); },
    stop() { if (start == null) return; acc += performance.now() - start; start = null; cancelAnimationFrame(frame); paint(); },
  };
}

/* ── puzzle generation: Web Worker with a main-thread fallback ── */
type CubeRequest = { level: CubeLevel; seed: string };

function useCubeGenerator() {
  const workerRef = useRef<Worker | null>(null);
  const failed = useRef(false);
  const nextId = useRef(0);
  const pending = useRef(new Map<number, { req: CubeRequest; resolve: (p: CubePuzzle) => void }>());

  useEffect(() => () => { workerRef.current?.terminate(); workerRef.current = null; }, []);

  return useCallback((req: CubeRequest): Promise<CubePuzzle> => {
    // Main-thread fallback; the timeout lets the loading state paint first
    const local = (r: CubeRequest) => new Promise<CubePuzzle>(resolve => {
      setTimeout(() => resolve(generateCube(r.level, r.seed)), 30);
    });
    if (failed.current || typeof Worker === 'undefined') return local(req);
    if (!workerRef.current) {
      try {
        const w = new Worker(new URL('../../../lib/games/sudokuCube.worker.ts', import.meta.url), { type: 'module' });
        w.onmessage = (e: MessageEvent<{ id: number; puzzle: CubePuzzle }>) => {
          const job = pending.current.get(e.data.id);
          pending.current.delete(e.data.id);
          job?.resolve(e.data.puzzle);
        };
        w.onerror = () => {
          // The worker could not load: finish every waiting request on the main thread
          failed.current = true;
          w.terminate();
          workerRef.current = null;
          const jobs = [...pending.current.values()];
          pending.current.clear();
          jobs.forEach(job => local(job.req).then(job.resolve));
        };
        workerRef.current = w;
      } catch {
        failed.current = true;
        return local(req);
      }
    }
    const id = ++nextId.current;
    return new Promise<CubePuzzle>(resolve => {
      pending.current.set(id, { req, resolve });
      workerRef.current!.postMessage({ id, level: req.level, seed: req.seed });
    });
  }, []);
}

/* ═════════════════════════════ shell ═════════════════════════════ */

interface TimerControl { pause: () => void; resume: () => void }

export default function SudokuCube() {
  const isClient = useIsClient();
  const storedLevel = useStored(LEVEL_KEY);
  const level: CubeLevel = (() => {
    try { const v = storedLevel ? JSON.parse(storedLevel) : null; return isCubeLevel(v) ? v : 'easy'; } catch { return 'easy'; }
  })();
  const [day, setDay] = useState(utcDayKey);
  const timerCtlRef = useRef<TimerControl | null>(null);

  // All-time record of this level (the first daily attempts only)
  const bestRaw = useStored(cubeBestKey(level));
  const best = useMemo<StoredBest | null>(() => {
    try { const v = bestRaw ? JSON.parse(bestRaw) as StoredBest : null; return typeof v?.timeMs === 'number' ? v : null; } catch { return null; }
  }, [bestRaw]);

  return (
    <GameShell
      gameId="sudoku-cube"
      leaderboardId={dailyVariantLeaderboardId('sudokucube', level, day)}
      color={LEVEL_COLOR[level].hex}
      best={best}
      onHide={() => timerCtlRef.current?.pause()}
      onShow={() => timerCtlRef.current?.resume()}
    >
      {isClient
        ? <SudokuCubeGame key={`${level}-${day}`} level={level} day={day} best={best} onDayChange={setDay} timerCtlRef={timerCtlRef} />
        : <div className="sc-placeholder" />}
      <SudokuCubeStyles />
    </GameShell>
  );
}

/* ═════════════════════════════ game ═════════════════════════════ */

type Mode = 'daily' | 'practice';

interface Progress {
  givens: number[];
  vals: number[];
  /** Split time (ms) of each face A–F, null until the face is first completed. */
  splits: (number | null)[];
  started: boolean;
  over: boolean;
  /** Elapsed ms when saved, and the wall clock at that moment (the clock keeps running while away). */
  elapsed: number;
  savedAt: number;
}

function freshProgress(givens: number[]): Progress {
  return { givens, vals: givens.slice(), splits: Array(6).fill(null), started: false, over: false, elapsed: 0, savedAt: 0 };
}

function resumedElapsed(p: Progress): number {
  if (p.over || !p.started || !p.savedAt) return p.elapsed;
  return p.elapsed + Math.max(0, Date.now() - p.savedAt);
}

function loadDaily(level: CubeLevel, day: string): Progress | null {
  const p = lsGet<Progress>(cubeStateKey(level, day));
  const N = cubeLayout(level).cells.length;
  return p && p.givens?.length === N && p.vals?.length === N && p.splits?.length === 6 ? p : null;
}

/* ── rotation: free trackball; release snaps to the nearest straight-on view ── */
const TILT = 'rotateX(-16deg) rotateY(-24deg) ';
const FACE_TRANSFORMS = ['none', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'];

function snapMatrix(R: DOMMatrix): DOMMatrix {
  const a = R.toFloat64Array(), o = new Float64Array(16);
  o[15] = 1;
  const used = new Set<number>();
  for (let col = 0; col < 3; col++) {
    let bi = -1, bv = -1;
    for (let row = 0; row < 3; row++) {
      const v = Math.abs(a[col * 4 + row]);
      if (!used.has(row) && v > bv) { bv = v; bi = row; }
    }
    used.add(bi);
    o[col * 4 + bi] = Math.sign(a[col * 4 + bi]) || 1;
  }
  return DOMMatrix.fromFloat64Array(o);
}

interface GameProps {
  level: CubeLevel;
  day: string;
  best: StoredBest | null;
  onDayChange: (d: string) => void;
  timerCtlRef: React.RefObject<TimerControl | null>;
}

function SudokuCubeGame({ level, day, best, onDayChange, timerCtlRef }: GameProps) {
  const { t } = useLang();
  const tr = t.sudokuCube;
  const name = t.gamesHub.name_sudokuCube;
  const { onGameOver } = useGameShell();
  const L = cubeLayout(level);
  const generate = useCubeGenerator();

  const [mode, setMode] = useState<Mode>('daily');
  const [p, setP] = useState<Progress | null>(() => loadDaily(level, day));
  const [sel, setSel] = useState(-1);
  const [front, setFront] = useState(0);
  const [splitMsg, setSplitMsg] = useState<{ text: string; n: number } | null>(null);
  const [shareNote, setShareNote] = useState('');
  const [newRecord, setNewRecord] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [timer] = useState(createTimer);
  const attachTimer = useCallback((node: HTMLSpanElement | null) => timer.attach(node), [timer]);

  const pRef = useRef(p);
  useEffect(() => { pRef.current = p; });
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; });

  const save = useCallback((next: Progress) => {
    if (modeRef.current !== 'daily') return;
    lsSet(cubeStateKey(level, day), { ...next, elapsed: next.over ? next.elapsed : timer.elapsed(), savedAt: Date.now() } satisfies Progress);
  }, [level, day, timer]);

  // Today's cube: resume the saved attempt, otherwise build it (in the worker)
  useEffect(() => {
    const cur = pRef.current;
    if (cur) {
      timer.set(resumedElapsed(cur));
      if (cur.started && !cur.over) timer.run();
      return;
    }
    let alive = true;
    generate({ level, seed: day }).then(puzzle => {
      if (!alive || modeRef.current !== 'daily') return;
      const fresh = freshProgress(puzzle.givens);
      timer.set(0);
      setP(fresh);
      lsSet(cubeStateKey(level, day), fresh);
    });
    return () => { alive = false; };
  }, [level, day, generate, timer]);

  // Save on leave; reset the clock on unmount
  useEffect(() => {
    const onLeave = () => { const c = pRef.current; if (c && c.started && !c.over) save(c); };
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', onLeave);
    return () => {
      onLeave();
      window.removeEventListener('pagehide', onLeave);
      document.removeEventListener('visibilitychange', onLeave);
      timer.set(0);
    };
  }, [timer, save]);

  // Boss key: pause / resume
  useEffect(() => {
    timerCtlRef.current = {
      pause: () => { timer.stop(); const c = pRef.current; if (c && c.started && !c.over) save(c); },
      resume: () => { const c = pRef.current; if (c && c.started && !c.over) timer.run(); },
    };
    return () => { timerCtlRef.current = null; };
  }, [timerCtlRef, timer, save]);

  // Midnight UTC → next day's cube, but never in the middle of an attempt
  useEffect(() => {
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const today = utcDayKey(new Date(n));
      const cur = pRef.current;
      if (today !== day && (!cur || cur.over || !cur.started || modeRef.current === 'practice')) onDayChange(today);
    }, 1000);
    return () => clearInterval(id);
  }, [day, onDayChange]);

  /* ── cube rotation ── */
  const cubeRef = useRef<HTMLDivElement>(null);
  const R = useRef<DOMMatrix | null>(null);
  const faceNormals = useRef<DOMPoint[] | null>(null);
  const getR = () => (R.current ??= new DOMMatrix());

  const applyRot = useCallback(() => {
    if (cubeRef.current) cubeRef.current.style.transform = TILT + (R.current ?? new DOMMatrix()).toString();
  }, []);
  const rotScreen = (ax: number, ay: number, deg: number) => {
    R.current = new DOMMatrix().rotateAxisAngle(ax, ay, 0, deg).multiply(getR());
  };
  const frontFace = () => {
    faceNormals.current ??= FACE_TRANSFORMS.map(tf => new DOMMatrix(tf).transformPoint(new DOMPoint(0, 0, 1, 0)));
    let bestF = 0, bz = -9;
    faceNormals.current.forEach((nrm, f) => { const z = getR().transformPoint(nrm).z; if (z > bz) { bz = z; bestF = f; } });
    return bestF;
  };
  const snap = () => { R.current = snapMatrix(getR()); applyRot(); setFront(frontFace()); };

  const hasPuzzle = p != null;
  useEffect(() => { applyRot(); }, [applyRot, hasPuzzle]);

  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const snapRef = useRef(snap);
  useEffect(() => { snapRef.current = snap; });

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    drag.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    cubeRef.current?.classList.add('sc-drag');
  }
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d0 = drag.current;
      if (!d0) return;
      const dx = e.clientX - d0.x, dy = e.clientY - d0.y;
      if (!moved.current && Math.abs(dx) + Math.abs(dy) <= 6) return;
      moved.current = true;
      const d = Math.hypot(dx, dy);
      if (d) {
        R.current = new DOMMatrix().rotateAxisAngle(-dy / d, dx / d, 0, d * 0.45).multiply(R.current ?? new DOMMatrix());
        drag.current = { x: e.clientX, y: e.clientY };
        applyRot();
      }
    };
    const onUp = () => {
      if (!drag.current) return;
      cubeRef.current?.classList.remove('sc-drag');
      if (moved.current) snapRef.current();
      drag.current = null;
      setTimeout(() => { moved.current = false; }, 0);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [applyRot]);

  function turn(dir: 'left' | 'right' | 'up' | 'down') {
    cubeRef.current?.classList.remove('sc-drag');
    if (dir === 'left') rotScreen(0, 1, -90);
    else if (dir === 'right') rotScreen(0, 1, 90);
    else if (dir === 'up') rotScreen(1, 0, 90);
    else rotScreen(1, 0, -90);
    snap();
    tone(330, 0.04, 0.06);
  }

  function spinOnce() {
    const cube = cubeRef.current;
    if (!cube || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    cube.classList.add('sc-drag');
    let k = 0;
    const step = () => {
      rotScreen(0, 1, 12); applyRot();
      if (++k < 30) requestAnimationFrame(step);
      else { cube.classList.remove('sc-drag'); snap(); }
    };
    requestAnimationFrame(step);
  }

  /* ── play ── */
  const vals = p?.vals;
  const conflicts = useMemo(() => (vals ? vals.map((_, i) => hasConflict(L, vals, i)) : []), [L, vals]);
  const doneFaces = useMemo(() => (vals ? [0, 1, 2, 3, 4, 5].map(f => isFaceDone(L, vals, f)) : []), [L, vals]);
  const peerSet = useMemo(() => new Set(sel >= 0 ? L.peers[sel] : []), [L, sel]);

  function select(i: number) {
    if (!p || p.over) return;
    getGameAudio(); // created inside the tap so sound is allowed
    setSel(i);
    if (!p.started) {
      const next = { ...p, started: true };
      setP(next);
      timer.run();
      save(next);
    }
  }

  function onCubeClick(e: React.MouseEvent) {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (cell) select(Number(cell.dataset.i));
  }

  const splitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(splitTimer.current), []);

  function setNum(n: number) {
    if (!p || sel < 0 || p.over || p.givens[sel] || n > L.K) return;
    if (p.vals[sel] === n) return;
    const nextVals = p.vals.slice();
    nextVals[sel] = n;
    const splits = p.splits.slice();
    tone(n ? 380 + n * 35 : 220, 0.06, 0.08);
    // In band levels a move can also finish another face (by clearing a conflict there)
    const finished = [0, 1, 2, 3, 4, 5].filter(f => !doneFaces[f] && isFaceDone(L, nextVals, f));
    if (finished.length) {
      tone(660, 0.15); setTimeout(() => tone(880, 0.2), 120);
      const ms = timer.elapsed();
      const fresh = finished.filter(f => splits[f] == null);
      fresh.forEach(f => { splits[f] = ms; });
      if (fresh.length) {
        clearTimeout(splitTimer.current);
        const text = fresh.map(f => tr.faceDone.replace('{f}', FACE_LETTERS[f]).replace('{t}', fmtShort(ms))).join(' · ');
        setSplitMsg(m => ({ text, n: (m?.n ?? 0) + 1 }));
        splitTimer.current = setTimeout(() => setSplitMsg(null), 2200);
      }
    }
    const next: Progress = { ...p, vals: nextVals, splits };
    if (isCubeSolved(L, nextVals)) { finish(next); return; }
    setP(next);
    save(next);
  }

  function finish(next: Progress) {
    timer.stop();
    const timeMs = Math.max(0.1, Math.round(timer.elapsed() * 10) / 10);
    const final: Progress = { ...next, over: true, elapsed: timeMs };
    setP(final);
    setSel(-1);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.2), i * 90));
    spinOnce();
    if (modeRef.current !== 'daily') { recordGameCompleted(); return; }
    lsSet(cubeStateKey(level, day), { ...final, savedAt: Date.now() });
    // Personal record: first daily attempts only (this is the only one today)
    if (!best || timeMs < best.timeMs) {
      lsSet(cubeBestKey(level), { timeMs } satisfies StoredBest);
      setNewRecord(true);
    }
    onGameOver({ timeMs, diff: level });
  }

  function chooseLevel(l: CubeLevel) {
    if (l === level) return;
    const c = pRef.current;
    if (c && c.started && !c.over) save(c);
    lsSet(LEVEL_KEY, l);
  }

  function practice() {
    timer.set(0);
    modeRef.current = 'practice';
    setMode('practice');
    setP(null);
    setSel(-1); setShareNote(''); setNewRecord(false);
    generate({ level, seed: `practice-${Math.random().toString(36).slice(2)}` }).then(puzzle => {
      if (modeRef.current !== 'practice') return;
      setP(freshProgress(puzzle.givens));
    });
  }

  function backToToday() {
    const saved = loadDaily(level, day);
    modeRef.current = 'daily';
    setMode('daily');
    setSel(-1); setShareNote(''); setNewRecord(false);
    if (saved) {
      timer.set(resumedElapsed(saved));
      setP(saved);
      if (saved.started && !saved.over) timer.run();
    } else {
      setP(null);
      generate({ level, seed: day }).then(puzzle => {
        if (modeRef.current !== 'daily') return;
        const fresh = freshProgress(puzzle.givens);
        setP(fresh);
        lsSet(cubeStateKey(level, day), fresh);
      });
    }
  }

  /* ── keyboard: digits (two-digit numbers typed quickly), Backspace / Delete, arrows ── */
  const kb = useRef('');
  const kbTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const setNumRef = useRef(setNum);
  const turnRef = useRef(turn);
  useEffect(() => { setNumRef.current = setNum; turnRef.current = turn; });
  const K = L.K;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('[role="dialog"]')) return;
      if (/^[0-9]$/.test(e.key)) {
        clearTimeout(kbTimer.current);
        kb.current += e.key;
        const v = Number(kb.current);
        // Two-digit numbers: "1" waits briefly for a second digit when 10+ exists
        if (K < 10 || kb.current.length === 2 || v * 10 > K) {
          if (v >= 1 && v <= K) setNumRef.current(v);
          kb.current = '';
        } else {
          if (v >= 1) setNumRef.current(v);
          kbTimer.current = setTimeout(() => { kb.current = ''; }, 700);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        setNumRef.current(0);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const dir = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const)[e.key as 'ArrowLeft'];
        if (dir) turnRef.current(dir);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(kbTimer.current); };
  }, [K]);

  /* ── result & share ── */
  const isPractice = mode === 'practice';
  const finalTime = p ? formatTimeMs(p.elapsed) : '';
  const levelName = { easy: tr.levelEasy, mid: tr.levelMid, hard: tr.levelHard }[level];
  const sortedSplits = p
    ? p.splits.map((ms, f) => ({ f, ms })).filter((s): s is { f: number; ms: number } => s.ms != null).sort((a, b) => a.ms - b.ms)
    : [];

  async function share() {
    const text = tr.shareText
      .replace('{name}', name)
      .replace('{level}', levelName)
      .replace('{date}', day)
      .replace('{squares}', LEVEL_SQUARE[level].repeat(6))
      .replace('{time}', finalTime);
    const full = `${text}\n${SHARE_URL}`;
    if (window.matchMedia('(pointer: coarse)').matches && navigator.share) {
      try { await navigator.share({ text: full }); return; } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      setShareNote(tr.copied);
    } catch {
      setShareNote(full.replace(/\n/g, ' · '));
    }
  }

  const msLeft = Math.max(0, Date.parse(`${nextDay(day)}T00:00:00Z`) - now);
  const countdown = [Math.floor(msLeft / 3.6e6), Math.floor(msLeft / 6e4) % 60, Math.floor(msLeft / 1000) % 60]
    .map(n => String(n).padStart(2, '0')).join(':');

  const col = LEVEL_COLOR[level];
  const fontScale = L.n === 2 ? 0.2 : L.K > 9 ? 0.085 : 0.13;
  const padCols = L.K === 16 ? 6 : 5;
  const hint = level === 'easy' ? tr.hintEasy : tr.hintBands.replace('{k}', String(L.K));
  const levelDesc = { easy: tr.descEasy, mid: tr.descMid, hard: tr.descHard };
  const selVal = sel >= 0 && vals ? vals[sel] : 0;

  return (
    <div className="sc-app" style={{ '--nr': col.rgb, '--neon': col.hex, '--neon2': col.light } as CSSProperties}>
      <div className="sc-levels" role="radiogroup" aria-label={tr.level}>
        {CUBE_LEVELS.map(l => (
          <button
            key={l} type="button" role="radio" aria-checked={l === level}
            className={`sc-lvbtn${l === level ? ' on' : ''}`}
            style={{ '--c': LEVEL_COLOR[l].rgb } as CSSProperties}
            title={levelDesc[l]}
            onClick={() => chooseLevel(l)}
          >
            <i className="sc-dot" aria-hidden="true" />
            {{ easy: tr.levelEasy, mid: tr.levelMid, hard: tr.levelHard }[l]}
          </button>
        ))}
      </div>

      <div className="sc-hud">
        <span className="sc-lvtag">{isPractice ? tr.practiceBadge : levelName}</span>
        <div className="sc-timer" role="timer" aria-label={tr.timeAria}><span ref={attachTimer} /></div>
      </div>

      <div className="sc-faces" aria-label={tr.facesAria}>
        {[0, 1, 2, 3, 4, 5].map(f => {
          const ms = p?.splits[f];
          return (
            <div key={f} className={`sc-slot${doneFaces[f] ? ' ok' : ''}${f === front ? ' cur' : ''}`}>
              <b>{FACE_LETTERS[f]}</b>
              <span>{ms != null ? fmtShort(ms) : '–'}</span>
            </div>
          );
        })}
      </div>

      <div className="sc-stage-wrap">
        {splitMsg && <div key={splitMsg.n} className="sc-split" role="status">{splitMsg.text}</div>}
        <div
          className="sc-stage" onPointerDown={onPointerDown}
          // A drag that ends on a cell is a turn, not a tap
          onClickCapture={e => { if (moved.current) e.stopPropagation(); }}
        >
          <div className="sc-cube" ref={cubeRef} style={{ '--fs': fontScale } as CSSProperties} onClick={onCubeClick}>
            {p && [0, 1, 2, 3, 4, 5].map(f => (
              <div key={f} className={`sc-face sc-f${f}${doneFaces[f] ? ' done' : ''}`} data-l={FACE_LETTERS[f]}
                style={{ gridTemplateColumns: `repeat(${L.n}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${L.n}, minmax(0, 1fr))` }}>
                {L.cells.map((c, i) => {
                  if (c.face !== f) return null;
                  const given = p.givens[i] > 0;
                  const v = p.vals[i];
                  const cls = ['sc-cell'];
                  if (given) cls.push('given');
                  if (i === sel) cls.push('sel');
                  else if (peerSet.has(i)) cls.push('peer');
                  if (!given && conflicts[i]) cls.push('bad');
                  if (selVal && i !== sel && v === selVal) cls.push('same');
                  if (level === 'easy') {
                    if (c.c === 1) cls.push('gr'); if (c.c === 2) cls.push('gl');
                    if (c.r === 1) cls.push('gb'); if (c.r === 2) cls.push('gt');
                  }
                  return (
                    <button
                      key={i} type="button" className={cls.join(' ')}
                      style={{ gridRow: c.r + 1, gridColumn: c.c + 1 }}
                      aria-label={`${tr.cellAria.replace('{f}', FACE_LETTERS[f]).replace('{r}', String(c.r + 1)).replace('{c}', String(c.c + 1))}${v ? `: ${v}` : ''}`}
                      aria-pressed={given ? undefined : i === sel}
                      aria-disabled={given || p.over || undefined}
                      data-i={given ? undefined : i}
                    >
                      {v || ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {!p && (
            <div className="sc-loading" role="status">
              <span className="sc-spinner" aria-hidden="true" />
              {tr.loading}
            </div>
          )}
        </div>
      </div>

      {p && !p.over && (
        <>
          <p className="sc-hint">{hint}</p>
          <div className="sc-rot">
            <button type="button" onClick={() => turn('left')} aria-label={tr.rotLeft}>◀</button>
            <button type="button" onClick={() => turn('up')} aria-label={tr.rotUp}>▲</button>
            <button type="button" onClick={() => turn('down')} aria-label={tr.rotDown}>▼</button>
            <button type="button" onClick={() => turn('right')} aria-label={tr.rotRight}>▶</button>
          </div>
          <div className="sc-pad" style={{ gridTemplateColumns: `repeat(${padCols}, minmax(0, 1fr))` }}>
            {Array.from({ length: L.K }, (_, k) => (
              <button key={k} type="button" onClick={() => setNum(k + 1)} disabled={sel < 0}>{k + 1}</button>
            ))}
            <button type="button" className="sc-del" onClick={() => setNum(0)} disabled={sel < 0} aria-label={tr.erase}>⌫</button>
          </div>
          <p className="sc-note">{isPractice ? tr.practiceNote : tr.note}</p>
        </>
      )}

      {p?.over && (
        <section className="sc-result" aria-live="polite">
          <h2>{tr.solvedTitle}</h2>
          <div className="sc-big tabular-nums">{finalTime}</div>
          <p className="sc-sub">
            {levelName}
            {!isPractice && best && <> · {newRecord ? tr.newRecord : tr.bestTime.replace('{t}', formatTimeMs(best.timeMs))}</>}
          </p>
          {sortedSplits.length > 0 && (
            <div className="sc-splits" aria-label={tr.splitsTitle}>
              {sortedSplits.map((s, k) => (
                <div key={s.f}>{tr.splitItem.replace('{n}', String(k + 1)).replace('{f}', FACE_LETTERS[s.f])}<b>{fmtShort(s.ms)}</b></div>
              ))}
            </div>
          )}
          <div className="sc-actions">
            {!isPractice && <button type="button" className="gx-btn sc-cta" onClick={share}>{tr.share}</button>}
            {shareNote && <div className="sc-toast" role="status">{shareNote}</div>}
            <button type="button" className="gx-btn gx-ghost sc-ghost" onClick={practice}>{tr.practice}</button>
            {isPractice && <button type="button" className="gx-btn gx-ghost sc-ghost" onClick={backToToday}>{tr.backToToday}</button>}
          </div>
          {!isPractice && <p className="sc-note">{tr.nextIn.replace('{time}', countdown)}</p>}
        </section>
      )}
    </div>
  );
}

function SudokuCubeStyles() {
  return (
    <style>{`
      .sc-placeholder { min-height: 560px; }
      .sc-app {
        --S: min(250px, 58vw); --bad: #FFD24D; --ink: #F0F6FF; --dim: #9AA8B8;
        position: relative; display: flex; flex-direction: column; gap: 10px;
        font-family: 'Poppins', system-ui, sans-serif; color: var(--ink);
        user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
      }
      .sc-levels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
      .sc-lvbtn {
        display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 0 6px;
        font: 700 13px 'Poppins', system-ui, sans-serif; color: var(--dim); cursor: pointer; border-radius: 12px;
        background: rgba(var(--c), .06); border: 1.5px solid rgba(var(--c), .3);
      }
      .sc-lvbtn.on { color: rgb(var(--c)); background: rgba(var(--c), .16); border-color: rgba(var(--c), .85); box-shadow: 0 0 16px rgba(var(--c), .3); }
      .sc-dot { flex: none; width: 12px; height: 12px; border-radius: 4px; background: rgba(var(--c), .35); box-shadow: inset 0 0 0 1.5px rgb(var(--c)), 0 0 8px rgba(var(--c), .6); }
      .sc-hud { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
      .sc-lvtag {
        font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 4px 10px;
        border-radius: 999px; border: 1px solid rgba(var(--nr), .6); color: var(--neon);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
      }
      .sc-timer {
        font-weight: 800; font-size: 18px; font-variant-numeric: tabular-nums;
        background: rgba(var(--nr), .08); border: 1px solid rgba(var(--nr), .55); border-radius: 12px; padding: 6px 12px;
      }
      .sc-faces { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
      .sc-slot {
        display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 5px 2px; border-radius: 10px; min-width: 0;
        background: rgba(var(--nr), .06); border: 1px solid rgba(var(--nr), .2);
      }
      .sc-slot b { font-size: 12px; font-weight: 800; color: var(--dim); line-height: 1; }
      .sc-slot span { font-size: 10px; font-weight: 600; color: var(--dim); font-variant-numeric: tabular-nums; line-height: 1; white-space: nowrap; }
      .sc-slot.cur { border-color: var(--neon2); }
      .sc-slot.ok { background: rgba(var(--nr), .22); border-color: var(--neon); box-shadow: 0 0 12px rgba(var(--nr), .4); }
      .sc-slot.ok b, .sc-slot.ok span { color: var(--ink); }

      .sc-stage-wrap { position: relative; }
      .sc-split {
        position: absolute; left: 50%; top: 6px; z-index: 4; pointer-events: none; white-space: nowrap;
        font-weight: 800; font-size: 14px; padding: 7px 14px; border-radius: 999px;
        background: rgba(var(--nr), .22); border: 1px solid var(--neon); color: var(--ink);
        box-shadow: 0 0 22px rgba(var(--nr), .5); animation: scSplit 2.2s ease-out forwards;
      }
      @keyframes scSplit {
        0% { opacity: 0; transform: translate(-50%, 8px); } 12% { opacity: 1; transform: translate(-50%, 0); }
        80% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, 0); }
      }
      .sc-stage {
        position: relative; height: calc(var(--S) * 1.55); display: flex; align-items: center; justify-content: center;
        perspective: 900px; touch-action: none; cursor: grab;
        background: radial-gradient(circle at 50% 50%, rgba(var(--nr), .22) 0%, rgba(var(--nr), .06) 38%, transparent 66%);
      }
      .sc-stage:active { cursor: grabbing; }
      .sc-cube {
        position: relative; width: var(--S); height: var(--S); transform-style: preserve-3d;
        transform: rotateX(-16deg) rotateY(-24deg);
        transition: transform .45s cubic-bezier(.2, .8, .2, 1);
      }
      .sc-cube.sc-drag { transition: none; }
      .sc-face {
        position: absolute; inset: 0; box-sizing: border-box; padding: calc(var(--S) * .045); display: grid; gap: calc(var(--S) * .022);
        backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 6px; background: rgba(2, 6, 8, .72);
        box-shadow: inset 0 0 0 1px rgba(var(--nr), .25), 0 0 30px rgba(var(--nr), .12);
      }
      .sc-face::before { content: attr(data-l); position: absolute; top: 1px; left: 4px; font-size: 9px; font-weight: 800; color: rgba(var(--nr), .85); line-height: 1; }
      .sc-face.done { box-shadow: inset 0 0 0 2px var(--neon), 0 0 50px rgba(var(--nr), .45); }
      .sc-f0 { transform: translateZ(calc(var(--S) / 2)); }
      .sc-f1 { transform: rotateY(90deg) translateZ(calc(var(--S) / 2)); }
      .sc-f2 { transform: rotateY(180deg) translateZ(calc(var(--S) / 2)); }
      .sc-f3 { transform: rotateY(-90deg) translateZ(calc(var(--S) / 2)); }
      .sc-f4 { transform: rotateX(90deg) translateZ(calc(var(--S) / 2)); }
      .sc-f5 { transform: rotateX(-90deg) translateZ(calc(var(--S) / 2)); }
      .sc-cell {
        position: relative; border: 0; padding: 0; font: 800 calc(var(--S) * var(--fs)) / 1 'Poppins', system-ui, sans-serif;
        color: var(--ink); cursor: pointer; border-radius: 4px; min-width: 0; min-height: 0;
        background: linear-gradient(145deg, rgba(var(--nr), .16), rgba(var(--nr), .03));
        box-shadow: inset 0 0 0 1px rgba(var(--nr), .55), inset 0 -6px 14px rgba(var(--nr), .10), 0 0 8px rgba(var(--nr), .12);
      }
      .sc-cell.given { color: var(--neon); text-shadow: 0 0 10px rgba(var(--nr), .85); cursor: default; background: linear-gradient(145deg, rgba(var(--nr), .24), rgba(var(--nr), .06)); }
      .sc-cell.peer { background: linear-gradient(145deg, rgba(var(--nr), .5), rgba(var(--nr), .22)); box-shadow: inset 0 0 0 1.5px var(--neon2), 0 0 12px rgba(var(--nr), .45); }
      .sc-cell.sel { box-shadow: inset 0 0 0 2px var(--neon2), 0 0 16px var(--neon2); background: linear-gradient(145deg, rgba(var(--nr), .45), rgba(var(--nr), .18)); }
      .sc-cell.bad { color: var(--bad); text-shadow: 0 0 8px rgba(255, 210, 77, .7); }
      .sc-cell.same { text-decoration: underline; text-underline-offset: 3px; }
      .sc-cell.gr { margin-right: calc(var(--S) * .02); } .sc-cell.gl { margin-left: calc(var(--S) * .02); }
      .sc-cell.gb { margin-bottom: calc(var(--S) * .02); } .sc-cell.gt { margin-top: calc(var(--S) * .02); }
      .sc-cell:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }

      .sc-loading {
        position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        font-size: 14px; font-weight: 600; color: var(--dim);
      }
      .sc-spinner {
        width: 44px; height: 44px; border-radius: 10px; border: 3px solid rgba(var(--nr), .25); border-top-color: var(--neon);
        box-shadow: 0 0 18px rgba(var(--nr), .4); animation: scSpin 1s linear infinite;
      }
      @keyframes scSpin { to { transform: rotate(360deg); } }

      .sc-hint { margin: 0; text-align: center; font-size: 12px; color: var(--dim); min-height: 16px; padding: 0 8px; line-height: 1.45; }
      .sc-rot { display: flex; justify-content: center; gap: 8px; }
      .sc-rot button, .sc-pad button {
        font: 800 16px 'Poppins', system-ui, sans-serif; border-radius: 12px; cursor: pointer; color: var(--ink);
        border: 1px solid rgba(var(--nr), .55); background: rgba(var(--nr), .08);
      }
      .sc-rot button { width: 52px; height: 42px; }
      .sc-pad { display: grid; gap: 7px; }
      .sc-pad button { height: 48px; font-size: 20px; box-shadow: inset 0 -8px 16px rgba(var(--nr), .08); font-variant-numeric: tabular-nums; }
      .sc-pad button:disabled { opacity: .45; cursor: default; }
      .sc-pad .sc-del { font-size: 16px; color: var(--dim); }
      .sc-pad button:active:not(:disabled), .sc-rot button:active { background: rgba(var(--nr), .3); }
      .sc-rot button:focus-visible, .sc-pad button:focus-visible, .sc-lvbtn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
      .sc-note { margin: 0; text-align: center; font-size: 12px; color: var(--dim); line-height: 1.45; }

      .sc-result { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding-top: 4px; }
      .sc-result h2 { margin: 0; font-size: 26px; font-weight: 800; color: var(--neon); text-shadow: 0 0 24px rgba(var(--nr), .7); }
      .sc-big { font-size: 42px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; text-shadow: 0 0 26px rgba(var(--nr), .7); }
      .sc-sub { margin: 0; color: var(--dim); font-size: 14px; }
      .sc-splits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; width: min(340px, 100%); }
      .sc-splits div {
        padding: 8px 4px; border-radius: 10px; background: rgba(var(--nr), .1); border: 1px solid rgba(var(--nr), .35);
        font-size: 12px; color: var(--dim); font-variant-numeric: tabular-nums;
      }
      .sc-splits b { display: block; color: var(--ink); font-size: 14px; }
      .sc-actions { display: flex; flex-direction: column; align-items: center; gap: 8px; width: min(340px, 100%); }
      .sc-actions .gx-btn { width: 100%; white-space: normal; text-align: center; }
      .sc-cta { border: 0; background: var(--neon); color: #020406; box-shadow: 0 0 26px rgba(var(--nr), .5); }
      .sc-cta:hover { filter: brightness(1.08); }
      .sc-ghost { border-color: rgba(var(--nr), .55) !important; background: transparent !important; color: var(--ink) !important; }
      .sc-toast { font-size: 13px; color: var(--neon); overflow-wrap: anywhere; }

      @media (max-width: 380px) {
        .sc-lvbtn { font-size: 12px; gap: 5px; }
        .sc-slot span { font-size: 9px; }
        .sc-pad button { height: 44px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .sc-cube { transition: none; }
        .sc-spinner { animation-duration: 3s; }
      }
    `}</style>
  );
}
