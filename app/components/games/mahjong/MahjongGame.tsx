'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { getGameAudio } from '../../../../lib/games/gameAudio';
import {
  aliveOf, ALL_LEVELS, COMBO_WINDOW, countMoves, DAILY_CHAPTER, DAILY_TYPES, dailyDeal, dailyLayout, dailySeed, dailyShuffleRng, deal,
  findPair, HINTS, isFree, MAX_COMBO, mulberry, PENALTY, pairOrder, parAndTarget, reshuffle, shuffle, type MjTile, type ProofStep,
} from '../../../../lib/games/mahjong';
import { fillText, type MahjongTexts } from '../../../../lib/games/mahjongI18n';
import { poolFor, type Face, type Sym } from '../../../../lib/games/mahjongSymbols';
import { recordGameCompleted } from '../../../../lib/streak';
import { useGameShell } from '../GameShell';
import { HintIcon, PauseIcon, ShuffleIcon, SoundIcon, Star, UndoIcon } from './icons';
import { fmtClock, type MjSettings } from './settings';
import { ORNAMENT } from './theme';
import { liveStreak } from './MahjongHome';

/* One Mahjong game (a level or the daily challenge): the table with layered porcelain tiles,
   score / combo / time, undo – hint – shuffle, and the pause / stuck / win sheets.
   The engine lives in a ref and is changed only by taps and timers; every change publishes a
   snapshot that the render reads. The daily challenge records its moves ("proof") so the
   server can replay them before the time goes to the leaderboard. */

export type GameOpts = { daily: true; day: string } | { daily: false; level: number };

interface Hist { a: number; b: number; gain: number; base: number; layer: number; layerZ?: number }

interface Engine {
  tiles: MjTile[];
  syms: Sym[];
  sel: number | null;
  score: number; combo: number; maxCombo: number; lastMatch: number;
  history: Hist[]; hints: number;
  start: number; elapsed: number; running: boolean; paused: boolean; over: boolean;
  pairs: number; par: number; target: number; mult: number;
  base: number; comboPts: number; layerPts: number; penalty: number;
  layersDone: Set<number>; maxZ: number;
  proof: ProofStep[]; shuffles: number; firstTry: boolean;
  gone: Map<number, number>; hidden: Set<number>;
}

interface Float { id: number; a: number; b: number; text: string; layer: boolean }
interface Sparks { id: number; a: number; b: number; dirs: [number, number][] }
type Sheet =
  | { kind: 'pause' }
  | { kind: 'stuck'; canShuffle: boolean }
  | { kind: 'win'; total: number; stars: number; record: boolean; timeBonus: number; elapsed: number; base: number; comboPts: number; layerPts: number; penalty: number; maxCombo: number; pairs: number; perPair: number; target: number; par: number; practice: boolean }
  | null;

interface Snap {
  tiles: { id: number; x: number; y: number; z: number; alive: boolean; blocked: boolean; face: Face; gone: number | null; hidden: boolean }[];
  sel: number | null; score: number; hints: number; canUndo: boolean; pairsLeft: number; alive: number; moves: number;
  target: number; maxZ: number; dealGen: number;
}

/** Wall clock for the game timer (only read in taps and timers, never while rendering). */
const clockNow = () => Date.now();
const frameNow = () => performance.now();

function createEngine(opts: GameOpts, seed: number, s: MjSettings): Engine {
  const pool = poolFor(s.set, s.mix);
  let tiles: MjTile[], symRng: () => number, types: number, chapter: number;
  if (opts.daily) {
    tiles = dailyDeal(opts.day);
    symRng = mulberry(dailySeed(opts.day) + 1);
    types = DAILY_TYPES; chapter = DAILY_CHAPTER;
  } else {
    const L = ALL_LEVELS[opts.level - 1];
    types = Math.min(L.types, pool.list.length); chapter = L.ch;
    const rng = mulberry(seed);
    tiles = deal(L.layout, types, rng);
    symRng = mulberry(seed ^ 0x5bd1e995);
  }
  const syms = shuffle(pool.list.slice(), symRng).slice(0, types);
  const pairs = tiles.length / 2;
  const { par, target } = parAndTarget(pairs, chapter, pool.mult);
  return {
    tiles, syms, sel: null, score: 0, combo: 0, maxCombo: 0, lastMatch: 0, history: [], hints: HINTS,
    start: 0, elapsed: 0, running: false, paused: false, over: false,
    pairs, par, target, mult: pool.mult, base: 0, comboPts: 0, layerPts: 0, penalty: 0,
    layersDone: new Set(), maxZ: Math.max(...tiles.map(t => t.z)),
    proof: [], shuffles: 0, firstTry: false, gone: new Map(), hidden: new Set(),
  };
}

