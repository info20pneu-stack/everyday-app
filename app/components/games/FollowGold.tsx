'use client';

import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import {
  BLEND_MS, LAYOUTS, MAX_LIVES, roundCfg, tierIndex, type RoundCfg, type Ring,
} from '../../../lib/games/followGold';
import { followGoldTexts, type FollowGoldTexts } from '../../../lib/games/followGoldI18n';
import GameShell, { useGameShell } from './GameShell';

/* Follow the Gold (Sleduj zlatou) — port of games-reference/follow-gold.
   A 3-2-1 countdown shows the gold ball, it fades to blue and the balls shuffle (swaps along arcs
   and whole-ring rotations). Tap the gold one. Every round is a little harder (lib/games/followGold.ts);
   a miss repeats the same round, the third miss ends the game. Score = rounds cleared. */

type EngineState = 'idle' | 'reveal' | 'blend' | 'shuffle' | 'pick' | 'result';

/** A text key (translated when rendering, so a language switch updates it) or a literal, e.g. "3". */
type TextKey = Exclude<keyof FollowGoldTexts, 'tiers'>;
type Msg = { k: TextKey; n?: number } | { raw: string };

interface Ui {
  round: number;
  lives: number;
  hint: Msg;
  big: Msg;
  bigCls: '' | 'ok' | 'bad';
  /** Number of decoys on the board. */
  decoys: number;
  /** Main button; null while a round is running. */
  go: TextKey | null;
  paused: boolean;
}

const EMPTY: Msg = { raw: '' };

interface SwapPath { type: 'swap'; to: number; bend: number }
interface RotPath { type: 'rot'; to: number; r: number; a0: number; a1: number }
type Path = SwapPath | RotPath;
interface Slot { ring: number; r: number; a: number }
interface Ball { slot: number; path: Path | null; gold: number; mark: null | 'ok' | 'bad' | 'gold'; x: number; y: number }

const SOUND_KEY = 'fg-sound';

export default function FollowGold() {
  const pauseRef = useRef<(() => void) | null>(null);
  return (
    <GameShell gameId="follow-gold" onHide={() => pauseRef.current?.()}>
      <FollowGoldGame pauseRef={pauseRef} />
    </GameShell>
  );
}

function readSound(): boolean {
  try { const v = localStorage.getItem(SOUND_KEY); return v === null ? true : JSON.parse(v) !== false; } catch { return true; }
}

