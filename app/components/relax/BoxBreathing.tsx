'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { breathingStrings, type SceneId } from '../../../lib/breathingI18n';
import { formatDays } from '../../../lib/homeI18n';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { useIsClient } from '../../../lib/games/useIsClient';
import { getBreathingState, recordBreathingSession, type BreathingState } from '../../../lib/streak';
import { markBoostActivityDone } from '../../../lib/dailyBoostDay';
import { GameBanner, GameFrame, GameTopBar } from '../games/GameFrame';

/* Box breathing — port of games-reference/breathing/reference.html.
   A photo landscape fills the screen behind frosted panels, with a gentle live effect per scene
   (snow, glints on water, pollen, warm motes, mist) and the picture "breathes" with you.
   The square: a dot walks the four sides (inhale, hold, exhale, hold), the "lungs" grow and shrink.
   Length 1/3/5 min, 3–6 s per side, soft tone, focus mode while running, screen wake lock.
   A finished exercise counts a breathing day (lib/streak.ts) and ticks off "Box breathing"
   in Today's challenge when it is on today's list. */

const COLOR = '#14B8A6';
const IMG = '/images/breathing/';
const SETTINGS_KEY = 'br-settings';
const SCENE_KEY = 'br-scene';

type Fx = 'snow' | 'glint' | 'pollen' | 'motes' | 'mist';
/** [file, sun x, sun y] (fractions of the photo), wide (l) and portrait (p) versions. */
type Shot = [string, number, number];
const SCENES: Record<SceneId, { dot: string; bg: string; fx: Fx; img: { l: Shot; p: Shot } }> = {
  hory: { dot: '#E98A6B', bg: '#3B2747', fx: 'motes', img: { l: ['hory-l.webp', 0.91, 0.395], p: ['hory-p.webp', 0.87, 0.355] } },
  more: { dot: '#3BA7D9', bg: '#1E6E9A', fx: 'glint', img: { l: ['more-l.webp', 0.165, 0.305], p: ['more-p.webp', 0.19, 0.43] } },
  louka: { dot: '#6CC24A', bg: '#4E8A3A', fx: 'pollen', img: { l: ['louka-l.webp', 0.06, 0.18], p: ['louka-p.webp', 0.095, 0.335] } },
  zima: { dot: '#9CC8F0', bg: '#8FAED3', fx: 'snow', img: { l: ['zima-l.webp', 0.105, 0.26], p: ['zima-p.webp', 0.115, 0.345] } },
  // Only a wide photo exists; it is cropped to fit a phone too
  jezero: { dot: '#F2A27A', bg: '#6A5A7A', fx: 'mist', img: { l: ['jezero-l.webp', 0.11, 0.335], p: ['jezero-l.webp', 0.11, 0.335] } },
  vyhlidka: { dot: '#F4C06A', bg: '#4A6A8A', fx: 'motes', img: { l: ['vyhlidka-l.webp', 0.88, 0.46], p: ['vyhlidka-p.webp', 0.865, 0.435] } },
};
const SCENE_IDS = Object.keys(SCENES) as SceneId[];

/** Corners of the square in SVG units: bottom-left → top-left → top-right → bottom-right → bottom-left. */
const CORNERS: [number, number][] = [[10, 290], [10, 10], [290, 10], [290, 290], [10, 290]];
const TONES = [392, 523, 330, 262];
const LUNG_REST = 0.55;

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) as T; } catch { return fallback; }
}
function lsSet(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tone(freq: number) {
  const ac = getGameAudio();
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.07, ac.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.1);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 1.2);
  } catch {}
}

