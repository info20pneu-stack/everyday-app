'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { useIsClient } from '../../../lib/games/useIsClient';
import { balloonTexts, type BalloonMode, type BalloonTexts } from '../../../lib/games/balloonI18n';
import { useIncomingChallenge } from '../../../lib/share/client';
import GameShell, { useGameShell } from './GameShell';

/* Balloon Pop (Praskni balónek) — port of games-reference/balloon.
   Balloons rise out of 9 holes; tap them before they sink. Gold +30, tough (2 taps) +20, normal +10,
   cactus −20. Fast pops build a combo up to ×5. Reaction time is measured and kept per day.
   Modes: Time (60 s, leaderboard), Survival (speeds up, 3 lives, leaderboard), Memory (repeat
   the order, personal best only) and 2 players on one phone (each their half, the top one turned). */

const MODES: BalloonMode[] = ['time', 'surv', 'mem', 'duo'];
const LEN: Partial<Record<BalloonMode, number>> = { time: 60000, duo: 45000 };
const BOARD_OF: Partial<Record<BalloonMode, string>> = { time: 'balloontime', surv: 'balloonsurv' };
const COLORS = ['#E8735A', '#5B9BD5', '#7FD3B2', '#F28FB0'];
const MODE_KEY = 'bl-mode', SOUND_KEY = 'bl-sound', REACT_KEY = 'bl-react', MEM_BEST_KEY = 'bl-best-mem';

type Kind = 'b' | 'g' | 's' | 'c';
interface Item { id: number; k: Kind; hp: number; col: string; born: number; ttl: number; hit: boolean }
interface Fx { id: number; kind: 'pop' | 'sink'; col: string; item: Item | null }
interface Float { id: number; text: string; bad: boolean }
interface Board {
  cells: (Item | null)[]; fx: (Fx | null)[]; floats: Float[][]; shakes: number[];
  score: number; combo: number; pops: number; reacts: number[]; spawnIn: number; shake: number;
}
interface Game {
  running: boolean; paused: boolean; clock: number; timeLeft: number; lives: number; round: number;
  seq: number[]; input: number; accept: boolean;
}
type Overlay =
  | { kind: 'start' }
  | { kind: 'count'; n: number }
  | { kind: 'pause' }
  | { kind: 'end'; title: 'newRecord' | 'over' | 'draw' | 'bottomWins' | 'topWins'; score: number; bot?: number; top?: number; lines: string[] }
  | null;

