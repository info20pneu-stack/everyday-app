'use client';

import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { dailyLeaderboardId, utcDayKey } from '../../../lib/gamesCatalog';
import GameShell, { useGameShell } from './GameShell';

/* Daily Blocks — port of games-reference/daily-blocks.
   10×20 well, 7 pieces from a 7-bag shuffled by a generator seeded with the UTC date,
   so every player gets the same order today. Hold, next, ghost piece, level up every 10 lines,
   line clears 100/300/500/800 × level (+1 per soft-drop row, +2 per hard-drop row). */

const COLS = 10, ROWS = 20;
const LOCK_DELAY = 500;

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Matrix = number[][];
type Phase = 'menu' | 'play' | 'pause' | 'over';
type Action = 'left' | 'right' | 'rot' | 'soft' | 'drop';

const SHAPES: Record<PieceType, Matrix> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};
const TYPES = Object.keys(SHAPES) as PieceType[];
const COLORS: Record<PieceType, string> = {
  I: '#38E1FF', O: '#FFC94D', T: '#B06CFF', S: '#2FE39A', Z: '#FF5470', J: '#5D7CFF', L: '#FF9A3D',
};

interface Piece { type: PieceType; m: Matrix; x: number; y: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; col: string }
interface Stats { score: number; lines: number; level: number }
interface Result extends Stats { newRecord: boolean }

/** FNV-1a hash of the seed + mulberry32 — same generator as the demo, so the order matches it. */
function seededRandom(seed: string): () => number {
  let s = 2166136261;
  for (const c of seed) { s ^= c.charCodeAt(0); s = Math.imul(s, 16777619) >>> 0; }
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCell(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, alpha = 1) {
  c.globalAlpha = alpha;
  c.fillStyle = col; c.fillRect(x + 1, y + 1, s - 2, s - 2);
  c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(x + 1, y + 1, s - 2, Math.max(2, s * 0.18));
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 1, y + s - 1 - Math.max(2, s * 0.14), s - 2, Math.max(2, s * 0.14));
  c.globalAlpha = 1;
}

interface Engine {
  start: (seed: string) => void;
  togglePause: () => void;
  act: (a: Action) => void;
  hold: () => void;
  phase: () => Phase;
}

export default function DailyBlocks() {
  const [day, setDay] = useState(utcDayKey);
  const engineRef = useRef<Engine | null>(null);
  return (
    <GameShell
      gameId="daily-blocks"
      leaderboardId={dailyLeaderboardId('dailyblocks', day)}
      onHide={() => { if (engineRef.current?.phase() === 'play') engineRef.current.togglePause(); }}
    >
      <DailyBlocksGame day={day} onDayChange={setDay} engineRef={engineRef} />
    </GameShell>
  );
}