function FollowGoldGame({ pauseRef }: { pauseRef: React.RefObject<(() => void) | null> }) {
  const { lang } = useLang();
  const tx = followGoldTexts(lang);
  const { onGameOver, startRound, best } = useGameShell();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ui, setUi] = useState<Ui>(() => ({
    round: 1, lives: MAX_LIVES, hint: { k: 'memorize' }, big: EMPTY, bigCls: '', decoys: 5, go: 'play', paused: false,
  }));
  const [soundOn, setSoundOn] = useState(readSound);
  const [record, setRecord] = useState(false);

  // Latest values for the engine, which lives outside React's render cycle
  const latest = useRef({ onGameOver, startRound, soundOn });
  useEffect(() => { latest.current = { onGameOver, startRound, soundOn }; });

  const engine = useRef<{ start: () => void; resume: () => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const ctx = canvas.getContext('2d')!;

    let round = 1, streak = 0, lives = MAX_LIVES;
    let C: RoundCfg = roundCfg(1);
    let rings: Ring[] = LAYOUTS[6];
    let slots: Slot[] = [], ringSlots: number[][] = [], balls: Ball[] = [];
    let goldIdx = 0;
    let state: EngineState = 'idle';
    let stT = 0, moveI = 0, moveStart = 0, moveT = 0, lastCount = 0;
    let paused = false, pausedAt = 0;
    let S = 300, dpr = 1, raf = 0;

    const patch = (p: Partial<Ui>) => setUi(u => ({ ...u, ...p }));

    /* ── sound (synthesized through the shared context, so the boss key silences it) ── */
    let master: GainNode | null = null;
    function audio(): AudioContext | null {
      if (!latest.current.soundOn) return null;
      const ac = getGameAudio();
      if (!ac) return null;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      if (!master || master.context !== ac) { master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination); }
      return ac;
    }
    function tone(f: number, d: number, type: OscillatorType = 'sine', vol = 0.15, when = 0, slide?: number) {
      const ac = audio();
      if (!ac || !master) return;
      try {
        const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.03);
      } catch {}
    }
    function noise(d: number, vol = 0.06, freq = 1800) {
      const ac = audio();
      if (!ac || !master) return;
      try {
        const t = ac.currentTime, len = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
        bp.type = 'bandpass'; bp.frequency.setValueAtTime(freq * 0.6, t); bp.frequency.exponentialRampToValueAtTime(freq * 1.4, t + d); bp.Q.value = 1.2;
        g.gain.value = vol; s.buffer = buf; s.connect(bp); bp.connect(g); g.connect(master); s.start(t);
      } catch {}
    }
    const SFX = {
      count: (n: number) => tone(n === 1 ? 880 : 660, 0.12, 'square', 0.07),
      go: () => { tone(523, 0.12, 'triangle', 0.14); tone(784, 0.22, 'triangle', 0.14, 0.09); },
      move: (i: number, total: number) => { noise(Math.min(0.18, C.dur / 1000 * 0.6), 0.05, 900 + i / total * 1400); tone(220 + i / total * 440, 0.05, 'triangle', 0.05); },
      tap: () => tone(1000, 0.05, 'sine', 0.08),
      win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.07)),
      lose: () => { tone(196, 0.45, 'sawtooth', 0.08, 0, 98); tone(147, 0.5, 'square', 0.04, 0.05, 80); },
    };

    const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function buildBoard() {
      C = roundCfg(round); rings = LAYOUTS[C.count]; slots = []; ringSlots = [];
      rings.forEach((rg, ri) => {
        ringSlots[ri] = [];
        for (let j = 0; j < rg.n; j++) { ringSlots[ri].push(slots.length); slots.push({ ring: ri, r: rg.r, a: rg.off + j * 2 * Math.PI / rg.n }); }
      });
      balls = slots.map((_, i) => ({ slot: i, path: null, gold: 0, mark: null, x: 0, y: 0 }));
      goldIdx = Math.floor(Math.random() * balls.length);
      balls[goldIdx].gold = 1;
      patch({ decoys: balls.length - 1 });
    }
    const slotXY = (s: number): [number, number] => { const o = slots[s]; return [Math.cos(o.a) * o.r, Math.sin(o.a) * o.r]; };

    function genMove(): Map<number, Path> {
      const nOps = 1 + Math.floor(Math.random() * C.ops);
      const used = new Set<number>(), paths = new Map<number, Path>();
      const goldSlot = balls[goldIdx].slot;
      for (let o = 0; o < nOps; o++) {
        if (Math.random() < C.rotP) {
          const free = ringSlots.map((_, i) => i).filter(i => ringSlots[i].every(s => !used.has(s)));
          if (free.length) {
            const ri = pick(free), rs = ringSlots[ri], n = rs.length;
            const k = (Math.random() < 0.5 ? 1 : -1) * (n >= 6 && round > 5 && Math.random() < 0.4 ? 2 : 1);
            rs.forEach((s, j) => {
              used.add(s);
              paths.set(s, { type: 'rot', to: rs[((j + k) % n + n) % n], r: slots[s].r, a0: slots[s].a, a1: slots[s].a + k * 2 * Math.PI / n });
            });
            continue;
          }
        }
        let free = slots.map((_, i) => i).filter(i => !used.has(i));
        if (free.length < 2) break;
        const a = (o === 0 && Math.random() < 0.6 && !used.has(goldSlot)) ? goldSlot : pick(free);
        free = free.filter(i => i !== a);
        const b = pick(free);
        used.add(a); used.add(b);
        const bend = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.3);
        paths.set(a, { type: 'swap', to: b, bend }); paths.set(b, { type: 'swap', to: a, bend });
      }
      return paths;
    }
    function startMove(now: number) {
      const p = genMove();
      balls.forEach(b => { b.path = p.get(b.slot) ?? null; });
      moveStart = now; moveT = 0;
      SFX.move(moveI, C.moves);
    }
    function endMove() { balls.forEach(b => { if (b.path) { b.slot = b.path.to; b.path = null; } }); }

    function ballPos(b: Ball, t: number): [number, number] {
      if (!b.path) return slotXY(b.slot);
      const p = b.path;
      if (p.type === 'rot') { const a = p.a0 + (p.a1 - p.a0) * t; return [Math.cos(a) * p.r, Math.sin(a) * p.r]; }
      const [x0, y0] = slotXY(b.slot), [x1, y1] = slotXY(p.to);
      const dx = x1 - x0, dy = y1 - y0;
      let cx = (x0 + x1) / 2 - dy * p.bend, cy = (y0 + y1) / 2 + dx * p.bend;
      const cl = Math.hypot(cx, cy);
      if (cl > 0.85) { cx *= 0.85 / cl; cy *= 0.85 / cl; }
      const u = 1 - t;
      return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
    }

    /* ── drawing ── */
    const CY = [[190, 250, 255], [38, 196, 222], [3, 58, 78]], GD = [[255, 244, 180], [226, 170, 20], [90, 58, 0]];
    const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgb = (c: number[], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    function drawBall(x: number, y: number, r: number, g: number, mark: Ball['mark']) {
      const c = [0, 1, 2].map(i => mix(CY[i], GD[i], g));
      ctx.save();
      ctx.shadowColor = rgb(c[1], 0.85); ctx.shadowBlur = r * 0.9;
      const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      gr.addColorStop(0, rgb(c[0])); gr.addColorStop(0.55, rgb(c[1])); gr.addColorStop(1, rgb(c[2]));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - r * 0.48, y - r * 0.55, r * 0.26, r * 0.2, r * 0.05); else ctx.rect(x - r * 0.48, y - r * 0.55, r * 0.26, r * 0.2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y, r * 0.72, Math.PI * 0.62, Math.PI * 0.9); ctx.stroke();
      if ((g > 0.5 && state !== 'result') || mark === 'gold') {
        ctx.strokeStyle = rgb([255, 236, 170], g); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r * 1.15, 0, Math.PI * 2); ctx.stroke();
      }
      if (mark === 'ok' || mark === 'bad') {
        ctx.strokeStyle = mark === 'ok' ? '#3ee08f' : '#ff4d6d'; ctx.lineWidth = 3;
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
    function draw(now: number) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#03040a'; ctx.fillRect(0, 0, S, S);
      const c = S / 2, U = S / 2, R = U * 0.94;
      ctx.strokeStyle = 'rgba(120,140,170,.10)'; ctx.lineWidth = 1;
      rings.forEach(rg => { ctx.beginPath(); ctx.arc(c, c, rg.r * U, 0, Math.PI * 2); ctx.stroke(); });
      ctx.fillStyle = 'rgba(150,160,180,.35)'; ctx.beginPath(); ctx.arc(c, c, 2, 0, Math.PI * 2); ctx.fill();
      // Rotating rainbow rim (faster while shuffling)
      const rot = now / (state === 'shuffle' ? 2200 : 4000), seg = 90;
      ctx.lineWidth = 3; ctx.lineCap = 'butt';
      ctx.save(); ctx.shadowBlur = 10;
      for (let i = 0; i < seg; i++) {
        const a0 = rot + i / seg * Math.PI * 2, a1 = a0 + Math.PI * 2 / seg + 0.01;
        const col = `hsl(${(i / seg * 360 + 300) % 360},100%,58%)`;
        ctx.strokeStyle = col; ctx.shadowColor = col;
        ctx.beginPath(); ctx.arc(c, c, R, a0, a1); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(c, c, R + 6, -rot * 1.6, -rot * 1.6 + Math.PI * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.arc(c, c, R + 6, -rot * 1.6 + Math.PI, -rot * 1.6 + Math.PI * 1.6); ctx.stroke();
      const br = U * 0.075;
      balls.forEach(b => { const [x, y] = ballPos(b, moveT); b.x = c + x * U; b.y = c + y * U; drawBall(b.x, b.y, br, b.gold, b.mark); });
    }

    /* ── game flow ── */
    function start() {
      if (state !== 'idle' && state !== 'result') return;
      if (paused) return;
      audio();
      // A fresh game (round 1 with all attempts) restarts the round timer for the leaderboard
      if (round === 1 && lives === MAX_LIVES) { latest.current.startRound(); setRecord(false); }
      buildBoard();
      state = 'reveal'; stT = performance.now(); lastCount = 0;
      patch({ go: null, hint: { k: 'memorize' }, big: EMPTY, bigCls: '', round, lives });
    }

    function update(now: number) {
      if (state === 'reveal') {
        const n = 3 - Math.floor((now - stT) / C.step);
        if (n > 0) {
          if (n !== lastCount) { lastCount = n; patch({ big: { raw: String(n) }, bigCls: '' }); SFX.count(n); }
        } else {
          state = 'blend'; stT = now; patch({ hint: { k: 'watch' } }); SFX.go();
        }
      } else if (state === 'blend') {
        const t = Math.min(1, (now - stT) / BLEND_MS);
        balls[goldIdx].gold = 1 - t;
        if (t >= 1) { state = 'shuffle'; moveI = 0; startMove(now); patch({ big: { raw: String(C.moves) } }); }
      } else if (state === 'shuffle') {
        const t = (now - moveStart) / C.dur;
        if (t >= 1) {
          endMove(); moveT = 0; moveI++;
          if (moveI >= C.moves) { state = 'pick'; patch({ big: { raw: '?' }, hint: { k: 'pick' } }); }
          else { startMove(now); patch({ big: { raw: String(C.moves - moveI) } }); }
        } else moveT = ease(t);
      } else if (state === 'result') {
        balls[goldIdx].gold = Math.min(1, (now - stT) / 400);
      }
    }

    function choose(i: number) {
      state = 'result'; stT = performance.now();
      const ok = i === goldIdx;
      balls[goldIdx].mark = ok ? 'ok' : 'gold';
      if (!ok) balls[i].mark = 'bad';
      if (ok) {
        SFX.win(); streak++; round++;
        const grows = roundCfg(round).count > roundCfg(round - 1).count;
        patch({ big: { k: 'correct' }, bigCls: 'ok', go: 'next', round, lives, hint: { k: grows ? 'moreBalls' : 'faster', n: round } });
        return;
      }
      SFX.lose(); lives--;
      if (lives > 0) {
        patch({ big: { k: 'miss' }, bigCls: 'bad', go: 'retry', lives, hint: lives === 1 ? { k: 'lastLife' } : { k: 'livesLeft', n: lives } });
        return;
      }
      // Third miss: game over → leaderboard / share window (score = rounds cleared)
      const endedAt = round, score = streak;
      const { newRecord } = score > 0 ? latest.current.onGameOver(score) : { newRecord: false };
      setRecord(newRecord);
      streak = 0; round = 1; lives = MAX_LIVES;
      patch({ big: { k: 'over' }, bigCls: 'bad', go: 'newGame', round: endedAt, lives: 0, hint: { k: 'endedAt', n: endedAt } });
    }

    function onPointer(e: PointerEvent) {
      if (paused) return;
      if (state === 'idle') { start(); return; }
      if (state !== 'pick') return;
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let bi = -1, bd = Infinity;
      balls.forEach((b, k) => { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; bi = k; } });
      if (bd < S * 0.11) { SFX.tap(); choose(bi); }
    }

    /* ── pause (boss key, hidden tab): freezes the countdown / shuffle where it is ── */
    function pause() {
      if (paused || (state !== 'reveal' && state !== 'blend' && state !== 'shuffle')) return;
      paused = true; pausedAt = performance.now();
      patch({ paused: true });
    }
    function resume() {
      if (!paused) return;
      const d = performance.now() - pausedAt;
      stT += d; moveStart += d; paused = false;
      patch({ paused: false });
    }

    function resize() {
      const w = stage.clientWidth;
      const nextS = Math.floor(Math.min(w, 460, Math.max(260, window.innerHeight - 300)));
      if (nextS === S && canvas.width) return;
      S = nextS;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = S * dpr; canvas.height = S * dpr;
      canvas.style.width = canvas.style.height = `${S}px`;
    }

    function frame(now: number) {
      if (!paused) update(now);
      draw(paused ? pausedAt : now);
      raf = requestAnimationFrame(frame);
    }

    buildBoard();
    canvas.width = 0;
    resize();
    raf = requestAnimationFrame(frame);
    canvas.addEventListener('pointerdown', onPointer);
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    window.addEventListener('resize', resize);
    const onVisibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    engine.current = { start, resume };
    pauseRef.current = pause;

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointer);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      engine.current = null;
      pauseRef.current = null;
    };
  }, [pauseRef]);

  // Space / Enter press the main button (ignored while typing or when a dialog is open)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (ui.paused) { e.preventDefault(); engine.current?.resume(); return; }
      if (ui.go) { e.preventDefault(); engine.current?.start(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui.go, ui.paused]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem(SOUND_KEY, JSON.stringify(next)); } catch {}
  }

  const say = (m: Msg) => ('raw' in m ? m.raw : tx[m.k].replace('{n}', String(m.n ?? '')));
  const tier = tierIndex(ui.round);
  const bestScore = best?.score ?? 0;

  return (
    <div className="fg">
      <p className="fg-tier" data-tier={tier}>{tx.tiers[tier]}</p>
      <div className="fg-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, (ui.round - 1) / 20 * 100)}%` }} /></div>
      <p className="fg-hint" aria-live="polite">{say(ui.hint)}</p>

      <div className="fg-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="fg-canvas" role="img" aria-label={tx.board} />
        {ui.paused && (
          <div className="fg-pause">
            <h2>{tx.paused}</h2>
            <button type="button" className="gx-btn gx-primary" onClick={() => engine.current?.resume()}>{tx.resume}</button>
          </div>
        )}
      </div>

      <div className={`fg-big${ui.bigCls ? ` ${ui.bigCls}` : ''}`} aria-live="polite">{say(ui.big)}</div>
      {record && <p className="fg-record">🏅 {tx.newRecord}</p>}
      <p className="fg-sub">{ui.go === 'play' ? tx.intro : tx.decoys.replace('{n}', String(ui.decoys))}</p>

      <div className="fg-row">
        <button
          type="button" className={`gx-btn gx-primary fg-go${ui.go ? '' : ' fg-hidden'}`}
          onClick={() => engine.current?.start()} tabIndex={ui.go ? 0 : -1}
        >
          {tx[ui.go ?? 'play']}
        </button>
        <button type="button" className="fg-snd" aria-pressed={soundOn} onClick={toggleSound}>
          {soundOn ? '🔊' : '🔇'} {tx.sound} {soundOn ? tx.on : tx.off}
        </button>
      </div>

      <div className="fg-stats">
        {tx.lives} <b className="fg-lives" aria-label={`${ui.lives}/${MAX_LIVES}`}>{'●'.repeat(ui.lives)}{'○'.repeat(MAX_LIVES - ui.lives)}</b>
        <span aria-hidden="true"> · </span>{tx.round} <b>{ui.round}</b>
        <span aria-hidden="true"> · </span>{tx.best} <b>{bestScore}</b>
      </div>

      <FollowGoldStyles />
    </div>
  );
}