function lsGet<T>(key: string, fb: T): T {
  try { const v = localStorage.getItem(key); return v == null ? fb : JSON.parse(v) as T; } catch { return fb; }
}
function lsSet(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}
/** Local day key, as in the original (reaction history is a personal, local thing). */
function dayKey(off = 0): string {
  const d = new Date(); d.setDate(d.getDate() - off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const mult = (B: Board) => Math.min(5, 1 + Math.floor(B.combo / 3));
const avgOf = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
const isMode = (m: unknown): m is BalloonMode => typeof m === 'string' && (MODES as string[]).includes(m);

export default function BalloonPop() {
  const isClient = useIsClient();
  const [mode, setMode] = useState<BalloonMode | null>(null);
  const incoming = useIncomingChallenge();
  const [appliedChallenge, setAppliedChallenge] = useState<string | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);

  // Mode: ?mode=, a friend's challenge, or the last one played (browser only)
  if (isClient && mode === null) {
    const q = new URLSearchParams(window.location.search).get('mode');
    setMode(isMode(q) ? q : (() => { const s = lsGet<string>(MODE_KEY, 'time'); return isMode(s) ? s : 'time'; })());
  }
  if (incoming && appliedChallenge !== incoming.id) {
    setAppliedChallenge(incoming.id);
    setMode(incoming.board === 'balloonsurv' ? 'surv' : 'time');
  }
  const current: BalloonMode = mode ?? 'time';

  function choose(m: BalloonMode) { lsSet(MODE_KEY, m); setMode(m); }

  return (
    <GameShell gameId="balloon-pop" leaderboardId={BOARD_OF[current] ?? null} onHide={() => pauseRef.current?.()}>
      {isClient && mode !== null
        ? <BalloonGame key={current} mode={current} onMode={choose} pauseRef={pauseRef} />
        : <div className="bp-placeholder" />}
      <BalloonStyles />
    </GameShell>
  );
}

function emptyBoard(): Board {
  return {
    cells: Array(9).fill(null), fx: Array(9).fill(null), floats: Array.from({ length: 9 }, () => []), shakes: Array(9).fill(0),
    score: 0, combo: 0, pops: 0, reacts: [], spawnIn: 600, shake: 0,
  };
}
function cloneBoard(b: Board): Board {
  return { ...b, cells: [...b.cells], fx: [...b.fx], floats: b.floats.map(f => [...f]), shakes: [...b.shakes], reacts: [...b.reacts] };
}
const idleGame = (): Game => ({ running: false, paused: false, clock: 0, timeLeft: 0, lives: 3, round: 1, seq: [], input: 0, accept: false });

interface Snap { boards: Board[]; g: Game; overlay: Overlay }

function BalloonGame({ mode, onMode, pauseRef }: {
  mode: BalloonMode; onMode: (m: BalloonMode) => void; pauseRef: React.RefObject<(() => void) | null>;
}) {
  const { lang } = useLang();
  const tx = balloonTexts(lang);
  const { onGameOver, startRound } = useGameShell();
  const nBoards = mode === 'duo' ? 2 : 1;

  const [snap, setSnap] = useState<Snap>(() => ({
    boards: Array.from({ length: nBoards }, emptyBoard), g: idleGame(), overlay: { kind: 'start' },
  }));
  const [soundOn, setSoundOn] = useState(() => lsGet(SOUND_KEY, true));
  const [react, setReact] = useState(() => lsGet<Record<string, { sum: number; n: number }>>(REACT_KEY, {}));
  const [memBest, setMemBest] = useState(() => lsGet(MEM_BEST_KEY, 0));
  const [best, setBest] = useState(() => {
    const id = BOARD_OF[mode];
    if (!id) return 0;
    try { const v = JSON.parse(localStorage.getItem(`everyday-best-${id}`) ?? 'null') as { score?: number } | null; return v?.score ?? 0; } catch { return 0; }
  });

  const eng = useRef<{ boards: Board[]; g: Game; overlay: Overlay; gen: number; nextId: number }>({
    boards: snap.boards.map(cloneBoard), g: idleGame(), overlay: { kind: 'start' }, gen: 0, nextId: 1,
  });
  const latest = useRef({ onGameOver, startRound, soundOn, tx, lang, best, memBest });
  useEffect(() => { latest.current = { onGameOver, startRound, soundOn, tx, lang, best, memBest }; });
  const stageRef = useRef<HTMLDivElement>(null);
  /** Start (or restart) a game and bring the whole play area into view on small screens. */
  function startGame() {
    const st = stageRef.current;
    if (st) {
      const r = st.getBoundingClientRect();
      if (r.top < 64 || r.bottom > window.innerHeight - 70) st.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    api.current?.countdown();
  }
  const api = useRef<{ countdown: () => void; pause: () => void; resume: () => void; quit: () => void; tap: (b: number, c: number) => void } | null>(null);

  useEffect(() => {
    const E = eng.current;
    let raf = 0, last = performance.now(), alive = true;

    const publish = () => setSnap({ boards: E.boards.map(cloneBoard), g: { ...E.g, seq: [...E.g.seq] }, overlay: E.overlay });
    const newId = () => E.nextId++;

    function tone(f: number, d: number, type: OscillatorType = 'sine', vol = 0.08, slide?: number) {
      if (!latest.current.soundOn) return;
      const ac = getGameAudio();
      if (!ac) return;
      try {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(t + d);
      } catch {}
    }

    /** Waits `ms` of unpaused time; false when the game was restarted / closed meanwhile. */
    function wait(ms: number, gen: number): Promise<boolean> {
      return new Promise(res => {
        let left = ms, prev = performance.now();
        const tick = (now: number) => {
          if (!alive || E.gen !== gen) { res(false); return; }
          if (!E.g.paused) left -= now - prev;
          prev = now;
          if (left <= 0) res(true); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }

    /* ── cells ── */
    function showItem(B: Board, i: number, it: Item) { B.cells[i] = it; B.fx[i] = null; }
    function clearCell(B: Board, i: number, how: 'pop' | 'sink', col = '#5B9BD5') {
      const it = B.cells[i];
      B.cells[i] = null;
      const fx: Fx = { id: newId(), kind: how, col, item: how === 'sink' ? it : null };
      B.fx[i] = fx;
      setTimeout(() => { if (B.fx[i] === fx) { B.fx[i] = null; publish(); } }, 400);
    }
    function floatText(B: Board, i: number, text: string, bad = false) {
      const f: Float = { id: newId(), text, bad };
      B.floats[i].push(f);
      setTimeout(() => { B.floats[i] = B.floats[i].filter(x => x !== f); publish(); }, 800);
    }

    /* ── pacing ── */
    const progress = (B: Board) => (mode === 'surv' ? Math.min(1, B.pops / 70) : Math.min(1, E.g.clock / (LEN[mode] ?? 60000)));
    const interval = (B: Board) => Math.round(900 - progress(B) * (mode === 'surv' ? 560 : 470) + Math.random() * 160);
    const lifetime = (B: Board) => 1500 - progress(B) * (mode === 'surv' ? 820 : 620);

    function spawn(B: Board) {
      const free = B.cells.map((c, i) => (c ? -1 : i)).filter(i => i >= 0);
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)];
      const r = Math.random(), early = E.g.clock < 4000;
      let k: Kind = 'b';
      if (!early && r < 0.11) k = 'c'; else if (r < 0.19) k = 'g'; else if (!early && r < 0.33) k = 's';
      let ttl = lifetime(B);
      if (k === 'g') ttl *= 0.65;
      if (k === 's') ttl *= 1.45;
      if (k === 'c') ttl = 1700;
      showItem(B, i, { id: newId(), k, hp: k === 's' ? 2 : 1, col: COLORS[Math.floor(Math.random() * COLORS.length)], born: E.g.clock, ttl, hit: false });
      tone(k === 'g' ? 990 : 520, 0.05, 'sine', 0.025);
      if (progress(B) > 0.55 && Math.random() < 0.25 && free.length > 2) {
        const gen = E.gen;
        setTimeout(() => { if (alive && E.gen === gen && E.g.running && !E.g.paused) { spawn(B); publish(); } }, 120);
      }
    }

    function shakeBoard(B: Board) { B.shake++; }
    function loseLife() {
      E.g.lives--;
      shakeBoard(E.boards[0]);
      if (E.g.lives <= 0) end();
    }

    function tap(bi: number, i: number) {
      const g = E.g, B = E.boards[bi];
      if (!g.running || g.paused || !B) return;
      if (mode === 'mem') { void memTap(B, i); return; }
      const it = B.cells[i];
      if (!it) return;
      const tr = latest.current.tx;
      if (it.k === 'c') {
        B.score = Math.max(0, B.score - 20); B.combo = 0;
        floatText(B, i, '−20', true); B.shakes[i]++; clearCell(B, i, 'sink');
        tone(160, 0.25, 'sawtooth', 0.05);
        try { navigator.vibrate?.(60); } catch {}
        if (mode === 'surv') loseLife();
        publish(); return;
      }
      if (!it.hit) { it.hit = true; B.reacts.push(Math.round(g.clock - it.born)); }
      if (it.k === 's' && it.hp === 2) {
        it.hp = 1; it.ttl += 250;
        floatText(B, i, tr.oneMore); tone(420, 0.06, 'square', 0.03);
        publish(); return;
      }
      B.combo++; B.pops++;
      const gain = (it.k === 'g' ? 30 : it.k === 's' ? 20 : 10) * mult(B);
      B.score += gain;
      clearCell(B, i, 'pop', it.k === 'g' ? '#E2B04A' : it.k === 's' ? '#A784D4' : it.col);
      floatText(B, i, `+${gain}`);
      tone(it.k === 'g' ? 1200 : 760 + Math.min(8, B.combo) * 40, 0.09, 'triangle', 0.06, 240);
      publish();
    }

    function expire(B: Board, i: number) {
      const it = B.cells[i];
      clearCell(B, i, 'sink');
      if (!it || it.k === 'c') return;
      B.combo = 0;
      if (mode === 'surv') { floatText(B, i, latest.current.tx.escaped, true); loseLife(); }
    }

    /* ── memory ── */
    async function memRound() {
      const g = E.g, gen = E.gen, B = E.boards[0];
      if (!g.running) return;
      if (!g.seq.length) for (let k = 0; k < 3; k++) g.seq.push(Math.floor(Math.random() * 9));
      else g.seq.push(Math.floor(Math.random() * 9));
      g.input = 0; g.accept = false; publish();
      if (!(await wait(600, gen))) return;
      const speed = Math.max(300, 560 - g.round * 20);
      for (let n = 0; n < g.seq.length; n++) {
        const i = g.seq[n];
        showItem(B, i, { id: newId(), k: 'b', hp: 1, col: COLORS[n % COLORS.length], born: 0, ttl: 0, hit: false });
        tone(400 + i * 60, 0.18); publish();
        if (!(await wait(speed, gen))) return;
        clearCell(B, i, 'sink'); publish();
        if (!(await wait(180, gen))) return;
      }
      g.accept = true; publish();
    }
    async function memTap(B: Board, i: number) {
      const g = E.g, gen = E.gen;
      if (!g.accept) return;
      const want = g.seq[g.input];
      if (i === want) {
        const col = COLORS[g.input % COLORS.length];
        B.cells[i] = null;
        clearCell(B, i, 'pop', col);
        tone(400 + i * 60, 0.12, 'triangle');
        g.input++;
        if (g.input === g.seq.length) {
          g.accept = false;
          const gain = 50 * g.seq.length; B.score += gain;
          floatText(B, i, `+${gain}`);
          g.round++; publish();
          if (await wait(500, gen)) void memRound();
          return;
        }
        publish();
      } else {
        g.accept = false;
        showItem(B, i, { id: newId(), k: 'c', hp: 1, col: '', born: 0, ttl: 0, hit: false });
        B.shakes[i]++; tone(160, 0.3, 'sawtooth', 0.05);
        showItem(B, want, { id: newId(), k: 'g', hp: 1, col: '', born: 0, ttl: 0, hit: false });
        publish();
        if (!(await wait(1100, gen))) return;
        clearCell(B, i, 'sink'); clearCell(B, want, 'sink');
        end();
      }
    }

    /* ── flow ── */
    async function countdown() {
      const gen = ++E.gen;
      getGameAudio(); // created inside the tap so sound is allowed
      E.g = idleGame();
      E.boards = Array.from({ length: nBoards }, emptyBoard);
      for (let n = 3; n > 0; n--) {
        E.overlay = { kind: 'count', n }; publish(); tone(440, 0.12);
        if (!(await wait(600, gen))) return;
      }
      E.overlay = null; tone(880, 0.2);
      E.g = { ...idleGame(), running: true, timeLeft: LEN[mode] ?? 0 };
      E.boards.forEach(B => { B.spawnIn = 300; });
      latest.current.startRound();
      publish();
      if (mode === 'mem') void memRound();
    }

    function pause() {
      if (!E.g.running || E.g.paused) return;
      E.g.paused = true; E.overlay = { kind: 'pause' }; publish();
    }
    function resume() {
      if (!E.g.paused) return;
      E.g.paused = false; E.overlay = null; last = performance.now(); publish();
    }

    function saveReact(arr: number[]) {
      if (arr.length < 5) return;
      const h = lsGet<Record<string, { sum: number; n: number }>>(REACT_KEY, {}), k = dayKey();
      h[k] = h[k] ?? { sum: 0, n: 0 };
      h[k].sum += arr.reduce((a, b) => a + b, 0); h[k].n += arr.length;
      const keys = Object.keys(h).sort();
      while (keys.length > 14) delete h[keys.shift()!];
      lsSet(REACT_KEY, h);
      setReact(h);
    }

    function end() {
      const g = E.g;
      if (!g.running) return;
      g.running = false; g.accept = false; g.paused = false;
      E.gen++;
      E.boards.forEach(B => B.cells.forEach((c, i) => { if (c) clearCell(B, i, 'sink'); }));
      tone(520, 0.15); setTimeout(() => tone(390, 0.25), 140);
      const tr = latest.current.tx;
      if (mode === 'duo') {
        const top = E.boards[0].score, bot = E.boards[1].score;
        E.overlay = { kind: 'end', title: top === bot ? 'draw' : bot > top ? 'bottomWins' : 'topWins', score: 0, bot, top, lines: [] };
        publish(); return;
      }
      const B = E.boards[0];
      const lines: string[] = [];
      let rec = false;
      if (mode === 'mem') {
        const prev = latest.current.memBest;
        rec = B.score > prev;
        if (rec) { lsSet(MEM_BEST_KEY, B.score); setMemBest(B.score); }
        lines.push(tr.memLen.replace('{n}', String(Math.max(0, g.seq.length - 1))));
        if (!rec && prev) lines.push(tr.bestIs.replace('{n}', prev.toLocaleString(latest.current.lang)));
      } else {
        const avg = avgOf(B.reacts);
        if (avg) lines.push(tr.avgReact.replace('{ms}', String(avg)).replace('{n}', String(B.pops)));
        saveReact(B.reacts);
        const prev = latest.current.best;
        // Time / Survival → leaderboard, share and challenge window (GameShell)
        const { newRecord } = B.score > 0 ? latest.current.onGameOver({ score: B.score }) : { newRecord: false };
        rec = newRecord;
        if (newRecord) setBest(B.score);
        else if (prev) lines.push(tr.bestIs.replace('{n}', prev.toLocaleString(latest.current.lang)));
      }
      E.overlay = { kind: 'end', title: rec ? 'newRecord' : 'over', score: B.score, lines };
      publish();
    }

    function quit() { end(); }

    function frame(ts: number) {
      if (!alive) return;
      const dt = Math.min(60, ts - last); last = ts;
      const g = E.g;
      if (g.running && !g.paused && mode !== 'mem') {
        g.clock += dt;
        const len = LEN[mode];
        if (len) { g.timeLeft -= dt; if (g.timeLeft <= 0) { g.timeLeft = 0; end(); } }
        if (g.running) {
          E.boards.forEach(B => {
            B.spawnIn -= dt;
            if (B.spawnIn <= 0) { spawn(B); B.spawnIn = interval(B); }
            B.cells.forEach((c, i) => { if (c) { c.ttl -= dt; if (c.ttl <= 0) expire(B, i); } });
          });
        }
        publish();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onVis = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVis);
    api.current = { countdown: () => void countdown(), pause, resume, quit, tap };
    pauseRef.current = pause;
    return () => {
      alive = false;
      E.gen++;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      api.current = null;
      pauseRef.current = null;
    };
  }, [mode, nBoards, pauseRef]);

  // Keyboard: Space / Enter start or resume; 1–9 tap a field (numpad layout, single board)
  useEffect(() => {
    const KEYPAD = [6, 7, 8, 3, 4, 5, 0, 1, 2]; // key 1 = bottom left
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      const o = snap.overlay;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (o?.kind === 'pause') { e.preventDefault(); api.current?.resume(); }
        else if (o?.kind === 'start' || o?.kind === 'end') { e.preventDefault(); startGame(); }
        return;
      }
      const k = Number(e.key);
      if (mode !== 'duo' && k >= 1 && k <= 9 && snap.g.running) { e.preventDefault(); api.current?.tap(0, KEYPAD[k - 1]); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [snap.overlay, snap.g.running, mode]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next); lsSet(SOUND_KEY, next);
    latest.current.soundOn = next;
  }

  /* ── render ── */
  const { boards, g, overlay } = snap;
  const fmt = (n: number) => n.toLocaleString(lang);
  const len = LEN[mode];
  const left = g.running ? Math.max(0, g.timeLeft) : len ?? 0;
  const secs = Math.ceil(left / 1000);
  const B0 = boards[0];
  const avg = avgOf(B0.reacts);

  let hudStats: [string, ReactNode][];
  if (mode === 'duo') {
    const top = boards[0].score, bot = boards[1].score;
    hudStats = [[tx.bottom, fmt(bot)], [tx.top, fmt(top)], [tx.leads, bot === top ? tx.tie : bot > top ? tx.leadBottom : tx.leadTop]];
  } else if (mode === 'mem') {
    hudStats = [[tx.score, fmt(B0.score)], [tx.length, g.running ? g.seq.length : 3], [tx.best, fmt(memBest)]];
  } else {
    hudStats = [[tx.score, fmt(B0.score)], [tx.combo, <span key="c" className="bp-gold">×{mult(B0)}</span>], [tx.reaction, avg ? <>{avg}<small> ms</small></> : '–']];
  }

  // Reaction history (last 7 days with data)
  const keys = Object.keys(react).sort().slice(-7);
  const vals = keys.map(k => Math.round(react[k].sum / react[k].n));
  let reactText = tx.reactEmpty;
  if (vals.length) {
    const lastVal = vals[vals.length - 1];
    reactText = (keys[keys.length - 1] === dayKey() ? tx.reactToday : tx.reactLast).replace('{ms}', String(lastVal));
    if (vals.length > 1) {
      const diff = vals[vals.length - 2] - lastVal;
      if (diff > 0) reactText += tx.faster.replace('{n}', String(diff));
      else if (diff < 0) reactText += tx.slower.replace('{n}', String(-diff));
    }
  }
  const maxV = Math.max(...vals, 400);

  const endTitle = overlay?.kind === 'end'
    ? overlay.title === 'newRecord' ? tx.newRecord : overlay.title === 'over' ? tx.over : tx[overlay.title]
    : '';
  const startBest = mode === 'mem' ? memBest : mode === 'duo' ? 0 : best;

  return (
    <div className={`bp${mode === 'duo' ? ' bp-duo' : ''}`}>
      <BalloonDefs />
      <div className="bp-top">
        <button type="button" className="bp-ibtn" aria-pressed={soundOn} aria-label={tx.sound} onClick={toggleSound}>{soundOn ? '🔊' : '🔇'}</button>
        <p className="bp-sub">{tx.modes[mode].sub}</p>
        <button type="button" className="bp-ibtn" aria-label={tx.pause} disabled={!g.running || g.paused} onClick={() => api.current?.pause()}>⏸</button>
      </div>

      <div className="bp-tabs" role="tablist">
        {MODES.map(m => (
          <button key={m} type="button" role="tab" aria-selected={m === mode} disabled={g.running && m !== mode}
            onClick={() => { if (!g.running && m !== mode) onMode(m); }}>
            {tx.modes[m].name}
          </button>
        ))}
      </div>

      <div className="bp-hud" role="group">
        <div className="bp-slot1">
          {len !== undefined && (
            <>
              <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
                <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="5" />
                <circle cx="28" cy="28" r="23" fill="none" stroke="#F3CF7E" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${144.5 * Math.max(0, left / len)} 144.5`} transform="rotate(-90 28 28)" />
              </svg>
              <span className="bp-rt">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
            </>
          )}
          {mode === 'surv' && (
            <div className="bp-lives">
              <span className="bp-lab">{tx.lives}</span>
              <div className="bp-row" role="img" aria-label={`${g.running ? g.lives : 3}/3`}>
                {[0, 1, 2].map(i => {
                  const on = i < (g.running ? g.lives : 3);
                  return <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><use href="#bp-heart" fill={on ? '#E8735A' : 'none'} stroke={on ? 'none' : '#6E8F87'} strokeWidth="2" /></svg>;
                })}
              </div>
            </div>
          )}
          {mode === 'mem' && <div className="bp-round"><span className="bp-lab">{tx.round}</span><b>{g.running ? g.round : 1}</b></div>}
        </div>
        <div className="bp-stats">
          {hudStats.map(([label, val], i) => (
            <div key={i} className="bp-stat"><span className="bp-lab">{label}</span><span className="bp-val">{val}</span></div>
          ))}
        </div>
      </div>

      <div className="bp-stage" ref={stageRef}>
        {boards.map((B, bi) => (
          <div key={bi} className={`bp-pboard${mode === 'duo' && bi === 0 ? ' flip' : ''}`}>
            {mode === 'duo' && (
              <div className="bp-pbar"><span>{bi === 0 ? tx.playerTop : tx.playerBottom}</span><span>{fmt(B.score)}</span></div>
            )}
            <div className={`bp-board${B.shake ? (B.shake % 2 ? ' bp-shake' : ' bp-shake2') : ''}`}>
              {B.cells.map((it, i) => (
                <Cell key={i} i={i} item={it} fx={B.fx[i]} floats={B.floats[i]} shake={B.shakes[i]} tx={tx}
                  onTap={() => api.current?.tap(bi, i)} />
              ))}
            </div>
            {mode === 'duo' && bi === 0 && <div className="bp-mid" />}
          </div>
        ))}

        {overlay && (
          <div className="bp-over">
            {overlay.kind === 'count' ? <span className="bp-count">{overlay.n}</span> : (
              <div className="bp-card">
                {overlay.kind === 'start' && (
                  <>
                    <h2>{tx.modes[mode].name}</h2>
                    <p>{tx.modes[mode].desc}</p>
                    {startBest > 0 && <p>{tx.yourBest.replace('{n}', '')}<b className="bp-gold">{fmt(startBest)}</b></p>}
                    <button type="button" className="bp-go" onClick={startGame}>{tx.start}</button>
                  </>
                )}
                {overlay.kind === 'pause' && (
                  <>
                    <h2>{tx.paused}</h2>
                    <p>{tx.pausedText}</p>
                    <button type="button" className="bp-go" onClick={() => api.current?.resume()}>{tx.resume}</button>
                    <button type="button" className="bp-ghost" onClick={() => api.current?.quit()}>{tx.quit}</button>
                  </>
                )}
                {overlay.kind === 'end' && (
                  <>
                    <h2>{endTitle}</h2>
                    {mode === 'duo'
                      ? <p>{tx.bottom} <b>{fmt(overlay.bot ?? 0)}</b> · {tx.top} <b>{fmt(overlay.top ?? 0)}</b></p>
                      : <><span className="bp-lab">{tx.score}</span><span className="bp-big">{fmt(overlay.score)}</span></>}
                    {overlay.lines.length > 0 && <p>{overlay.lines.join(' ')}</p>}
                    <button type="button" className="bp-go" onClick={startGame}>{mode === 'duo' ? tx.rematch : tx.again}</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {mode !== 'duo' && (
        <>
          <div className="bp-legend">
            <div><svg width="30" height="34" viewBox="0 0 80 96" aria-hidden="true"><use href="#bp-balloon" style={{ color: '#E8735A' }} /></svg><span>{tx.balloon} <b>+10</b></span></div>
            <div><svg width="30" height="34" viewBox="0 0 80 96" aria-hidden="true"><use href="#bp-balloon" style={{ color: '#E2B04A' }} /></svg><span>{tx.gold} <b className="bp-gold">+30</b></span></div>
            <div><svg width="30" height="34" viewBox="0 0 80 96" aria-hidden="true"><use href="#bp-balloon" style={{ color: '#A784D4' }} /><use href="#bp-bands" /></svg><span>{tx.strong} <b>{tx.twoHits}</b></span></div>
            <div><svg width="30" height="34" viewBox="0 0 80 96" aria-hidden="true"><use href="#bp-cactus" /></svg><span>{tx.cactus} <b className="bp-bad">−20</b></span></div>
          </div>
          <div className="bp-react">
            <div className="bp-txt"><span className="bp-lab">{tx.yourReflex}</span><span>{reactText}</span></div>
            <svg width="96" height="40" viewBox="0 0 96 40" role="img" aria-label={tx.reactAria}>
              {vals.map((v, i) => {
                const hh = Math.max(4, Math.round(36 * v / maxV));
                const x0 = 96 - vals.length * 14 + 4;
                return <rect key={keys[i]} x={x0 + i * 14} y={40 - hh} width="10" height={hh} rx="3" fill={i === vals.length - 1 ? '#F3CF7E' : 'rgba(255,255,255,.2)'} />;
              })}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

function itemContent(it: Item): ReactNode {
  if (it.k === 'c') return <use href="#bp-cactus" x="24" y="10" width="56" height="78" />;
  const col = it.k === 'g' ? '#E2B04A' : it.k === 's' ? '#A784D4' : it.col;
  return (
    <>
      <ellipse cx="52" cy="44" rx="46" ry="44" fill="url(#bp-glow)" />
      <use href="#bp-balloon" x="20" y="8" width="64" height="86" style={{ color: col }} />
      {it.k === 's' && <use href={it.hp === 2 ? '#bp-bands' : '#bp-crack'} x="20" y="8" width="64" height="86" />}
      {it.k === 'g' && (
        <>
          <use href="#bp-star" x="80" y="22" width="14" height="14" style={{ fill: '#FFF3D1' }} />
          <use href="#bp-star" x="10" y="36" width="10" height="10" style={{ fill: '#FFF3D1' }} />
        </>
      )}
    </>
  );
}

function Burst({ col }: { col: string }) {
  return (
    <g className="bp-it pop">
      <path d="M52 30 L58 41 L71 35 L65 48 L78 53 L65 58 L71 71 L58 65 L52 76 L46 65 L33 71 L39 58 L26 53 L39 48 L33 35 L46 41 Z" fill="none" stroke={col} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="16" y="28" width="7" height="4" rx="1" fill="#E2B04A" transform="rotate(-25 19 30)" />
      <rect x="82" y="32" width="7" height="4" rx="1" fill={col} transform="rotate(30 85 34)" />
      <rect x="22" y="70" width="6" height="4" rx="1" fill="#A784D4" />
      <rect x="78" y="68" width="6" height="4" rx="1" fill="#F3CF7E" transform="rotate(-20 81 70)" />
      <circle cx="30" cy="44" r="2.5" fill="#F3EEE4" /><circle cx="78" cy="52" r="2.5" fill={col} /><circle cx="64" cy="22" r="2" fill="#7FD3B2" />
    </g>
  );
}

function Cell({ i, item, fx, floats, shake, tx, onTap }: {
  i: number; item: Item | null; fx: Fx | null; floats: Float[]; shake: number; tx: BalloonTexts; onTap: () => void;
}) {
  const lastPointer = useRef(0);
  const danger = item?.k === 'c';
  const what = item ? ({ b: tx.itemBalloon, g: tx.itemGold, s: tx.itemStrong, c: tx.itemCactus })[item.k] : null;
  return (
    <button
      type="button" className={`bp-cell${danger ? ' danger' : ''}${shake ? (shake % 2 ? ' bp-shake' : ' bp-shake2') : ''}`}
      aria-label={`${tx.cell.replace('{n}', String(i + 1))}${what ? `, ${what}` : ''}`}
      onPointerDown={e => { lastPointer.current = e.timeStamp; onTap(); }}
      onClick={e => { if (e.timeStamp - lastPointer.current > 600) onTap(); }}
    >
      <svg viewBox="0 0 104 110" aria-hidden="true">
        <rect width="104" height="110" rx="22" fill="#174A40" />
        <ellipse cx="52" cy="88" rx="38" ry="12" fill="url(#bp-hole)" />
        <g>
          {item && <g key={item.id} className="bp-it">{itemContent(item)}</g>}
          {!item && fx?.kind === 'sink' && fx.item && <g key={`s${fx.id}`} className="bp-it sink">{itemContent(fx.item)}</g>}
          {!item && fx?.kind === 'pop' && <Burst key={`p${fx.id}`} col={fx.col} />}
        </g>
        <path d="M12 88 A40 13 0 0 0 92 88 L92 108 Q92 110 90 110 L14 110 Q12 110 12 108 Z" fill="#174A40" />
        <path d="M14 88 A38 12 0 0 0 90 88" fill="none" stroke={danger ? '#E8735A' : '#E2B04A'} strokeOpacity={item ? 0.8 : 0.5} strokeWidth="2" />
      </svg>
      {floats.map(f => <span key={f.id} className={`bp-flt${f.bad ? ' bad' : ''}`}>{f.text}</span>)}
    </button>
  );
}

function BalloonDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="bp-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#F3CF7E" stopOpacity=".6" /><stop offset="1" stopColor="#F3CF7E" stopOpacity="0" /></radialGradient>
        <radialGradient id="bp-hole" cx=".5" cy=".35" r=".65"><stop offset="0" stopColor="#030C0A" /><stop offset="1" stopColor="#0B2420" /></radialGradient>
        <radialGradient id="bp-shade" cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".25" /><stop offset=".6" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity=".28" /></radialGradient>
        <symbol id="bp-balloon" viewBox="0 0 80 96">
          <path d="M40 70 Q34 80 40 88 Q46 94 40 96" fill="none" stroke="#E9E2D4" strokeWidth="1.6" />
          <path d="M40 4 C59 4 70 19 70 35 C70 53 55 66 40 68 C25 66 10 53 10 35 C10 19 21 4 40 4 Z" fill="currentColor" />
          <path d="M40 4 C59 4 70 19 70 35 C70 53 55 66 40 68 C25 66 10 53 10 35 C10 19 21 4 40 4 Z" fill="url(#bp-shade)" />
          <path d="M35 67 L45 67 L42 72 L38 72 Z" fill="currentColor" />
          <ellipse cx="27" cy="22" rx="5.5" ry="10" transform="rotate(28 27 22)" fill="#FFFFFF" opacity=".55" />
        </symbol>
        <symbol id="bp-bands" viewBox="0 0 80 96">
          <path d="M12 26 Q40 34 68 26" fill="none" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="5" strokeLinecap="round" />
          <path d="M11 42 Q40 50 69 42" fill="none" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="5" strokeLinecap="round" />
        </symbol>
        <symbol id="bp-crack" viewBox="0 0 80 96">
          <path d="M40 10 L36 22 L44 28 L37 40 L43 48" fill="none" stroke="#1B1430" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </symbol>
        <symbol id="bp-cactus" viewBox="0 0 80 96">
          <path d="M32 70 L32 24 Q32 12 40 12 Q48 12 48 24 L48 70 Z" fill="#5FA35A" />
          <path d="M32 50 L22 50 Q16 50 16 44 L16 32 Q16 28 20 28 Q24 28 24 32 L24 42 L32 42 Z" fill="#5FA35A" />
          <path d="M48 44 L58 44 Q64 44 64 38 L64 28 Q64 24 60 24 Q56 24 56 28 L56 36 L48 36 Z" fill="#5FA35A" />
          <path d="M40 16 L40 68" stroke="#3F7C3B" strokeWidth="2" />
          <path d="M30 26 L26 24 M30 38 L26 37 M50 30 L54 28 M50 54 L54 53 M30 58 L26 58 M14 34 L10 33 M66 32 L70 31" stroke="#E9E2D4" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M22 68 L58 68 L54 92 L26 92 Z" fill="#C0704F" />
          <rect x="19" y="64" width="42" height="8" rx="3" fill="#D98761" />
        </symbol>
        <symbol id="bp-star" viewBox="0 0 24 24"><path d="M12 2l3 6.6 7 .7-5.3 4.7 1.6 7L12 17.3 5.7 21l1.6-7L2 9.3l7-.7z" /></symbol>
        <symbol id="bp-heart" viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" /></symbol>
      </defs>
    </svg>
  );
}

function BalloonStyles() {
  return (
    <style>{`
      .bp-placeholder { min-height: 640px; }
      .bp {
        --felt1: #2C7D6B; --felt2: #1E5E51; --felt3: #123C35; --ink: #F3EEE4; --muted: #A9C3BB; --soft: #CFE0DA;
        --gold: #E2B04A; --gold-hi: #F3CF7E; --coral: #E8735A; --coral-hi: #F5A08D;
        display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: 20px; color: var(--ink);
        background: #0E2321; border: 1px solid rgba(232,115,90,.25); -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
      }
      .bp-top { display: flex; align-items: center; gap: 10px; }
      .bp-sub { flex: 1; margin: 0; text-align: center; font-size: 13px; font-weight: 700; color: var(--muted); }
      .bp-ibtn { width: 42px; height: 42px; flex-shrink: 0; border-radius: 13px; border: none; cursor: pointer; font-size: 17px; background: rgba(255,255,255,.07); color: var(--ink); }
      .bp-ibtn[aria-pressed="true"] { background: rgba(226,176,74,.22); }
      .bp-ibtn:disabled { opacity: .35; cursor: default; }
      .bp-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; padding: 4px; border-radius: 16px; background: rgba(255,255,255,.05); }
      .bp-tabs button { min-height: 40px; border: none; border-radius: 12px; background: none; color: var(--soft); font: 700 13px 'Poppins', sans-serif; cursor: pointer; padding: 0 4px; }
      .bp-tabs button[aria-selected="true"] { background: var(--gold); color: #1D1608; font-weight: 800; }
      .bp-tabs button:disabled:not([aria-selected="true"]) { opacity: .45; cursor: default; }
      .bp-hud { border-radius: 20px; padding: 8px 14px; display: flex; align-items: center; gap: 12px; min-height: 72px; background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .bp-slot1 { position: relative; width: 56px; height: 56px; flex: none; display: flex; align-items: center; justify-content: center; }
      .bp-rt { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .bp-lives { display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .bp-row { display: flex; gap: 2px; }
      .bp-round { display: flex; flex-direction: column; align-items: center; line-height: 1; }
      .bp-round b { font-size: 24px; font-weight: 800; }
      .bp-stats { flex: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; min-width: 0; }
      .bp-stat { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .bp-lab { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bp-val { font-size: 21px; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bp-val small { font-size: 12px; font-weight: 700; color: var(--muted); }
      .bp-gold { color: var(--gold-hi); }
      .bp-bad { color: var(--coral-hi); }
      .bp-stage { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 300px; justify-content: center; }
      .bp-pboard { display: flex; flex-direction: column; gap: 6px; align-items: stretch; width: min(100%, 420px); }
      .bp-duo .bp-pboard { width: max(170px, min(100%, calc((100dvh - 400px) / 2 * 0.96), 330px)); }
      .bp-pboard.flip { transform: rotate(180deg); }
      .bp-pbar { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 14px; padding: 0 6px; }
      .bp-pbar span:last-child { color: var(--gold-hi); font-variant-numeric: tabular-nums; }
      .bp-mid { height: 2px; margin-top: 4px; background: linear-gradient(90deg, transparent, var(--gold), transparent); opacity: .6; }
      .bp-board {
        position: relative; border-radius: 26px; padding: 3.6%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.6%;
        background: radial-gradient(120% 90% at 50% 42%, var(--felt1) 0%, var(--felt2) 52%, var(--felt3) 100%);
        box-shadow: inset 0 0 0 1px rgba(226,176,74,.45), inset 0 0 0 7px rgba(0,0,0,.18), inset 0 24px 60px rgba(0,0,0,.35);
      }
      .bp-board::before {
        content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
        background-image: repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,.06) 0 2px, transparent 2px 6px);
      }
      .bp-cell { position: relative; width: 100%; aspect-ratio: 104 / 110; padding: 0; border: none; background: none; display: block; touch-action: manipulation; border-radius: 21%; cursor: pointer; }
      .bp-cell svg { display: block; width: 100%; height: 100%; overflow: visible; }
      .bp-cell.danger::after { content: ""; position: absolute; inset: 3%; border-radius: 19%; border: 2.5px dashed var(--coral); pointer-events: none; }
      .bp-it { animation: bpRise .17s cubic-bezier(.2,.8,.3,1.25) both; }
      .bp-it.sink { animation: bpSink .2s ease-in both; }
      .bp-it.pop { animation: bpPop .38s ease-out both; transform-box: fill-box; transform-origin: center; }
      @keyframes bpRise { from { transform: translateY(64px); } to { transform: none; } }
      @keyframes bpSink { to { transform: translateY(70px); } }
      @keyframes bpPop { 0% { transform: scale(.7); opacity: 1; } 100% { transform: scale(1.35); opacity: 0; } }
      .bp-flt {
        position: absolute; left: 50%; top: 6%; transform: translateX(-50%); font-weight: 800; font-size: clamp(13px, 4.2vw, 17px); color: #FFF3D1;
        pointer-events: none; text-shadow: 0 2px 6px rgba(0,0,0,.5); animation: bpFlt .75s ease-out both; white-space: nowrap;
      }
      .bp-flt.bad { color: var(--coral-hi); }
      @keyframes bpFlt { from { opacity: 1; transform: translate(-50%, 8px); } to { opacity: 0; transform: translate(-50%, -22px); } }
      .bp-shake { animation: bpShake .35s; }
      .bp-shake2 { animation: bpShake2 .35s; }
      @keyframes bpShake2 { 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }
      @keyframes bpShake { 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }
      .bp-legend { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
      .bp-legend div { display: flex; flex-direction: column; align-items: center; gap: 3px; }
      .bp-legend span { font-size: 12px; font-weight: 700; color: var(--soft); text-align: center; }
      .bp-legend b { color: var(--ink); }
      .bp-react { border-radius: 20px; padding: 10px 16px; display: flex; align-items: center; gap: 14px; min-height: 62px; background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .bp-txt { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .bp-txt span:last-child { font-size: 14px; font-weight: 700; }
      .bp-over {
        position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; padding: 12px;
        background: rgba(8,26,23,.7); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); border-radius: 26px;
      }
      .bp-card {
        width: 100%; max-width: 310px; border-radius: 24px; padding: 22px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
        background: linear-gradient(180deg, #183F37, #10302A); box-shadow: inset 0 0 0 1px rgba(226,176,74,.45), 0 20px 50px rgba(0,0,0,.4);
      }
      .bp-card h2 { margin: 0; font: 800 25px 'Poppins', sans-serif; text-wrap: balance; }
      .bp-card p { margin: 0; color: var(--soft); line-height: 1.45; font-size: 14px; }
      .bp-big { font-size: 42px; font-weight: 800; color: var(--gold-hi); font-variant-numeric: tabular-nums; line-height: 1; }
      .bp-go { width: 100%; min-height: 54px; border: none; border-radius: 18px; cursor: pointer; background: linear-gradient(180deg, var(--gold-hi), var(--gold)); color: #1D1608; font: 800 17px 'Poppins', sans-serif; box-shadow: 0 6px 18px rgba(226,176,74,.25); }
      .bp-ghost { width: 100%; min-height: 46px; border: none; border-radius: 14px; cursor: pointer; color: var(--ink); font-weight: 700; background: rgba(255,255,255,.06); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .bp-count { font: 800 84px 'Poppins', sans-serif; color: var(--gold-hi); text-shadow: 0 6px 30px rgba(0,0,0,.4); }
      @media (prefers-reduced-motion: reduce) { .bp-it, .bp-it.sink, .bp-it.pop, .bp-flt, .bp-shake, .bp-shake2 { animation-duration: .01s; } }
      @media (max-width: 380px) { .bp-tabs button { font-size: 12px; } .bp-val { font-size: 18px; } }
    `}</style>
  );
}