function DailyBlocksGame({ day, onDayChange, engineRef }: {
  day: string;
  onDayChange: (d: string) => void;
  engineRef: React.RefObject<Engine | null>;
}) {
  const { t, lang } = useLang();
  const tb = t.dailyBlocks;
  const { onGameOver, startRound, best } = useGameShell();

  const appRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLCanvasElement>(null);
  const holdRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);

  const [phase, setPhase] = useState<Phase>('menu');
  const [stats, setStats] = useState<Stats>({ score: 0, lines: 0, level: 1 });
  const [flash, setFlash] = useState<{ text: string; key: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [shareNote, setShareNote] = useState('');

  const bestScore = best?.score ?? 0;

  // Latest values for the game loop, which runs outside React's render cycle
  const latest = useRef({ onGameOver, startRound, tb });
  useEffect(() => { latest.current = { onGameOver, startRound, tb }; });

  useEffect(() => {
    const cv = boardRef.current!;
    const well = wellRef.current!;
    const ctx = cv.getContext('2d')!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let CELL = 24;
    let grid: (PieceType | null)[][] = [];
    let cur: Piece | null = null;
    let nextQ: PieceType[] = [];
    let holdP: PieceType | null = null;
    let canHold = true;
    let score = 0, lines = 0, level = 1;
    let rand: () => number = Math.random;
    let bag: PieceType[] = [];
    let dropT = 0, lockT = 0, lastT = 0;
    let particles: Particle[] = [];
    let clearing: { rows: number[]; t: number } | null = null;
    let state: Phase = 'menu';
    let raf = 0;

    const setState = (p: Phase) => { state = p; setPhase(p); };
    const pushStats = () => setStats({ score, lines, level });
    const showFlash = (text: string) => { if (text) setFlash(f => ({ text, key: (f?.key ?? 0) + 1 })); };

    function tone(freq: number, dur: number) {
      const ac = getGameAudio();
      if (!ac) return;
      try {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur + 0.05);
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + dur + 0.06);
      } catch {}
    }

    function newBag(): PieceType[] {
      const b = TYPES.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    }
    function take(): PieceType {
      if (!bag.length) bag = newBag();
      return bag.shift()!;
    }
    function spawn(type: PieceType): Piece {
      const m = SHAPES[type].map(r => r.slice());
      return { type, m, x: Math.floor((COLS - m[0].length) / 2), y: type === 'I' ? -1 : 0 };
    }

    function reset(seed: string) {
      rand = seededRandom(seed);
      bag = [];
      grid = Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
      nextQ = [take(), take(), take()];
      cur = spawn(take());
      holdP = null; canHold = true;
      score = 0; lines = 0; level = 1;
      dropT = 0; lockT = 0; particles = []; clearing = null;
      pushStats();
      drawMini();
    }

    function collide(p: Piece, dx = 0, dy = 0, m = p.m): boolean {
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const x = p.x + c + dx, y = p.y + r + dy;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && grid[y][x]) return true;
      }
      return false;
    }

    function rotate() {
      if (!cur) return;
      const m = cur.m, n = m.length;
      const r = m.map((row, i) => row.map((_, j) => m[n - 1 - j][i]));
      for (const k of [0, -1, 1, -2, 2]) {
        if (!collide(cur, k, 0, r)) { cur.m = r; cur.x += k; lockT = 0; tone(660, 0.04); return; }
      }
    }
    function move(d: number) {
      if (cur && !collide(cur, d, 0)) { cur.x += d; lockT = 0; tone(420, 0.025); }
    }
    function soft() {
      if (!cur) return;
      if (!collide(cur, 0, 1)) { cur.y++; score += 1; pushStats(); dropT = 0; } else lock();
    }
    function hard() {
      if (!cur) return;
      let n = 0;
      while (!collide(cur, 0, 1)) { cur.y++; n++; }
      score += n * 2;
      lock(true);
    }
    function hold() {
      if (!canHold || state !== 'play' || !cur || clearing) return;
      const type = cur.type;
      if (holdP) cur = spawn(holdP);
      else { cur = spawn(nextQ.shift()!); nextQ.push(take()); }
      holdP = type; canHold = false; lockT = 0; dropT = 0;
      drawMini();
      tone(500, 0.05);
    }
    const speed = () => Math.max(70, 800 - (level - 1) * 68);

    function lock(hardDrop = false) {
      if (!cur) return;
      for (let r = 0; r < cur.m.length; r++) for (let c = 0; c < cur.m[r].length; c++) {
        if (!cur.m[r][c]) continue;
        const y = cur.y + r;
        if (y < 0) { gameOver(); return; }
        grid[y][cur.x + c] = cur.type;
      }
      if (hardDrop) tone(200, 0.08);
      const full: number[] = [];
      for (let r = 0; r < ROWS; r++) if (grid[r].every(Boolean)) full.push(r);
      if (full.length) {
        if (!reducedMotion) {
          for (const r of full) for (let c = 0; c < COLS; c++) for (let k = 0; k < 3; k++) {
            particles.push({
              x: (c + 0.5) * CELL, y: (r + 0.5) * CELL,
              vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 1) * 5, life: 1, col: COLORS[grid[r][c]!],
            });
          }
        }
        clearing = { rows: full, t: 0 };
        score += [0, 100, 300, 500, 800][full.length] * level;
        lines += full.length;
        const nl = Math.floor(lines / 10) + 1;
        const tr = latest.current.tb;
        if (nl > level) { level = nl; showFlash(tr.levelUp.replace('{n}', String(level))); }
        else showFlash(['', '', tr.double, tr.triple, tr.quad][full.length] ?? '');
        if (full.length === 4) [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.15), i * 70));
        else tone(600 + full.length * 120, 0.18);
      }
      pushStats();
      cur = spawn(nextQ.shift()!);
      nextQ.push(take());
      canHold = true; lockT = 0;
      drawMini();
      if (collide(cur, 0, 0)) gameOver();
    }

    function clearRows() {
      if (!clearing) return;
      for (const r of clearing.rows) { grid.splice(r, 1); grid.unshift(Array<PieceType | null>(COLS).fill(null)); }
      clearing = null;
    }

    function gameOver() {
      if (state === 'over') return;
      setState('over');
      tone(150, 0.4);
      const final = { score, lines, level };
      const { newRecord } = final.score > 0 ? latest.current.onGameOver(final.score) : { newRecord: false };
      setResult({ ...final, newRecord });
    }

    function draw() {
      ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
      ctx.strokeStyle = 'rgba(93,76,255,.08)'; ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL + 0.5, 0); ctx.lineTo(c * CELL + 0.5, ROWS * CELL); ctx.stroke(); }
      for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL + 0.5); ctx.lineTo(COLS * CELL, r * CELL + 0.5); ctx.stroke(); }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;
        const fl = clearing?.rows.includes(r);
        drawCell(ctx, c * CELL, r * CELL, CELL, fl ? '#ffffff' : COLORS[cell], fl ? 1 - clearing!.t : 1);
      }
      if (cur && state !== 'over' && state !== 'menu' && !clearing) {
        let gy = 0;
        while (!collide(cur, 0, gy + 1)) gy++;
        for (let r = 0; r < cur.m.length; r++) for (let c = 0; c < cur.m[r].length; c++) {
          if (!cur.m[r][c]) continue;
          const x = (cur.x + c) * CELL;
          if (cur.y + r + gy >= 0) { // ghost
            ctx.strokeStyle = COLORS[cur.type]; ctx.globalAlpha = 0.45; ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, (cur.y + r + gy) * CELL + 3, CELL - 6, CELL - 6);
            ctx.globalAlpha = 1;
          }
          if (cur.y + r >= 0) drawCell(ctx, x, (cur.y + r) * CELL, CELL, COLORS[cur.type]);
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (state === 'play') { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.03; }
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

    function drawPiece(canvas: HTMLCanvasElement | null, type: PieceType | null, dim: boolean) {
      if (!canvas) return;
      const c = canvas.getContext('2d')!;
      c.clearRect(0, 0, 96, 72);
      if (!type) return;
      const cells: [number, number][] = [];
      SHAPES[type].forEach((row, r) => row.forEach((v, k) => { if (v) cells.push([k, r]); }));
      const xs = cells.map(a => a[0]), ys = cells.map(a => a[1]);
      const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
      const s = 18, w = (maxx - minx + 1) * s, h = (maxy - miny + 1) * s;
      cells.forEach(([x, y]) => drawCell(c, (96 - w) / 2 + (x - minx) * s, (72 - h) / 2 + (y - miny) * s, s, dim ? '#3A3F7A' : COLORS[type]));
    }
    function drawMini() {
      drawPiece(nextRef.current, nextQ[0] ?? null, false);
      drawPiece(holdRef.current, holdP, !canHold);
    }

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      CELL = Math.max(12, Math.floor(Math.min(well.clientHeight / ROWS, well.clientWidth / COLS)));
      cv.width = COLS * CELL * dpr; cv.height = ROWS * CELL * dpr;
      cv.style.width = `${COLS * CELL}px`; cv.style.height = `${ROWS * CELL}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function loop(now: number) {
      const dt = Math.min(100, now - (lastT || now));
      lastT = now;
      if (state === 'play' && cur) {
        if (clearing) { clearing.t += dt / 180; if (clearing.t >= 1) clearRows(); }
        else {
          dropT += dt;
          if (collide(cur, 0, 1)) { lockT += dt; if (lockT > LOCK_DELAY) lock(); }
          else if (dropT >= speed()) { cur.y++; dropT = 0; }
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    function act(a: Action) {
      if (state !== 'play' || clearing) return;
      if (a === 'left') move(-1);
      else if (a === 'right') move(1);
      else if (a === 'rot') rotate();
      else if (a === 'soft') soft();
      else hard();
    }

    function start(seed: string) {
      getGameAudio(); // created inside the user gesture so sound is allowed
      setResult(null);
      setFlash(null);
      reset(seed);
      latest.current.startRound();
      lastT = 0;
      setState('play');
    }
    function togglePause() {
      if (state === 'play') setState('pause');
      else if (state === 'pause') { lastT = 0; setState('play'); }
    }

    engineRef.current = { start, togglePause, act, hold, phase: () => state };

    // Demo board behind the start screen
    reset(utcDayKey());
    ([[19, 'IIIIZZ.LLL'], [18, 'JTT.ZZSSOL'], [17, 'JJT...SSO.']] as const).forEach(([r, s]) =>
      [...s].forEach((ch, c) => { if (ch !== '.') grid[r][c] = ch as PieceType; }));

    const onVisibility = () => { if (document.hidden && state === 'play') togglePause(); };
    document.addEventListener('visibilitychange', onVisibility);
    const ro = new ResizeObserver(layout);
    ro.observe(well);
    layout();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      engineRef.current = null;
    };
  }, [engineRef]);

  /** Starts a round with today's set (switches to the new day after midnight UTC). */
  function play() {
    const today = utcDayKey();
    if (today !== day) onDayChange(today);
    setShareNote('');
    engineRef.current?.start(today);
    // On small screens bring the whole game (stats → controls) into view
    const app = appRef.current;
    if (app) {
      const r = app.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight - 70) app.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  // Keyboard: ← → move, ↑/X rotate, ↓ soft drop, Space hard drop, C/Shift hold, P/Esc pause
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      const eng = engineRef.current;
      if (!eng) return;
      const k = e.key;
      const state = eng.phase();
      if (state !== 'play') {
        if (target?.closest('button, a, summary')) return; // let focused controls handle Enter / Space
        if (k === 'Enter' || k === ' ') {
          e.preventDefault();
          if (state === 'pause') eng.togglePause(); else playRef.current();
        } else if (state === 'pause' && (k === 'p' || k === 'P' || k === 'Escape')) eng.togglePause();
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
      if (k === 'ArrowLeft') eng.act('left');
      else if (k === 'ArrowRight') eng.act('right');
      else if (k === 'ArrowUp' || k === 'x' || k === 'X') eng.act('rot');
      else if (k === 'ArrowDown') eng.act('soft');
      else if (k === ' ') { if (!e.repeat) eng.act('drop'); }
      else if (k === 'c' || k === 'C' || k === 'Shift') eng.hold();
      else if (k === 'p' || k === 'P' || k === 'Escape') eng.togglePause();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engineRef]);

  // Gestures on the board: tap = rotate, swipe sideways = move, swipe down = soft drop, quick swipe down = hard drop
  const gesture = useRef<{ x: number; y: number; t: number; moved: boolean; id: number } | null>(null);
  function cellSize() { return (boardRef.current?.clientWidth ?? 240) / COLS; }
  function onBoardDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (engineRef.current?.phase() !== 'play') return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, id: e.pointerId };
  }
  function onBoardMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = gesture.current, eng = engineRef.current;
    if (!g || g.id !== e.pointerId || !eng || eng.phase() !== 'play') return;
    const cell = cellSize();
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (Math.abs(dx) > cell) { eng.act(dx > 0 ? 'right' : 'left'); g.x = e.clientX; g.moved = true; }
    else if (dy > cell * 2.2 && performance.now() - g.t < 300 && !g.moved) { eng.act('drop'); gesture.current = null; }
    else if (dy > cell) { eng.act('soft'); g.y = e.clientY; g.moved = true; }
  }
  function onBoardUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = gesture.current;
    if (g && g.id === e.pointerId && !g.moved) engineRef.current?.act('rot');
    gesture.current = null;
  }

  async function share() {
    if (!result) return;
    const text = tb.shareText
      .replace('{date}', day)
      .replace('{score}', result.score.toLocaleString(lang))
      .replace('{lines}', String(result.lines))
      .replace('{level}', String(result.level));
    const url = 'https://www.everyday1234567.com/games/daily-blocks';
    const full = `${text}\n${url}`;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) {
      try { await navigator.share({ text: full }); return; } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      setShareNote(tb.copied);
    } catch {
      setShareNote(full.replace(/\n/g, ' · '));
    }
  }
  const dateLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'numeric', year: 'numeric' });

  return (
    <div className="db-app" ref={appRef}>
      <div className="db-top">
        <button type="button" className="db-box db-hold" onPointerDown={e => { e.preventDefault(); engineRef.current?.hold(); }}
          aria-label={tb.holdAria} title={tb.holdAria}>
          <small>{tb.hold}</small>
          <canvas ref={holdRef} width={96} height={72} />
        </button>
        <div className="db-stats" aria-live="polite">
          <div className="db-box db-score"><small>{tb.score}</small><b className="tabular-nums">{stats.score.toLocaleString(lang)}</b></div>
          <div className="db-box"><small>{tb.lines}</small><b className="tabular-nums">{stats.lines}</b></div>
          <div className="db-box"><small>{tb.level}</small><b className="tabular-nums">{stats.level}</b></div>
        </div>
        <div className="db-box">
          <small>{tb.next}</small>
          <canvas ref={nextRef} width={96} height={72} />
        </div>
      </div>

      <div className="db-well" ref={wellRef}>
        <canvas
          ref={boardRef}
          className="db-board"
          role="img"
          aria-label={t.gamesHub.name_dailyBlocks}
          onPointerDown={onBoardDown}
          onPointerMove={onBoardMove}
          onPointerUp={onBoardUp}
          onPointerCancel={() => { gesture.current = null; }}
        />
        {(phase === 'play' || phase === 'pause') && (
          <button type="button" className="db-pause" onClick={() => engineRef.current?.togglePause()} aria-label={tb.pauseAria}>
            {phase === 'pause' ? '▶' : '❚❚'}
          </button>
        )}
        {flash && <div key={flash.key} className="db-flash">{flash.text}</div>}

        {phase === 'menu' && (
          <div className="db-overlay">
            <span className="db-date tabular-nums">{dateLabel}</span>
            <p>{tb.intro}</p>
            <button type="button" className="gx-btn gx-primary db-cta" onClick={play}>{tb.play}</button>
            <div className="db-keys">{tb.gestures}<br />{tb.keys}</div>
          </div>
        )}

        {phase === 'pause' && (
          <div className="db-overlay">
            <h2>{tb.paused}</h2>
            <p>{tb.score}: {stats.score.toLocaleString(lang)}</p>
            <button type="button" className="gx-btn gx-primary db-cta" onClick={() => engineRef.current?.togglePause()}>{tb.resume}</button>
          </div>
        )}

        {phase === 'over' && result && (
          <div className="db-overlay">
            <h2>{result.newRecord ? tb.newRecord : tb.gameOver}</h2>
            <div className="db-big tabular-nums">{result.score.toLocaleString(lang)}</div>
            <p>
              {tb.linesLevel.replace('{lines}', String(result.lines)).replace('{level}', String(result.level))}
              <br />
              {tb.todayBest.replace('{n}', Math.max(bestScore, result.score).toLocaleString(lang))}
            </p>
            <button type="button" className="gx-btn gx-primary db-cta" onClick={share}>{tb.share}</button>
            <div className="db-toast" aria-live="polite">{shareNote}</div>
            <button type="button" className="gx-btn gx-ghost db-cta" onClick={play}>{tb.again}</button>
          </div>
        )}
      </div>

      <div className="db-controls">
        <RepeatButton action="left" label={tb.leftAria} engineRef={engineRef}>◀</RepeatButton>
        <RepeatButton action="rot" label={tb.rotateAria} engineRef={engineRef}>⟳</RepeatButton>
        <RepeatButton action="drop" label={tb.dropAria} engineRef={engineRef} accent>⤓</RepeatButton>
        <RepeatButton action="soft" label={tb.softAria} engineRef={engineRef}>▼</RepeatButton>
        <RepeatButton action="right" label={tb.rightAria} engineRef={engineRef}>▶</RepeatButton>
      </div>

      <DailyBlocksStyles />
    </div>
  );
}

/** Control button; left / right / soft drop repeat while held. */
function RepeatButton({ action, label, engineRef, accent, children }: {
  action: Action;
  label: string;
  engineRef: React.RefObject<Engine | null>;
  accent?: boolean;
  children: React.ReactNode;
}) {
  const [on, setOn] = useState(false);
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; rep?: ReturnType<typeof setInterval> }>({});
  const repeats = action === 'left' || action === 'right' || action === 'soft';

  function stop() {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.rep);
    setOn(false);
  }
  useEffect(() => stop, []);

  return (
    <button
      type="button"
      className={`gx-tile${accent || on ? ' is-on' : ''}`}
      aria-label={label}
      onPointerDown={e => {
        e.preventDefault();
        stop();
        setOn(true);
        engineRef.current?.act(action);
        if (repeats) {
          timers.current.delay = setTimeout(() => {
            timers.current.rep = setInterval(() => engineRef.current?.act(action), action === 'soft' ? 40 : 60);
          }, 170);
        }
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={e => e.preventDefault()}
      // Keyboard users activate the button with Enter (no auto-repeat)
      onClick={e => { if (e.detail === 0) engineRef.current?.act(action); }}
    >
      {children}
    </button>
  );
}

function DailyBlocksStyles() {
  return (
    <style>{`
      .db-app {
        --db-card: #0B0F2A; --db-line: #1E2350; --db-ink: #F2F3FF; --db-dim: #9AA0D0;
        --db-accent: #5D4CFF; --db-accent2: #9B8CFF; --db-gold: #FFC94D; --db-good: #2FE39A;
        height: clamp(540px, calc(100dvh - 210px), 860px);
        scroll-margin-top: 66px;
        max-width: 520px; margin: 0 auto;
        display: flex; flex-direction: column; gap: 10px;
        color: var(--db-ink); font-family: 'Poppins', system-ui, sans-serif;
        user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
        direction: ltr;
      }
      .db-top { display: grid; grid-template-columns: 64px minmax(0,1fr) 64px; gap: 8px; }
      .db-box {
        background: linear-gradient(160deg, #1C2258, #121640); border: 1px solid rgba(255,255,255,.07); border-radius: 14px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 6px 4px; gap: 2px; min-width: 0; color: inherit; font: inherit;
      }
      .db-box small {
        font-size: 10px; letter-spacing: .1em; color: var(--db-dim); text-transform: uppercase;
        max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .db-box canvas { width: 48px; height: 36px; }
      .db-hold { cursor: pointer; touch-action: none; }
      .db-hold:active { border-color: var(--db-accent); }
      .db-stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; }
      .db-stats b { font-size: 20px; font-weight: 800; line-height: 1.1; }
      .db-score b { color: var(--db-accent2); }
      .db-well { flex: 1; min-height: 0; position: relative; display: flex; justify-content: center; align-items: center; }
      .db-board {
        border-radius: 12px; background: #060920; touch-action: none; max-width: 100%;
        box-shadow: 0 0 0 1px var(--db-line), 0 0 40px rgba(93,76,255,.25);
      }
      .db-pause {
        position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; border-radius: 10px; cursor: pointer;
        border: 1px solid var(--db-line); background: rgba(11,15,42,.8); color: var(--db-ink); font-size: 14px;
      }
      .db-flash {
        position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%); pointer-events: none;
        font-weight: 800; font-size: 28px; color: var(--db-gold); white-space: nowrap; opacity: 0;
        text-shadow: 0 0 20px rgba(255,201,77,.6); animation: dbFlash .9s ease-out;
      }
      @keyframes dbFlash {
        0% { opacity: 0; transform: translate(-50%, -30%) scale(.7); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 0; transform: translate(-50%, -90%); }
      }
      .db-overlay {
        position: absolute; inset: 0; border-radius: 12px; padding: 16px;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center;
        background: rgba(2,4,14,.82); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      }
      .db-overlay h2 { margin: 0; font-size: 26px; font-weight: 800; text-wrap: balance; }
      .db-overlay p { margin: 0; color: var(--db-dim); font-size: 13px; max-width: 30ch; }
      .db-date { font-size: 12px; color: var(--db-accent2); font-weight: 600; letter-spacing: .08em; }
      .db-big {
        font-size: 48px; font-weight: 800; line-height: 1; color: var(--db-accent2);
        text-shadow: 0 0 24px rgba(93,76,255,.6);
      }
      .db-cta { min-width: 180px; }
      .db-keys { font-size: 11px; color: var(--db-dim); max-width: 34ch; }
      .db-toast { font-size: 12px; color: var(--db-good); min-height: 16px; max-width: 32ch; word-break: break-word; user-select: text; -webkit-user-select: text; }
      .db-controls { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 8px; }
      .db-controls button { font-size: 22px; font-weight: 800; height: 56px; touch-action: none; }
      .db-app button:focus-visible { outline: 3px solid var(--db-ink); outline-offset: 2px; }
      @media (max-width: 768px) {
        .db-app { height: clamp(460px, calc(100dvh - 150px), 760px); }
      }
      @media (max-width: 480px) {
        .db-controls { gap: 6px; }
      }
      @media (min-width: 900px) and (pointer: fine) {
        .db-controls button { height: 48px; font-size: 18px; }
      }
      @media (prefers-reduced-motion: reduce) { .db-flash { animation: none; opacity: 1; } }
    `}</style>
  );
}
