'use client';

import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import GameShell, { useGameShell } from './GameShell';

/* Sky Tower — port of games-reference/sky-tower.
   Tap / click / Space drops the moving block. Within 3 % of the block width = perfect (combo);
   from the 3rd combo in a row the block grows back by 8 px. Score = floors built. */

type Phase = 'menu' | 'play' | 'pause' | 'over';

interface GameControls { pause: () => void }

interface Block { x: number; w: number; i: number }
interface Falling extends Block { y: number; vy: number; vx: number; rot: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }
interface Star { x: number; y: number; r: number; t: number }

export default function SkyTower() {
  const controlsRef = useRef<GameControls | null>(null);
  return (
    <GameShell gameId="sky-tower" onHide={() => controlsRef.current?.pause()}>
      <SkyTowerGame controlsRef={controlsRef} />
    </GameShell>
  );
}

function SkyTowerGame({ controlsRef }: { controlsRef: React.RefObject<GameControls | null> }) {
  const { t, lang } = useLang();
  const { onGameOver, startRound, best } = useGameShell();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState<{ text: string; key: number } | null>(null);
  const [result, setResult] = useState<{ score: number; message: string } | null>(null);

  const bestScore = best?.score ?? 0;

  // Latest values for the game loop, which lives outside React's render cycle
  const latest = useRef({ onGameOver, startRound, bestScore, t });
  useEffect(() => { latest.current = { onGameOver, startRound, bestScore, t }; });

  // Commands the UI sends to the engine (start / resume / place)
  const engine = useRef<{ start: () => void; resume: () => void; place: () => void } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const stage = stageRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, BH = 30, BASEW = 200;
    let tower: Block[] = [];
    let cur: Block | null = null;
    let falling: Falling[] = [];
    let particles: Particle[] = [];
    let camY = 0, camTarget = 0, floors = 0, streak = 0, speed = 2.6, dir = 1, hue0 = 0, shake = 0;
    let state: Phase = 'menu';
    let raf = 0;
    let overTimer: ReturnType<typeof setTimeout> | undefined;
    const stars: Star[] = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random() * 3, r: Math.random() * 1.4 + 0.3, t: Math.random() * 6 }));

    const setState = (p: Phase) => { state = p; setPhase(p); };
    const blockColor = (i: number, l = 58) => `hsl(${(hue0 + i * 7) % 360} 78% ${l}%)`;
    const topY = (i: number) => H * 0.72 - i * BH;

    function beep(freq: number, dur: number) {
      const ac = getGameAudio();
      if (!ac) return;
      try {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.12, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur + 0.15);
        o.connect(g); g.connect(ac.destination);
        o.start(); o.stop(ac.currentTime + dur + 0.16);
      } catch {}
    }

    function resize() {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      BH = Math.max(26, Math.min(40, H / 22));
      BASEW = Math.min(W * 0.62, 300);
      if (state === 'menu') buildDemo();
    }

    function spawn() {
      const top = tower[tower.length - 1];
      dir = tower.length % 2 ? 1 : -1;
      cur = { w: top.w, x: dir > 0 ? -top.w : W, i: tower.length };
    }

    function reset() {
      hue0 = Math.random() * 360;
      tower = [{ x: (W - BASEW) / 2, w: BASEW, i: 0 }];
      falling = []; particles = []; camY = 0; camTarget = 0;
      floors = 0; streak = 0; speed = 2.6; shake = 0;
      setScore(0);
      spawn();
    }

    // Idle tower behind the start screen
    function buildDemo() {
      reset();
      for (let k = 0; k < 6; k++) {
        const top = tower[tower.length - 1];
        const off = (Math.random() - 0.5) * 16;
        tower.push({ x: top.x + off, w: top.w - Math.abs(off), i: tower.length });
      }
      spawn();
      if (cur) cur.x = W * 0.2;
    }

    function burst(x: number, y: number, w: number, perfect: boolean) {
      const n = perfect ? 26 : 10;
      for (let k = 0; k < n; k++) {
        particles.push({
          x: x + (Math.random() - 0.5) * w, y: y + BH / 2,
          vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3 - 1,
          life: 1, c: perfect ? '#ffd166' : blockColor(tower.length, 75), r: Math.random() * 3 + 1.5,
        });
      }
    }

    function showCombo(n: number) {
      const word = latest.current.t.skyTower.perfect;
      const text = n >= 3 ? `${word} ×${n} +` : `${word}${n > 1 ? ` ×${n}` : ''}`;
      setCombo(c => ({ text, key: (c?.key ?? 0) + 1 }));
    }

    function place() {
      if (state !== 'play' || !cur) return;
      const top = tower[tower.length - 1];
      const left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w);
      const overlap = right - left;
      if (overlap <= 0) {
        falling.push({ x: cur.x, w: cur.w, y: topY(cur.i), i: cur.i, vy: 0, vx: dir * 1.5, rot: 0 });
        cur = null;
        gameOver();
        return;
      }
      const tol = Math.max(3, top.w * 0.03);
      if (Math.abs(cur.x - top.x) <= tol) {
        streak++;
        const nw = streak >= 3 ? Math.min(BASEW, top.w + 8) : top.w;
        const cx = top.x + top.w / 2;
        tower.push({ x: cx - nw / 2, w: nw, i: cur.i });
        burst(cx, topY(cur.i), nw, true);
        showCombo(streak);
        beep(520 + streak * 60, 0.09);
      } else {
        streak = 0;
        // the overhang breaks off and falls
        if (cur.x < top.x) falling.push({ x: cur.x, w: top.x - cur.x, y: topY(cur.i), i: cur.i, vy: 0, vx: -1.2, rot: 0 });
        if (cur.x + cur.w > top.x + top.w) falling.push({ x: top.x + top.w, w: cur.x + cur.w - (top.x + top.w), y: topY(cur.i), i: cur.i, vy: 0, vx: 1.2, rot: 0 });
        tower.push({ x: left, w: overlap, i: cur.i });
        burst(left + overlap / 2, topY(cur.i), overlap, false);
        beep(300, 0.06);
      }
      floors++;
      setScore(floors);
      speed = Math.min(7.5, 2.6 + floors * 0.11);
      if (topY(tower.length) < H * 0.42) camTarget = H * 0.42 - topY(tower.length);
      spawn();
    }

    function gameOver() {
      setState('over');
      shake = reducedMotion ? 0 : 14;
      beep(140, 0.35);
      const final = floors;
      overTimer = setTimeout(() => {
        const { onGameOver: report, bestScore: prevBest, t: tr } = latest.current;
        const { newRecord } = final > 0 ? report(final) : { newRecord: false };
        const message = newRecord
          ? tr.skyTower.newRecord
          : final < 10
            ? tr.skyTower.calmer
            : tr.skyTower.toRecord.replace('{n}', String(Math.max(1, prevBest - final + 1)));
        setResult({ score: final, message });
      }, 700);
    }

    function sky() {
      const tt = Math.min(1, camY / (BH * 120)); // climbs from dusk into deep space
      const g = ctx.createLinearGradient(0, 0, 0, H);
      const h = (250 + tt * 30) % 360;
      g.addColorStop(0, `hsl(${h} 60% ${18 - tt * 12}%)`);
      g.addColorStop(0.6, `hsl(${h - 30} 55% ${30 - tt * 16}%)`);
      g.addColorStop(1, `hsl(${(h + 90) % 360} 65% ${48 - tt * 20}%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const now = performance.now() / 1000;
      for (const s of stars) {
        const y = ((s.y * H + camY * 0.25) % (H * 1.2)) - H * 0.1;
        const a = (0.35 + 0.65 * Math.abs(Math.sin(now + s.t))) * Math.min(1, 0.25 + tt * 1.5);
        ctx.fillStyle = `rgba(255,247,236,${a})`;
        ctx.beginPath(); ctx.arc(s.x * W, y, s.r, 0, 7); ctx.fill();
      }
      // ground hills
      const gy = H * 0.72 + BH + camY;
      if (gy < H + 40) {
        ctx.fillStyle = '#14163a';
        ctx.beginPath(); ctx.moveTo(0, gy + 30);
        ctx.quadraticCurveTo(W * 0.25, gy - 10, W * 0.5, gy + 8);
        ctx.quadraticCurveTo(W * 0.8, gy + 26, W, gy - 4);
        ctx.lineTo(W, H + camY); ctx.lineTo(0, H + camY); ctx.fill();
      }
    }

    function drawBlock(x: number, y: number, w: number, i: number, alpha = 1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = blockColor(i); ctx.fillRect(x, y, w, BH);
      ctx.fillStyle = blockColor(i, 70); ctx.fillRect(x, y, w, BH * 0.22);
      ctx.fillStyle = blockColor(i, 44); ctx.fillRect(x, y + BH * 0.82, w, BH * 0.18);
      if (w > 30) { // windows
        ctx.fillStyle = 'rgba(255,230,160,.55)';
        const n = Math.floor(w / 22), gap = w / n;
        for (let k = 0; k < n; k++) if ((i * 7 + k * 3) % 4) ctx.fillRect(x + gap * k + gap / 2 - 3, y + BH * 0.38, 6, BH * 0.3);
      }
      ctx.globalAlpha = 1;
    }

    let last = performance.now();
    function loop(now: number) {
      const dt = Math.min(2, (now - last) / 16.67);
      last = now;
      const run = state !== 'pause';
      if (run) camY += (camTarget - camY) * 0.08 * dt;
      const sx = shake ? (Math.random() - 0.5) * shake : 0;
      shake *= 0.9; if (shake < 0.3) shake = 0;

      sky();
      ctx.save();
      ctx.translate(sx, camY);
      for (const b of tower) if (topY(b.i) + camY < H + BH) drawBlock(b.x, topY(b.i), b.w, b.i);
      if (cur && (state === 'play' || state === 'pause' || state === 'menu')) {
        if (state === 'play') {
          cur.x += dir * speed * dt;
          if (cur.x + cur.w > W + cur.w * 0.15 && dir > 0) dir = -1;
          if (cur.x < -cur.w * 0.15 && dir < 0) dir = 1;
        }
        if (state !== 'menu') {
          // guide shadow over the top of the tower
          const top = tower[tower.length - 1];
          ctx.fillStyle = 'rgba(255,247,236,.08)';
          ctx.fillRect(top.x, topY(cur.i), top.w, BH);
        }
        drawBlock(cur.x, topY(cur.i), cur.w, cur.i);
      }
      for (let k = falling.length - 1; k >= 0; k--) {
        const f = falling[k];
        if (run) { f.vy += 0.45 * dt; f.y += f.vy * dt; f.x += f.vx * dt; f.rot += f.vx * 0.012 * dt; }
        ctx.save(); ctx.translate(f.x + f.w / 2, f.y + BH / 2); ctx.rotate(f.rot);
        drawBlock(-f.w / 2, -BH / 2, f.w, f.i, 0.9);
        ctx.restore();
        if (f.y + camY > H + 200) falling.splice(k, 1);
      }
      for (let k = particles.length - 1; k >= 0; k--) {
        const p = particles[k];
        if (run) { p.vy += 0.12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.025 * dt; }
        if (p.life <= 0) { particles.splice(k, 1); continue; }
        ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.r, p.r);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      getGameAudio(); // created inside the user gesture so sound is allowed
      clearTimeout(overTimer);
      setResult(null);
      setCombo(null);
      reset();
      latest.current.startRound();
      setState('play');
    }
    const pause = () => { if (state === 'play') setState('pause'); };
    const resume = () => { if (state === 'pause') { last = performance.now(); setState('play'); } };

    engine.current = { start, resume, place };
    controlsRef.current = { pause };

    const onVisibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', onVisibility);
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(overTimer);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      engine.current = null;
      controlsRef.current = null;
    };
  }, [controlsRef]);

  // Space / Enter: drop the block, or start / resume. Ignored while typing or when a dialog is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      if (phase === 'play') engine.current?.place();
      else if (phase === 'pause') engine.current?.resume();
      else if (phase === 'menu' || (phase === 'over' && result)) engine.current?.start();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, result]);

  function onStagePointer(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    if (phase === 'play') engine.current?.place();
  }

  return (
    <div className="st-stage" ref={stageRef} onPointerDown={onStagePointer}>
      <canvas ref={canvasRef} className="st-canvas" aria-label={t.gamesHub.name_skyTower} role="img" />

      <div className="st-hud" aria-live="polite">
        <div className="st-score tabular-nums">{phase === 'menu' ? '' : score}</div>
      </div>

      {combo && <div key={combo.key} className="st-combo">{combo.text}</div>}

      {phase === 'menu' && (
        <div className="st-overlay">
          <p>{t.skyTower.intro}</p>
          <button type="button" className="gx-btn gx-primary st-btn" onClick={() => engine.current?.start()}>{t.skyTower.play}</button>
          <p className="st-tip">{t.skyTower.tip}</p>
        </div>
      )}

      {phase === 'pause' && (
        <div className="st-overlay">
          <h2>{t.skyTower.paused}</h2>
          <button type="button" className="gx-btn gx-primary st-btn" onClick={() => engine.current?.resume()}>{t.skyTower.resume}</button>
        </div>
      )}

      {phase === 'over' && result && (
        <div className="st-overlay">
          <p>{t.skyTower.fellAt}</p>
          <div className="st-big tabular-nums">{result.score.toLocaleString(lang)}</div>
          <p>{result.message}</p>
          <button type="button" className="gx-btn gx-primary st-btn" onClick={() => engine.current?.start()}>{t.skyTower.again}</button>
        </div>
      )}

      <SkyTowerStyles />
    </div>
  );
}

function SkyTowerStyles() {
  return (
    <style>{`
      .st-stage {
        position: relative;
        height: clamp(420px, calc(100dvh - 250px), 640px);
        border-radius: 16px;
        overflow: hidden;
        background: #0d1030;
        color: #fff7ec;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
      }
      .st-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
      .st-hud {
        position: absolute; top: 14px; left: 16px; right: 16px;
        display: flex; justify-content: space-between; align-items: flex-start;
        pointer-events: none; direction: ltr;
      }
      .st-score {
        font: 800 clamp(40px, 11vw, 64px)/1 'Poppins', sans-serif;
        text-shadow: 0 4px 0 rgba(0,0,0,.25);
      }
      .st-combo {
        position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%);
        font: 800 clamp(20px, 5.5vw, 30px) 'Poppins', sans-serif; color: #ffd166; white-space: nowrap;
        text-shadow: 0 3px 0 rgba(0,0,0,.3); pointer-events: none; opacity: 0;
        animation: stPop .9s ease-out;
      }
      @keyframes stPop {
        0% { opacity: 0; transform: translate(-50%, -30%) scale(.7); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 0; transform: translate(-50%, -90%) scale(1); }
      }
      .st-overlay {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        padding: 16px; text-align: center; cursor: default;
        background: radial-gradient(ellipse 75% 60% at 50% 50%, rgba(13,16,48,.78) 0%, rgba(13,16,48,.45) 70%, rgba(13,16,48,.25) 100%);
      }
      .st-overlay h2 {
        margin: 0; font: 800 clamp(34px, 9vw, 56px)/1 'Poppins', sans-serif; color: #ffd166;
        text-shadow: 0 5px 0 rgba(0,0,0,.25); text-wrap: balance;
      }
      .st-overlay p { margin: 0; max-width: 32ch; font-size: 16px; font-weight: 600; color: rgba(255,247,236,.85); text-shadow: 0 2px 8px rgba(0,0,0,.6); }
      .st-overlay .st-tip { font-size: 13px; opacity: .85; }
      .st-big { font: 800 64px/1 'Poppins', sans-serif; color: #ffd166; }
      .st-btn { margin-top: 8px; min-width: 160px; font-size: 18px; }
      @media (prefers-reduced-motion: reduce) { .st-combo { animation: none; opacity: 1; } }
    `}</style>
  );
}