/** m:ss, rounded up. */
function clock(s: number): string {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Exercise length rounded up to whole cycles. */
const totalSeconds = (mins: number, sec: number) => Math.ceil((mins * 60) / (sec * 4)) * sec * 4;

/* ═════════════════════ landscape canvas ═════════════════════ */

type Layer = { im: HTMLImageElement; sx: number; sy: number };
type Particle = { x: number; y: number; s: number; v: number; p: number; u: number; l: number; w: number; dy: number };

/** Paints the scene into a fixed full-screen canvas until stop(); `getBreath` (0.55–1) makes the picture breathe. */
function startLandscape(cv: HTMLCanvasElement, first: SceneId, getBreath: () => number): { swap: (k: SceneId) => void; stop: () => void } {
  const ctx = cv.getContext('2d');
  const sceneRef = { current: first };
  const breath = { get current() { return getBreath(); } };
  if (!ctx) return { swap: () => {}, stop: () => {} };
  {
    const reduce = reducedMotion();
    const imgs = new Map<string, HTMLImageElement>();
    let W = 0, H = 0, DPR = 1, parts: Particle[] = [];
    let cur: Layer | null = null, prev: Layer | null = null, fade = 1;
    let raf = 0;
    const t0 = performance.now();

    const orient = () => (W / H < 1 ? 'p' : 'l');
    const load = (file: string) => {
      let im = imgs.get(file);
      if (im) return im;
      im = new Image();
      im.decoding = 'async';
      im.src = IMG + file;
      im.onload = () => { if (reduce) paint(performance.now()); };
      imgs.set(file, im);
      return im;
    };
    const pick = (): Layer => {
      const [file, sx, sy] = SCENES[sceneRef.current].img[orient()];
      return { im: load(file), sx, sy };
    };
    const makeParts = () => {
      const fx = SCENES[sceneRef.current].fx, r = Math.random;
      const P = (o: Partial<Particle>): Particle => ({ x: 0, y: 0, s: 1, v: 0, p: r() * 6, u: 0, l: 0, w: 0, dy: 0, ...o });
      parts = [];
      if (fx === 'snow') for (let i = 0; i < 150; i++) parts.push(P({ x: r() * W, y: r() * H, s: 0.6 + r() * 2.2, v: 0.15 + r() * 0.5 }));
      if (fx === 'glint') for (let i = 0; i < 70; i++) parts.push(P({ u: r() - 0.5, v: r(), l: 3 + r() * 12 }));
      if (fx === 'pollen' || fx === 'motes') {
        for (let i = 0; i < 40; i++) parts.push(P({ x: r() * W, y: H * (fx === 'pollen' ? 0.5 + r() * 0.5 : 0.3 + r() * 0.7), s: 0.8 + r() * 1.8, v: 0.2 + r() * 0.4 }));
      }
      if (fx === 'mist') for (let i = 0; i < 6; i++) parts.push(P({ x: r() * W, w: W * (0.35 + r() * 0.4), dy: (r() - 0.5) * 0.06, v: 0.004 + r() * 0.006 }));
    };
    const cover = (im: HTMLImageElement, zoom: number) => {
      const s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * zoom;
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      return { w, h, x: (W - w) / 2, y: (H - h) / 2 };
    };

    function paint(now: number) {
      const t = (now - t0) / 1000;
      const b = breath.current;
      const sc = SCENES[sceneRef.current];
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx!.fillStyle = sc.bg;
      ctx!.fillRect(0, 0, W, H);
      // Slow drift, and the landscape breathes with you
      const zoom = reduce ? 1 : 1.03 + 0.012 * Math.sin(t / 24) + (0.018 * (b - LUNG_REST)) / 0.45;
      const draw = (L: Layer | null, a: number) => {
        if (!L || !L.im.complete || !L.im.naturalWidth) return null;
        const g = cover(L.im, zoom);
        ctx!.globalAlpha = a;
        ctx!.drawImage(L.im, g.x, g.y, g.w, g.h);
        ctx!.globalAlpha = 1;
        return g;
      };
      if (prev && fade < 1) draw(prev, 1);
      const geo = draw(cur, prev ? Math.min(1, fade) : 1);
      if (fade < 1) { fade += 0.025; if (fade >= 1) prev = null; }
      if (!geo || !cur) return;

      // Sun glow that brightens on the inhale
      const sx = geo.x + cur.sx * geo.w, sy = geo.y + cur.sy * geo.h, R = Math.min(W, H) * (0.16 + 0.12 * b);
      const glow = ctx!.createRadialGradient(sx, sy, 0, sx, sy, R);
      glow.addColorStop(0, `rgba(255,236,190,${0.18 + 0.22 * b})`);
      glow.addColorStop(1, 'rgba(255,236,190,0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(sx - R, sy - R, R * 2, R * 2);

      for (const p of parts) {
        if (sc.fx === 'snow') {
          const y = (p.y + t * p.v * 40) % H, x = p.x + Math.sin(t * 0.6 + p.p) * 12;
          ctx!.fillStyle = 'rgba(255,255,255,.85)';
          ctx!.beginPath(); ctx!.arc(x, y, p.s, 0, 7); ctx!.fill();
        } else if (sc.fx === 'glint') {
          const y = sy + (H - sy) * (0.08 + p.v * 0.6), spread = ((y - sy) / H) * 0.9 + 0.03;
          const x = sx + p.u * W * spread, a = Math.max(0, Math.sin(t * 2.2 + p.p)) * 0.7;
          ctx!.fillStyle = `rgba(255,250,225,${a})`;
          ctx!.fillRect(x, y, p.l, 1.6);
        } else if (sc.fx === 'pollen' || sc.fx === 'motes') {
          const x = (p.x + Math.sin(t * 0.3 + p.p) * 30 + t * p.v * 6) % W, y = p.y + Math.sin(t * 0.5 + p.p * 2) * 14;
          const a = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.8 + p.p));
          ctx!.fillStyle = sc.fx === 'pollen' ? `rgba(255,240,170,${a})` : `rgba(255,220,170,${a * 0.8})`;
          ctx!.beginPath(); ctx!.arc(x, y, p.s, 0, 7); ctx!.fill();
        } else {
          const x = ((p.x + t * p.v * W * 0.1) % (W + p.w * 2)) - p.w, y = geo.y + geo.h * (0.56 + p.dy);
          const mg = ctx!.createRadialGradient(x, y, 0, x, y, p.w * 0.5);
          mg.addColorStop(0, 'rgba(255,235,225,.16)');
          mg.addColorStop(1, 'rgba(255,235,225,0)');
          ctx!.save();
          ctx!.translate(x, y); ctx!.scale(1, 0.18); ctx!.translate(-x, -y);
          ctx!.fillStyle = mg;
          ctx!.fillRect(x - p.w * 0.5, y - p.w * 0.5, p.w, p.w);
          ctx!.restore();
        }
      }
    }
    const loop = (now: number) => {
      try { paint(now); } catch {}
      raf = requestAnimationFrame(loop);
    };
    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth || 390; H = window.innerHeight || 844;
      cv.width = W * DPR; cv.height = H * DPR;
      cur = pick(); prev = null; fade = 1;
      makeParts();
      if (reduce) paint(performance.now());
    };
    const swap = (k: SceneId) => {
      sceneRef.current = k;
      const old = cur;
      cur = pick(); prev = old; fade = old ? 0 : 1;
      makeParts();
      if (reduce) { prev = null; paint(performance.now()); }
    };

    resize();
    let lw = window.innerWidth, lh = window.innerHeight;
    // Mobile address bars change the height while scrolling: only react to real size changes
    const onResize = () => { if (window.innerWidth !== lw || Math.abs(window.innerHeight - lh) > 120) { lw = window.innerWidth; lh = window.innerHeight; resize(); } };
    window.addEventListener('resize', onResize);
    if (!reduce) raf = requestAnimationFrame(loop);
    // Warm up the other photos for this screen shape
    const warm = setTimeout(() => SCENE_IDS.forEach(k => load(SCENES[k].img[orient()][0])), 1500);
    return {
      swap,
      stop: () => {
        cancelAnimationFrame(raf);
        clearTimeout(warm);
        window.removeEventListener('resize', onResize);
      },
    };
  }
}