function FollowGoldStyles() {
  return (
    <style>{`
      .fg {
        display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 12px 18px;
        border-radius: 18px; background: #03040a; border: 1px solid rgba(245,184,41,.18);
        user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
      }
      .fg-tier {
        margin: 0; color: #f5b829; font: 700 14px 'Poppins', sans-serif; letter-spacing: .38em; padding-inline-start: .38em;
        text-transform: uppercase; text-align: center; transition: color .4s;
      }
      .fg-tier[data-tier="2"] { color: #ff9f43; }
      .fg-tier[data-tier="3"] { color: #ff4d6d; }
      .fg-meter { width: min(220px, 60%); height: 4px; border-radius: 2px; background: #1b2130; overflow: hidden; }
      .fg-meter i {
        display: block; height: 100%; background: linear-gradient(90deg, #2fd6ee, #f5b829, #ff4d6d);
        background-size: 220px 100%; transition: width .6s ease;
      }
      .fg-hint {
        margin: 0; color: #eef3f8; opacity: .85; letter-spacing: .06em; text-transform: uppercase;
        font-size: 15px; font-weight: 600; min-height: 1.4em; text-align: center;
      }
      .fg-stage { position: relative; width: 100%; max-width: 460px; display: flex; justify-content: center; }
      .fg-canvas { display: block; touch-action: manipulation; cursor: pointer; }
      .fg-pause {
        position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        background: rgba(3,4,10,.72); border-radius: 50%;
      }
      .fg-pause h2 { margin: 0; font: 800 32px 'Poppins', sans-serif; color: #f5b829; }
      .fg-big {
        font: 800 40px/1 'Poppins', sans-serif; min-height: 1em; color: #eef3f8; font-variant-numeric: tabular-nums; text-align: center;
      }
      .fg-big.ok { color: #3ee08f; }
      .fg-big.bad { color: #ff4d6d; }
      .fg-record { margin: 0; font-weight: 800; color: #ffd166; }
      .fg-sub { margin: 0; color: #8b97a8; font-size: 14px; text-align: center; min-height: 1.4em; max-width: 36ch; line-height: 1.45; }
      .fg-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: center; }
      .fg-go { min-width: 160px; }
      .fg-go.fg-hidden { visibility: hidden; }
      .fg-snd {
        font: 600 12px 'Poppins', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #8b97a8;
        background: transparent; border: 1px solid #1b2130; border-radius: 999px; padding: 0 14px; min-height: 40px; cursor: pointer;
      }
      .fg-snd[aria-pressed="true"] { color: #eef3f8; border-color: #8b97a8; }
      .fg-stats { color: #8b97a8; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; font-variant-numeric: tabular-nums; text-align: center; }
      .fg-stats b { color: #eef3f8; font-weight: 700; }
      .fg-stats .fg-lives { color: #f5b829; letter-spacing: .15em; }
      @media (max-height: 700px) { .fg-big { font-size: 32px; } }
    `}</style>
  );
}