function faceFor(E: Engine, t: MjTile): Face {
  const sym = E.syms[t.type % E.syms.length];
  return sym.group ? sym.group[t.id % sym.group.length] : sym;
}

function makeSnap(E: Engine, dealGen: number): Snap {
  const alive = aliveOf(E.tiles);
  return {
    tiles: E.tiles.map(t => ({
      id: t.id, x: t.x, y: t.y, z: t.z, alive: t.alive, blocked: t.alive && !isFree(t, alive), face: faceFor(E, t),
      gone: E.gone.get(t.id) ?? null, hidden: !t.alive && !E.gone.has(t.id),
    })),
    sel: E.sel, score: E.score, hints: E.hints, canUndo: E.history.length > 0, pairsLeft: alive.length / 2, alive: alive.length,
    moves: countMoves(E.tiles), target: E.target, maxZ: E.maxZ, dealGen,
  };
}

export default function MahjongGame({ opts, seed, s, update, tx, lang, onMap, onRestart, onNext, pauseRef }: {
  opts: GameOpts; seed: number; s: MjSettings; tx: MahjongTexts; lang: string;
  update: (fn: (s: MjSettings) => MjSettings) => void;
  onMap: () => void; onRestart: () => void; onNext: (level: number) => void;
  pauseRef: React.RefObject<(() => void) | null>;
}) {
  const { onGameOver, startRound } = useGameShell();
  const [initial] = useState(() => createEngine(opts, seed, s));
  const eng = useRef(initial);
  const [snap, setSnap] = useState<Snap>(() => makeSnap(initial, 0));
  const [sheet, setSheet] = useState<Sheet>(null);
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [floats, setFloats] = useState<Float[]>([]);
  const [sparks, setSparks] = useState<Sparks[]>([]);
  const [hint, setHint] = useState<number[]>([]);
  const [nope, setNope] = useState<{ id: number; n: number } | null>(null);
  const [dealing, setDealing] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ids = useRef(1);
  const dealGen = useRef(0);
  const latest = useRef({ s, onGameOver, startRound, tx });
  useEffect(() => { latest.current = { s, onGameOver, startRound, tx }; });

  const publish = () => setSnap(makeSnap(eng.current, dealGen.current));

  /* ── sound ── */
  function tone(freq: number, dur: number, when = 0, vol = 0.12) {
    if (!latest.current.s.sound) return;
    const ac = getGameAudio();
    if (!ac) return;
    try {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t0 = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ac.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    } catch {}
  }
  const sfx = {
    tap: () => tone(1200, 0.06, 0, 0.06),
    match: (c: number) => { const b = 520 * Math.pow(1.06, Math.min(c, 8)); tone(b, 0.18, 0, 0.1); tone(b * 1.5, 0.22, 0.07, 0.08); },
    nope: () => tone(180, 0.12, 0, 0.08),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, i * 0.12, 0.1)),
  };

  /* ── layout (pure, from the snapshot) ── */
  const layout = useMemo(() => {
    const W = size.w - 36, H = size.h - 36;
    let maxX = 0, maxY = 0;
    snap.tiles.forEach(t => { maxX = Math.max(maxX, t.x + 2); maxY = Math.max(maxY, t.y + 2); });
    const cx = maxX / 2, cy = maxY / 2, ratio = 0.76, dk = 0.11, mz = snap.maxZ;
    const fit = W > 0 && H > 0 ? Math.min(W / (cx + dk * mz + 0.3), H / (cy / ratio + dk * mz + 0.3), 78) : 40;
    const tw = fit * zoom, th = tw / ratio, d = tw * dk;
    const e = Math.max(4, d), n = 6, sh: string[] = [];
    for (let k = 1; k <= n; k++) {
      const off = e * k / n, col = k <= 2 ? 'var(--tile-edge1)' : k < n ? 'var(--tile-edge2)' : 'var(--tile-edge2-dk)';
      sh.push(`${(off * 0.82).toFixed(2)}px ${off.toFixed(2)}px 0 ${col}`);
    }
    sh.push(`${(e * 1.1).toFixed(1)}px ${(e * 1.7).toFixed(1)}px ${(e * 2.2).toFixed(1)}px rgba(0,0,0,.34)`);
    sh.push(`${(e * 0.4).toFixed(1)}px ${(e * 0.6).toFixed(1)}px ${(e * 0.7).toFixed(1)}px rgba(0,0,0,.25)`);
    const pos = new Map<number, { px: number; py: number }>();
    snap.tiles.forEach(t => pos.set(t.id, { px: t.x / 2 * tw + (mz - t.z) * d, py: t.y / 2 * th + (mz - t.z) * d }));
    return {
      fit, tw, th, pos, shadow: sh.join(','),
      w: cx * tw + mz * d + d * 1.6, h: cy * th + mz * d + d * 1.6,
      canZoom: fit < 46 || zoom > 1,
    };
  }, [snap.tiles, snap.maxZ, size, zoom]);

  const center = (a: number, b: number) => {
    const A = layout.pos.get(a)!, B = layout.pos.get(b)!;
    return { x: (A.px + B.px) / 2 + layout.tw / 2, y: (A.py + B.py) / 2 + layout.th / 2 };
  };

  /* ── game actions ── */
  function penalize(p: number) { const E = eng.current; const take = Math.min(p, E.score); E.score -= take; E.penalty += take; }

  function ensureRunning() {
    const E = eng.current;
    if (E.running) return;
    E.running = true; E.start = clockNow() - E.elapsed;
    latest.current.startRound();
    if (opts.daily) {
      // Only the first attempt of the day goes to the leaderboard
      E.firstTry = latest.current.s.dailyTried !== opts.day;
      if (E.firstTry) update(st => ({ ...st, dailyTried: opts.day }));
    }
  }

  function onTile(id: number) {
    const E = eng.current;
    if (E.over || E.paused) return;
    const t = E.tiles[id];
    if (!t?.alive) return;
    getGameAudio(); // created inside the tap so sound is allowed
    ensureRunning();
    if (!isFree(t, aliveOf(E.tiles))) { sfx.nope(); setNope(n => ({ id, n: (n?.n ?? 0) + 1 })); return; }
    if (E.sel === id) { E.sel = null; sfx.tap(); publish(); return; }
    if (E.sel !== null && E.tiles[E.sel].type === t.type) { match(E.sel, id); return; }
    E.sel = id; sfx.tap(); publish();
  }

  function match(a: number, b: number) {
    const E = eng.current, now = clockNow();
    E.combo = E.lastMatch && now - E.lastMatch <= COMBO_WINDOW ? Math.min(E.combo + 1, MAX_COMBO) : 1;
    E.maxCombo = Math.max(E.maxCombo, E.combo);
    E.lastMatch = now;
    const base = Math.round(10 * E.mult), gain = base * E.combo;
    E.base += base; E.comboPts += gain - base; E.score += gain;
    E.tiles[a].alive = false; E.tiles[b].alive = false; E.sel = null;
    E.gone.set(a, b); E.gone.set(b, a);
    E.proof.push([a, b]);
    const hist: Hist = { a, b, gain, base, layer: 0 };
    const tr = latest.current.tx;
    const fid = ids.current++;
    setFloats(f => [...f, { id: fid, a, b, text: `+${gain}${E.combo > 1 ? ` · ${fillText(tr.comboFloat, { n: E.combo })}` : ''}`, layer: false }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== fid)), 1050);
    setTimeout(() => {
      E.gone.delete(a); E.gone.delete(b); publish();
      const sid = ids.current++;
      setSparks(sp => [...sp, { id: sid, a, b, dirs: Array.from({ length: 12 }, (_, i) => { const ang = Math.PI * 2 * i / 12, r = 26 + Math.random() * 24; return [Math.cos(ang) * r, Math.sin(ang) * r] as [number, number]; }) }]);
      setTimeout(() => setSparks(sp => sp.filter(x => x.id !== sid)), 700);
    }, 300);
    sfx.match(E.combo);
    for (let z = 1; z <= E.maxZ; z++) {
      if (E.layersDone.has(z) || E.tiles.some(t => t.z === z && t.alive)) continue;
      E.layersDone.add(z);
      const lb = 40 * z;
      E.layerPts += lb; E.score += lb; hist.layer += lb; hist.layerZ = z;
      const lid = ids.current++;
      setTimeout(() => {
        setFloats(f => [...f, { id: lid, a, b, text: fillText(tr.layerBonus, { n: lb }), layer: true }]);
        setTimeout(() => setFloats(f => f.filter(x => x.id !== lid)), 1050);
      }, 380);
    }
    E.history.push(hist);
    publish();
    if (!aliveOf(E.tiles).length) { E.over = true; setTimeout(win, 550); return; }
    if (!findPair(E.tiles)) setTimeout(stuck, 600);
  }

  function undo() {
    const E = eng.current;
    if (E.over || !E.history.length) return;
    const h = E.history.pop()!;
    E.tiles[h.a].alive = true; E.tiles[h.b].alive = true; E.gone.delete(h.a); E.gone.delete(h.b);
    E.score -= h.gain + h.layer; E.base -= h.base; E.comboPts -= h.gain - h.base; E.layerPts -= h.layer;
    if (h.layerZ) E.layersDone.delete(h.layerZ);
    E.combo = 0; E.lastMatch = 0; E.sel = null;
    if (E.proof[E.proof.length - 1] !== 'S') E.proof.pop();
    penalize(PENALTY.undo); sfx.tap(); publish();
  }

  function showHint() {
    const E = eng.current;
    if (E.over || E.hints <= 0) return;
    const p = findPair(E.tiles);
    if (!p) { stuck(); return; }
    E.hints--; penalize(PENALTY.hint);
    setHint([p[0].id, p[1].id]);
    setTimeout(() => setHint([]), 2100);
    publish();
  }

  /** Deals the remaining tiles again; in the daily challenge with the day's n-th shuffle seed. */
  function doShuffle(charge: boolean): boolean {
    const E = eng.current;
    if (E.over) return false;
    const rng = opts.daily ? dailyShuffleRng(opts.day, E.shuffles + 1) : mulberry(seed + 7919 * (E.shuffles + 1));
    if (!reshuffle(E.tiles, rng)) { sfx.nope(); return false; }
    E.shuffles++;
    E.proof.push('S');
    if (charge) penalize(PENALTY.shuffle);
    E.sel = null; E.combo = 0; E.lastMatch = 0; E.history = [];
    dealGen.current++;
    setDealing(true);
    setTimeout(() => setDealing(false), 900);
    publish();
    return true;
  }

  function pauseClock() { const E = eng.current; E.paused = true; }
  function resumeClock() { const E = eng.current; if (E.paused) { E.paused = false; if (E.running) E.start = clockNow() - E.elapsed; } }

  function stuck() {
    const E = eng.current;
    if (E.over || !aliveOf(E.tiles).length || findPair(E.tiles)) return;
    pauseClock();
    setSheet({ kind: 'stuck', canShuffle: pairOrder(aliveOf(E.tiles).map(t => ({ ...t })), mulberry(1)) !== null });
  }

  function pause() {
    const E = eng.current;
    if (E.over || E.paused) return;
    pauseClock();
    setSheet({ kind: 'pause' });
  }

  function win() {
    const E = eng.current;
    E.over = true;
    if (E.running) E.elapsed = clockNow() - E.start;
    const secs = Math.floor(E.elapsed / 1000);
    const timeBonus = Math.max(0, E.par - secs) * 5;
    const total = E.score + timeBonus;
    const stars = total >= E.target ? 3 : total >= E.target * 0.6 ? 2 : 1;
    const st = latest.current.s;
    let record = false;
    if (opts.daily) {
      const day = opts.day, prev = st.daily[day];
      record = !prev || E.elapsed < prev.ms;
      const prevDay = new Date(`${day}T12:00:00Z`); prevDay.setUTCDate(prevDay.getUTCDate() - 1);
      const y = prevDay.toISOString().slice(0, 10);
      update(cur => {
        const next = { ...cur, daily: { ...cur.daily, [day]: { ms: prev ? Math.min(prev.ms, E.elapsed) : E.elapsed, score: Math.max(prev?.score ?? 0, total) } } };
        if (cur.lastDaily !== day) { next.streak = cur.lastDaily === y ? cur.streak + 1 : 1; next.lastDaily = day; }
        return next;
      });
      // First attempt → leaderboard / share window; the server replays the moves
      if (E.firstTry) latest.current.onGameOver({ timeMs: E.elapsed, moves: E.pairs, proof: E.proof });
      else recordGameCompleted();
    } else {
      const prev = st.levels[opts.level] ?? { stars: 0, best: 0 };
      record = total > prev.best;
      update(cur => ({ ...cur, levels: { ...cur.levels, [opts.level]: { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, total) } } }));
      recordGameCompleted();
    }
    sfx.win(); confetti();
    setSheet({
      kind: 'win', total, stars, record, timeBonus, elapsed: E.elapsed, base: E.base, comboPts: E.comboPts, layerPts: E.layerPts,
      penalty: E.penalty, maxCombo: E.maxCombo, pairs: E.pairs, perPair: Math.round(10 * E.mult), target: E.target, par: E.par,
      practice: opts.daily && !E.firstTry,
    });
  }

  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas'); c.className = 'mj-confetti'; document.body.appendChild(c);
    const dpr = window.devicePixelRatio || 1, W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
    c.style.width = `${innerWidth}px`; c.style.height = `${innerHeight}px`;
    const ctx = c.getContext('2d')!, cols = ['#F0C873', '#FFF3D6', '#D9A440', '#C0271D', '#18774A', '#FFFFFF'];
    const P = Array.from({ length: 150 }, (_, i) => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.2, y: H * 0.38, vx: (Math.random() - 0.5) * 16 * dpr, vy: (-6 - Math.random() * 12) * dpr, w: (4 + Math.random() * 6) * dpr, h: (6 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[i % cols.length] }));
    const t0 = frameNow();
    const frame = (t: number) => {
      const el = t - t0; ctx.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.vy += 0.32 * dpr; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - el / 2600); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); ctx.restore();
      });
      if (el < 2600) requestAnimationFrame(frame); else c.remove();
    };
    requestAnimationFrame(frame);
  }

  /* ── effects: clock, size, pause hooks, deal animation ── */
  /** Time and combo for the small ticking component (read in its timer, not while rendering). */
  const readClock = useCallback(() => {
    const E = eng.current, now = clockNow();
    if (!E.over && E.running && !E.paused) E.elapsed = now - E.start;
    const left = E.lastMatch && !E.paused && !E.over ? Math.max(0, COMBO_WINDOW - (now - E.lastMatch)) : 0;
    return { elapsed: E.elapsed, comboLeft: left, combo: left > 0 ? E.combo : 1 };
  }, []);
  const tapRef = useRef<(id: number) => void>(() => {});
  useEffect(() => { tapRef.current = onTile; });
  const tap = useCallback((id: number) => tapRef.current(id), []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    const t = setTimeout(() => setDealing(false), 1600);
    const onVis = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVis);
    pauseRef.current = pause;
    return () => { ro.disconnect(); clearTimeout(t); document.removeEventListener('visibilitychange', onVis); pauseRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Center the table after a new deal or a resize
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [size.w, size.h, snap.dealGen]);

  function zoomTo(z: number) {
    const el = wrapRef.current;
    const nz = Math.max(1, Math.min(2.2, z));
    if (el) {
      const fx = (el.scrollLeft + el.clientWidth / 2) / Math.max(1, el.scrollWidth), fy = (el.scrollTop + el.clientHeight / 2) / Math.max(1, el.scrollHeight);
      requestAnimationFrame(() => { el.scrollLeft = fx * el.scrollWidth - el.clientWidth / 2; el.scrollTop = fy * el.scrollHeight - el.clientHeight / 2; });
    }
    setZoom(nz);
  }

  function toggleSound() { update(st => ({ ...st, sound: !st.sound })); }

  // Escape closes the pause sheet
  useEffect(() => {
    if (sheet?.kind !== 'pause') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSheet(null); resumeClock(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  /* ── render ── */
  const title = opts.daily ? tx.dailyTitle : fillText(tx.levelTitle, { n: opts.level, name: tx.layouts[ALL_LEVELS[opts.level - 1].layout] });
  const eyebrow = opts.daily ? tx.layouts[dailyLayout(opts.day)] : fillText(tx.chapter, { n: ALL_LEVELS[opts.level - 1].ch + 1, name: tx.chapterNames[ALL_LEVELS[opts.level - 1].ch] });
  const fmt = (n: number) => n.toLocaleString(lang);
  const nextLevel = !opts.daily && opts.level < ALL_LEVELS.length ? opts.level + 1 : 0;
  const boardStyle = { width: layout.w, height: layout.h, '--tw': `${layout.tw}px`, '--th': `${layout.th}px`, '--tile-shadow': layout.shadow } as CSSProperties;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="mj-spread mj-topbar">
        <button type="button" className="mj-icon-btn" aria-label={tx.pause} onClick={pause}><PauseIcon /></button>
        <div className="ttl"><span className="mj-eyebrow">{eyebrow}</span><b>{title}</b></div>
        <button type="button" className="mj-icon-btn" aria-label={s.sound ? tx.soundOn : tx.soundOff} onClick={toggleSound}><SoundIcon on={s.sound} /></button>
      </div>

      <div className="mj-scorebar mj-glass">
        <div className="mj-cells">
          <div className="mj-cell"><span>{tx.score}</span><b>{fmt(snap.score)}</b></div>
          <ClockCells read={readClock} comboLabel={tx.combo} timeLabel={tx.time} />
        </div>
        <div className="mj-progress">
          <div className="fill" style={{ width: `${Math.min(100, snap.score / snap.target * 100)}%` }} />
          {[0.3, 0.6, 1].map(f => {
            const on = snap.score >= f * snap.target;
            return (
              <svg key={f} style={{ left: `${f * 100}%` }} viewBox="0 0 24 24" fill={on ? '#F0C873' : 'rgba(0,0,0,.55)'} stroke={on ? '#2A1D05' : 'rgba(255,255,255,.45)'} strokeWidth="1.5" aria-hidden="true">
                <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" />
              </svg>
            );
          })}
        </div>
      </div>

      <div className="mj-zoom-wrap mj-surface" data-table={s.table}>
        <div className="mj-orn-wrap" style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: ORNAMENT }} />
        <div className="mj-board-wrap" ref={wrapRef}>
          <div className={`mj-board${s.dim ? ' dim' : ''}`} style={boardStyle}>
            {snap.tiles.map((t, i) => {
              if (t.hidden) return null;
              const p = layout.pos.get(t.id)!;
              let gx = 0, gy = 0;
              if (t.gone !== null) {
                const c = center(t.id, t.gone);
                gx = c.x - p.px - layout.tw / 2; gy = c.y - p.py - layout.th / 2;
              }
              const cls = ['mj-tile'];
              if (t.gone !== null) cls.push('gone');
              else {
                if (t.blocked) cls.push('blocked');
                if (snap.sel === t.id) cls.push('sel');
                if (hint.includes(t.id)) cls.push('hint');
                if (nope?.id === t.id) cls.push('nope');
                if (dealing) cls.push('deal');
              }
              return (
                <Tile key={`${t.id}-${snap.dealGen}-${nope?.id === t.id ? nope.n : 0}`} id={t.id} cls={cls.join(' ')}
                  left={p.px} top={p.py} z={t.gone !== null ? 9000 : t.z * 1000 + t.y * 30 + t.x} gx={gx} gy={gy}
                  delay={dealing && t.gone === null ? Math.round(i * Math.min(14, 1100 / snap.tiles.length)) : -1}
                  label={t.face.label(tx, lang)} html={t.face.html} onTap={tap} />
              );
            })}
            {floats.map(f => { const c = center(f.a, f.b); return <div key={f.id} className={`mj-float${f.layer ? ' layer' : ''}`} style={{ left: c.x, top: c.y - (f.layer ? 30 : 0) }}>{f.text}</div>; })}
            {sparks.map(sp => { const c = center(sp.a, sp.b); return sp.dirs.map(([sx, sy], k) => <i key={`${sp.id}-${k}`} className="mj-spark" style={{ left: c.x, top: c.y, '--sx': `${sx}px`, '--sy': `${sy}px` } as CSSProperties} />); })}
          </div>
        </div>
        {layout.canZoom && (
          <div className="mj-zoom">
            <button type="button" aria-label={tx.zoomOut} disabled={zoom <= 1} onClick={() => zoomTo(zoom - 0.4)}>−</button>
            <button type="button" aria-label={tx.zoomIn} disabled={zoom >= 2.2 || layout.fit * zoom >= 78} onClick={() => zoomTo(zoom + 0.4)}>+</button>
          </div>
        )}
      </div>

      <div className="mj-subline">
        <span>{fillText(tx.pairsLeft, { n: snap.pairsLeft })} · {fillText(tx.tilesLeft, { n: snap.alive })}</span>
        <span>{fillText(tx.freeMoves, { n: snap.moves })}</span>
      </div>
      <div className="mj-tools mj-glass">
        <button type="button" className="mj-tool" disabled={!snap.canUndo} onClick={undo}><UndoIcon />{tx.undo}<span className="cost">−{PENALTY.undo}</span></button>
        <button type="button" className="mj-tool" disabled={snap.hints <= 0} onClick={showHint}><HintIcon />{tx.hint}<span className="badge">{snap.hints}</span><span className="cost">−{PENALTY.hint}</span></button>
        <button type="button" className="mj-tool" onClick={() => { if (doShuffle(true)) sfx.tap(); }}><ShuffleIcon />{tx.shuffle}<span className="cost">−{PENALTY.shuffle}</span></button>
      </div>

      {sheet && createPortal(
        <div className="mj mj-portal" data-table={s.table} data-skin={s.skin}>
        <div className="mj-overlay">
          <div className="mj-sheet" role="dialog" aria-modal="true">
            {sheet.kind === 'pause' && (
              <>
                <h2>{tx.paused}</h2>
                <p>{title}<br />{eyebrow}</p>
                <div className="mj-actions">
                  <button type="button" className="mj-btn gold" autoFocus onClick={() => { setSheet(null); resumeClock(); }}>{tx.resume}</button>
                  <div className="two">
                    <button type="button" className="mj-btn" onClick={onRestart}>{tx.restart}</button>
                    <button type="button" className="mj-btn" onClick={onMap}>{tx.map}</button>
                  </div>
                </div>
              </>
            )}
            {sheet.kind === 'stuck' && (
              <>
                <h2>{tx.stuckTitle}</h2>
                <p>{tx.stuckText}</p>
                <div className="mj-actions">
                  {sheet.canShuffle && (
                    <button type="button" className="mj-btn gold" autoFocus onClick={() => { setSheet(null); resumeClock(); doShuffle(true); }}>
                      {fillText(tx.shuffleCost, { n: PENALTY.shuffle })}
                    </button>
                  )}
                  <div className="two">
                    <button type="button" className="mj-btn" disabled={!snap.canUndo} onClick={() => { setSheet(null); resumeClock(); undo(); }}>{tx.undoMove}</button>
                    <button type="button" className="mj-btn" onClick={onRestart}>{tx.restart}</button>
                  </div>
                </div>
              </>
            )}
            {sheet.kind === 'win' && (
              <>
                <div className="mj-bigstars">{[1, 2, 3].map(i => <Star key={i} on={i <= sheet.stars} className={i <= sheet.stars ? 'on' : ''} />)}</div>
                <span className="mj-eyebrow">{opts.daily ? tx.dailyDone : fillText(tx.levelDone, { title })}</span>
                <div className="mj-total">{opts.daily ? fmtClock(sheet.elapsed) : fmt(sheet.total)}</div>
                {opts.daily && <span className="mj-note">{tx.score} {fmt(sheet.total)} · {fillText(tx.dayStreak, { n: liveStreak(s, opts.day) })}</span>}
                {sheet.record && <span className="mj-record">{tx.newRecord}</span>}
                <div className="mj-breakdown">
                  <div><span>{fillText(tx.rowPairs, { n: sheet.pairs, p: sheet.perPair })}</span><b>{fmt(sheet.base)}</b></div>
                  <div><span>{fillText(tx.rowCombo, { n: sheet.maxCombo })}</span><b>{fmt(sheet.comboPts)}</b></div>
                  <div><span>{tx.rowLayers}</span><b>{fmt(sheet.layerPts)}</b></div>
                  <div><span>{fillText(tx.rowTime, { t: fmtClock(sheet.elapsed), p: fmtClock(sheet.par * 1000) })}</span><b>{fmt(sheet.timeBonus)}</b></div>
                  <div><span>{tx.rowHelp}</span><b>{sheet.penalty ? `−${fmt(sheet.penalty)}` : '0'}</b></div>
                </div>
                {sheet.stars < 3 && <p>{fillText(tx.nextStar, { s: sheet.stars + 1, n: fmt(Math.ceil(sheet.stars === 1 ? sheet.target * 0.6 : sheet.target)) })}</p>}
                {sheet.practice && <p>{tx.dailyPractice}</p>}
                <div className="mj-actions">
                  {nextLevel > 0 && <button type="button" className="mj-btn gold" onClick={() => onNext(nextLevel)}>{tx.next}</button>}
                  <div className="two">
                    <button type="button" className="mj-btn" onClick={onRestart}>{tx.again}</button>
                    <button type="button" className="mj-btn" onClick={onMap}>{tx.map}</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/** One tile; memoized so the board re-renders only the tiles whose props changed. */
const Tile = memo(function Tile({ id, cls, left, top, z, gx, gy, delay, label, html, onTap }: {
  id: number; cls: string; left: number; top: number; z: number; gx: number; gy: number; delay: number;
  label: string; html: string; onTap: (id: number) => void;
}) {
  const style = {
    left, top, zIndex: z, animationDelay: delay >= 0 ? `${delay}ms` : undefined, '--gx': `${gx}px`, '--gy': `${gy}px`,
  } as CSSProperties;
  return (
    <button type="button" className={cls} style={style} aria-label={label} onClick={() => onTap(id)}>
      <span className="mj-face" dangerouslySetInnerHTML={{ __html: html }} />
    </button>
  );
});

/** Combo and time cells; they tick five times a second without re-rendering the board. */
function ClockCells({ read, comboLabel, timeLabel }: {
  read: () => { elapsed: number; comboLeft: number; combo: number }; comboLabel: string; timeLabel: string;
}) {
  const [c, setC] = useState({ elapsed: 0, comboLeft: 0, combo: 1 });
  useEffect(() => {
    const id = setInterval(() => setC(read()), 200);
    return () => clearInterval(id);
  }, [read]);
  return (
    <>
      <div className={`mj-cell combo${c.comboLeft > 0 && c.combo > 1 ? ' on' : ''}`}>
        <span>{comboLabel}</span><b>×{c.combo}</b><i className="mj-combo-bar" style={{ width: `${c.comboLeft / COMBO_WINDOW * 100}%` }} />
      </div>
      <div className="mj-cell"><span>{timeLabel}</span><b>{fmtClock(c.elapsed)}</b></div>
    </>
  );
}