function useLandscape(canvas: React.RefObject<HTMLCanvasElement | null>, scene: SceneId, breath: React.RefObject<number>) {
  const painter = useRef<ReturnType<typeof startLandscape> | null>(null);
  const shown = useRef(scene);
  useEffect(() => {
    if (!canvas.current) return;
    const p = startLandscape(canvas.current, shown.current, () => breath.current ?? LUNG_REST);
    painter.current = p;
    return () => { p.stop(); painter.current = null; };
  }, [canvas, breath]);
  useEffect(() => {
    if (shown.current === scene) return;
    shown.current = scene;
    painter.current?.swap(scene);
  }, [scene]);
}

/* ═════════════════════ page ═════════════════════ */

export default function BoxBreathing() {
  const isClient = useIsClient();
  return isClient ? <BoxBreathingBody /> : <GameFrame color={COLOR}><div style={{ minHeight: 900 }} /></GameFrame>;
}

type Settings = { mins: number; sec: number; sound: boolean };
type Phase = -1 | 0 | 1 | 2 | 3;
type Result = { days: BreathingState; boost: boolean; mins: number } | null;

function BoxBreathingBody() {
  const { t, lang } = useLang();
  const tr = breathingStrings(lang);
  const [scene, setScene] = useState<SceneId>(() => {
    const saved = lsGet<string | null>(SCENE_KEY, null);
    return saved && saved in SCENES ? saved as SceneId : SCENE_IDS[Math.floor(Date.now() / 864e5) % SCENE_IDS.length];
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const s = lsGet<Partial<Settings>>(SETTINGS_KEY, {});
    return {
      mins: [1, 3, 5].includes(s.mins ?? 0) ? s.mins! : 3,
      sec: [3, 4, 5, 6].includes(s.sec ?? 0) ? s.sec! : 4,
      sound: s.sound !== false,
    };
  });
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>(-1);
  const [result, setResult] = useState<Result>(null);
  const [days, setDays] = useState<BreathingState>(getBreathingState);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const breath = useRef(LUNG_REST);
  useLandscape(canvasRef, scene, breath);

  const progRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const lungRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const cycleRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; });

  function chooseScene(k: SceneId) {
    setScene(k);
    lsSet(SCENE_KEY, k);
  }
  function change(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    lsSet(SETTINGS_KEY, next);
    setResult(null);
  }

  /* Idle look: dot at the start, lungs at rest, full time left */
  const resetVisuals = useCallback(() => {
    const { mins, sec } = settingsRef.current;
    progRef.current?.setAttribute('d', '');
    dotRef.current?.setAttribute('cx', '10');
    dotRef.current?.setAttribute('cy', '290');
    if (lungRef.current) lungRef.current.style.transform = `translate(-50%, -50%) scale(${LUNG_REST})`;
    if (countRef.current) countRef.current.textContent = String(sec);
    if (cycleRef.current) cycleRef.current.textContent = '0';
    if (leftRef.current) leftRef.current.textContent = clock(totalSeconds(mins, sec));
    breath.current = LUNG_REST;
  }, []);
  useEffect(() => { if (!running && !result) resetVisuals(); }, [settings, running, result, resetVisuals]);

  /* Screen wake lock while running (re-acquired after the tab comes back) */
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!running) return;
    const lock = () => {
      if (document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
      navigator.wakeLock.request('screen').then(l => { wakeRef.current = l; }).catch(() => {});
    };
    lock();
    document.addEventListener('visibilitychange', lock);
    return () => {
      document.removeEventListener('visibilitychange', lock);
      wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [running]);

  /* The exercise loop: moves the dot, grows the lungs, plays the tone on each side */
  useEffect(() => {
    if (!running) return;
    const { mins, sec, sound } = settingsRef.current;
    const reduce = reducedMotion();
    const cycleLen = sec * 4, end = totalSeconds(mins, sec);
    const t0 = performance.now();
    let last = -1, raf = 0;
    const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
    const frame = (now: number) => {
      const el = (now - t0) / 1000;
      if (el >= end) {
        if (sound) { tone(523); setTimeout(() => tone(659), 250); }
        const daysNow = recordBreathingSession();
        const boost = markBoostActivityDone('breathing');
        setDays(daysNow);
        setResult({ days: daysNow, boost, mins });
        setPhase(-1);
        setRunning(false);
        if (lungRef.current) lungRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
        if (leftRef.current) leftRef.current.textContent = '0:00';
        breath.current = LUNG_REST;
        return;
      }
      const inCycle = el % cycleLen;
      const ph = Math.floor(inCycle / sec) as 0 | 1 | 2 | 3;
      const p = (inCycle % sec) / sec;
      if (ph !== last) {
        last = ph;
        if (sound) tone(TONES[ph]);
        setPhase(ph);
      }
      if (countRef.current) countRef.current.textContent = String(Math.ceil(sec - (inCycle % sec) - 1e-9));
      if (cycleRef.current) cycleRef.current.textContent = String(Math.floor(el / cycleLen) + 1);
      if (leftRef.current) leftRef.current.textContent = clock(end - el);
      const [ax, ay] = CORNERS[ph], [bx, by] = CORNERS[ph + 1];
      const x = ax + (bx - ax) * p, y = ay + (by - ay) * p;
      dotRef.current?.setAttribute('cx', String(x));
      dotRef.current?.setAttribute('cy', String(y));
      let d = `M${CORNERS[0].join(' ')}`;
      for (let i = 1; i <= ph; i++) d += ` L${CORNERS[i].join(' ')}`;
      progRef.current?.setAttribute('d', `${d} L${x} ${y}`);
      const s = ph === 0 ? LUNG_REST + 0.45 * ease(p) : ph === 1 ? 1 : ph === 2 ? 1 - 0.45 * ease(p) : LUNG_REST;
      breath.current = s;
      if (!reduce && lungRef.current) lungRef.current.style.transform = `translate(-50%, -50%) scale(${s})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  function start() {
    getGameAudio(); // created inside the tap so sound is allowed
    setResult(null);
    setPhase(-1);
    resetVisuals();
    setRunning(true);
    requestAnimationFrame(() => stageRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }));
  }
  function stop() {
    setRunning(false);
    setPhase(-1);
    resetVisuals();
  }

  // Esc leaves the exercise
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') stop(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { mins, sec, sound } = settings;
  const minutes = (n: number, display: 'short' | 'long' = 'short') =>
    new Intl.NumberFormat(lang, { style: 'unit', unit: 'minute', unitDisplay: display }).format(n);
  const tip = tr.scenes[scene];
  const doneToday = days.lastDate !== '' && result !== null;

  const centerPhase = result ? tr.doneTitle : phase >= 0 ? tr.phases[phase as 0 | 1 | 2 | 3] : tr.ready;
  const centerHint = result ? tr.doneText.replace('{min}', minutes(result.mins, 'long')) : phase >= 0 ? tr.hints[phase as 0 | 1 | 2 | 3] : tr.perSide;

  return (
    <GameFrame color={COLOR} className={`br-page${running ? ' is-focus' : ''}`}>
      <canvas ref={canvasRef} className="br-scene" aria-hidden="true" />

      <div className="br-top">
        <GameTopBar>
          <span className="gx-pill" title={tr.days}>
            <span aria-hidden="true">🌿</span>
            <span className="br-pill-label">{tr.days}</span>
            <b>{days.totalDays.toLocaleString(lang)}</b>
          </span>
          {days.currentStreak > 1 && (
            <span className="gx-pill" title={tr.inRow}>
              <span aria-hidden="true">🔥</span> <b>{formatDays(days.currentStreak, lang)}</b>
            </span>
          )}
        </GameTopBar>
      </div>

      <div className="br-hide">
        <GameBanner title={t.gamesHub.name_breathing} desc={tr.lead} icon="🫁" />
      </div>

      <div className="br-scenes br-hide" role="group" aria-label={tr.scenesAria}>
        {SCENE_IDS.map(k => (
          <button key={k} type="button" className="br-chip" aria-pressed={k === scene} onClick={() => chooseScene(k)}>
            <i style={{ background: SCENES[k].dot }} aria-hidden="true" />{tr.scenes[k][0]}
          </button>
        ))}
      </div>

      <section ref={stageRef} className="br-glass br-stage" aria-label={tr.exerciseAria}>
        <div className="br-box">
          <svg viewBox="-20 -20 340 340" aria-hidden="true">
            <rect className="br-track" x="10" y="10" width="280" height="280" rx="22" />
            <path className="br-prog" ref={progRef} d="" />
            <circle className="br-dot" ref={dotRef} r="11" cx="10" cy="290" />
            <text className={`br-lbl${phase === 0 ? ' on' : ''}`} x="-8" y="150" textAnchor="middle" transform="rotate(-90 -8 150)">{tr.sides[0]}</text>
            <text className={`br-lbl${phase === 1 ? ' on' : ''}`} x="150" y="-4" textAnchor="middle">{tr.sides[1]}</text>
            <text className={`br-lbl${phase === 2 ? ' on' : ''}`} x="308" y="150" textAnchor="middle" transform="rotate(90 308 150)">{tr.sides[2]}</text>
            <text className={`br-lbl${phase === 3 ? ' on' : ''}`} x="150" y="312" textAnchor="middle">{tr.sides[3]}</text>
          </svg>
          <div className="br-lung" ref={lungRef}>
            <div className="br-phase" aria-live="polite">{centerPhase}</div>
            <div className="br-count" ref={countRef}>{result ? '✓' : sec}</div>
            <div className="br-hint">{centerHint}</div>
          </div>
        </div>

        <div className="br-meta">
          <span>{tr.cycle} <b ref={cycleRef}>0</b></span>
          <span>{tr.left} <b ref={leftRef}>{clock(totalSeconds(mins, sec))}</b></span>
        </div>

        {result && (
          <div className="br-result" role="status">
            <span>{tr.countedToday}</span>
            <span>{tr.days}: <b>{formatDays(result.days.totalDays, lang)}</b></span>
            {result.days.currentStreak > 1 && <span>{tr.inRow}: <b>{formatDays(result.days.currentStreak, lang)}</b></span>}
            {result.boost && <span>{tr.boostDone}</span>}
          </div>
        )}

        <button type="button" className={`br-go${running ? ' is-stop' : ''}`} onClick={running ? stop : start}>
          {running ? tr.stop : doneToday || result ? tr.again : tr.start}
        </button>

        <div className="br-settings br-hide">
          <div className="br-row"><span>{tr.duration}</span>
            <div className="br-seg">
              {[1, 3, 5].map(v => <button key={v} type="button" aria-pressed={mins === v} onClick={() => change({ mins: v })}>{minutes(v)}</button>)}
            </div>
          </div>
          <div className="br-row"><span>{tr.secPerSide}</span>
            <div className="br-seg">
              {[3, 4, 5, 6].map(v => <button key={v} type="button" aria-pressed={sec === v} onClick={() => change({ sec: v })}>{v.toLocaleString(lang)}</button>)}
            </div>
          </div>
          <div className="br-row"><span>{tr.sound}</span>
            <div className="br-seg">
              <button type="button" aria-pressed={sound} onClick={() => change({ sound: true })}>{tr.on}</button>
              <button type="button" aria-pressed={!sound} onClick={() => change({ sound: false })}>{tr.off}</button>
            </div>
          </div>
        </div>
      </section>

      <div className="br-glass br-outside br-hide">
        <div className="br-ico" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5EEAD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l6-10 4 6 3-4 5 8z" /><circle cx="17" cy="6" r="2" /></svg>
        </div>
        <div><b>{tip[1]}</b><p>{tip[2]}</p></div>
      </div>

      <section className="br-glass br-panel br-hide">
        <h2>{tr.howTitle.replace('{s}', String(sec))}</h2>
        <div className="br-steps">
          {tr.steps.map(([title, text], i) => (
            <div key={i} className="br-step">
              <div className="br-n">{(i + 1).toLocaleString(lang)}</div>
              <b>{title}</b>
              <p>{text.replace('{s}', sec.toLocaleString(lang))}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="br-glass br-panel br-hide">
        <h2>{tr.beforeTitle}</h2>
        <ul className="br-tips">{tr.tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <p className="br-note">{tr.note}</p>
      </section>

      <BreathingStyles />
    </GameFrame>
  );
}

function BreathingStyles() {
  return (
    <style>{`
      .br-page {
        --br-glass: rgba(8,11,34,.46); --br-glass-strong: rgba(8,11,34,.62); --br-line: rgba(242,243,255,.14);
        --br-ink: #F2F3FF; --br-dim: #C9CCEB; --br-accent: ${COLOR}; --br-accent-2: #5EEAD4; --br-on-accent: #042F2A;
        gap: 16px; padding-bottom: 24px;
      }
      .br-page > .gx-glow { display: none; }
      /* Full-screen landscape behind the panels (below the site's top bar and bottom nav) */
      .br-scene { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -2; display: block; pointer-events: none; background: #0A1030; }
      .br-glass {
        background: var(--br-glass); border: 1px solid var(--br-line); border-radius: 24px; color: var(--br-ink);
        backdrop-filter: blur(10px) saturate(1.25); -webkit-backdrop-filter: blur(10px) saturate(1.25);
      }
      .br-page .gx-banner { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
      .br-pill-label { display: inline; }
      .br-page .gx-pill, .br-page .gx-back { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); background: rgba(8,11,34,.5); }

      .br-scenes { display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; }
      .br-scenes::-webkit-scrollbar { display: none; }
      .br-chip {
        flex: none; display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; border-radius: 999px; cursor: pointer;
        font: 600 14px 'Poppins', system-ui, sans-serif; color: var(--br-ink);
        background: var(--br-glass-strong); border: 1px solid var(--br-line);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      }
      .br-chip i { width: 14px; height: 14px; border-radius: 50%; flex: none; }
      .br-chip[aria-pressed="true"] { background: var(--br-accent); border-color: var(--br-accent); color: var(--br-on-accent); }

      .br-stage {
        padding: 22px 16px; display: flex; flex-direction: column; align-items: center; gap: 16px;
        background: color-mix(in srgb, var(--br-glass) 55%, transparent);
        backdrop-filter: blur(4px) saturate(1.2); -webkit-backdrop-filter: blur(4px) saturate(1.2);
      }
      .br-box { position: relative; width: min(300px, 78vw); aspect-ratio: 1; max-width: 100%; }
      .br-box svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .br-track { fill: rgba(255,255,255,.06); stroke: rgba(255,255,255,.7); stroke-width: 7; stroke-linejoin: round; filter: drop-shadow(0 2px 10px rgba(0,0,0,.35)); }
      .br-prog { fill: none; stroke: #fff; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 10px var(--br-accent)) drop-shadow(0 0 22px var(--br-accent)); }
      .br-dot { fill: #fff; stroke: var(--br-accent); stroke-width: 5; filter: drop-shadow(0 0 12px #fff) drop-shadow(0 0 24px var(--br-accent)); }
      .br-lbl {
        font: 800 12px 'Poppins', system-ui, sans-serif; letter-spacing: .1em; text-transform: uppercase; fill: #fff; opacity: .75;
        paint-order: stroke; stroke: rgba(10,12,40,.55); stroke-width: 3px;
      }
      .br-lbl.on { opacity: 1; stroke: var(--br-accent); stroke-width: 4px; }
      /* Letter spacing breaks joined scripts (Arabic, Devanagari) */
      [dir="rtl"] .br-lbl, :lang(ar) .br-lbl, :lang(hi) .br-lbl { letter-spacing: 0; }
      .br-lung {
        position: absolute; left: 50%; top: 50%; width: 62%; aspect-ratio: 1; border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,.55) 0%, rgba(255,255,255,.18) 70%, rgba(255,255,255,.05) 100%);
        border: 2px solid rgba(255,255,255,.6); box-shadow: 0 0 40px rgba(255,255,255,.35), inset 0 0 30px rgba(255,255,255,.25);
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        transform: translate(-50%, -50%) scale(${LUNG_REST}); transition: transform .5s ease;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
      }
      .is-focus .br-lung { transition: none; }
      .br-phase { font: 800 clamp(18px, 5vw, 22px) 'Poppins', system-ui, sans-serif; color: #fff; text-shadow: 0 1px 8px rgba(10,12,40,.6); text-align: center; padding: 0 6px; }
      .br-count { font: 800 clamp(44px, 13vw, 62px)/1 'Poppins', system-ui, sans-serif; color: #fff; font-variant-numeric: tabular-nums; text-shadow: 0 0 18px var(--br-accent), 0 2px 8px rgba(10,12,40,.5); }
      .br-hint { font-size: 12px; font-weight: 600; color: #fff; text-align: center; padding: 0 12px; text-shadow: 0 1px 6px rgba(10,12,40,.7); max-width: 92%; }
      .br-meta { display: flex; gap: 18px; font-size: 13px; color: var(--br-dim); font-variant-numeric: tabular-nums; }
      .br-meta b { color: var(--br-ink); }
      .br-result { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; font-size: 13px; color: var(--br-dim); text-align: center; }
      .br-result b { color: var(--br-ink); }
      .br-result span:first-child { color: var(--br-accent-2); font-weight: 700; }
      .br-go {
        min-width: 200px; min-height: 52px; padding: 0 40px; border-radius: 999px; cursor: pointer; border: 0;
        font: 800 17px 'Poppins', system-ui, sans-serif; color: var(--br-on-accent);
        background: linear-gradient(160deg, #5EEAD4, var(--br-accent)); box-shadow: 0 0 26px color-mix(in srgb, var(--br-accent) 55%, transparent);
      }
      .br-go.is-stop { background: var(--br-glass-strong); color: var(--br-ink); border: 2px solid var(--br-line); box-shadow: none; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
      .br-page button:focus-visible { outline: 3px solid var(--br-accent-2); outline-offset: 3px; }

      .br-settings { display: flex; flex-direction: column; gap: 12px; width: 100%; }
      .br-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
      .br-row > span { font-size: 14px; font-weight: 600; }
      .br-seg { display: flex; gap: 6px; flex-wrap: wrap; }
      .br-seg button {
        min-width: 44px; min-height: 40px; padding: 0 12px; border-radius: 10px; cursor: pointer;
        font: 600 14px 'Poppins', system-ui, sans-serif; color: var(--br-ink); background: transparent; border: 1px solid var(--br-line);
      }
      .br-seg button[aria-pressed="true"] { background: var(--br-accent); border-color: var(--br-accent); color: var(--br-on-accent); }

      .br-outside { padding: 16px 20px; display: flex; gap: 14px; align-items: flex-start; }
      .br-ico { flex: none; width: 40px; height: 40px; border-radius: 12px; background: rgba(14,47,51,.9); display: grid; place-items: center; }
      .br-outside b { display: block; font-size: 15px; margin-bottom: 2px; }
      .br-outside p { margin: 0; font-size: 14px; color: var(--br-dim); line-height: 1.5; }
      .br-panel { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
      .br-panel h2 { margin: 0; font: 800 18px 'Poppins', system-ui, sans-serif; }
      .br-steps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .br-step { background: var(--br-glass-strong); border: 1px solid var(--br-line); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
      .br-n { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; font-weight: 800; font-size: 14px; background: rgba(20,184,166,.22); color: var(--br-accent-2); }
      .br-step b { font-size: 15px; }
      .br-step p { margin: 0; font-size: 13px; color: var(--br-dim); line-height: 1.45; }
      .br-tips { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
      .br-tips li { display: flex; gap: 10px; font-size: 14px; line-height: 1.5; color: var(--br-dim); }
      .br-tips li::before { content: ''; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--br-accent-2); margin-top: 7px; }
      .br-note { margin: 0; font-size: 12px; color: var(--br-dim); line-height: 1.5; }

      /* Focus mode while the exercise runs: only the square stays */
      .is-focus .br-hide, .is-focus .br-top { display: none; }
      .is-focus { min-height: calc(100dvh - 140px); justify-content: center; }
      .is-focus .br-stage { background: transparent; border-color: transparent; backdrop-filter: none; -webkit-backdrop-filter: none; }
      .is-focus .br-meta { background: var(--br-glass-strong); padding: 6px 16px; border-radius: 999px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }

      @media (max-width: 400px) {
        .br-pill-label { display: none; }
        .br-steps { grid-template-columns: minmax(0, 1fr); }
      }
      @media (prefers-reduced-motion: reduce) { .br-lung { transition: none; } }
    `}</style>
  );
}
