'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import type { Lang } from '../../../lib/i18n';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { useIsClient } from '../../../lib/games/useIsClient';
import { recordGameCompleted } from '../../../lib/streak';
import { dailyVariantLeaderboardId, formatTimeMs, utcDayKey } from '../../../lib/gamesCatalog';
import {
  REGIONS, REGION_LANG, dailySetIndex, regionFlag, regionFlagEmoji, getSet, isRegion, regionFromCountry, regionFromLang, seededRandom, setCount, type Region,
} from '../../../lib/games/connectSets';
import GameShell, { useGameShell } from './GameShell';
import FlagSelect from '../FlagSelect';

/* Connect Four Words — port of games-reference/connect-four-words.
   4×4 tiles, 4 groups of 4, max 4 mistakes, "one word off" hint, no repeated guesses,
   shuffle / deselect, solved groups collapse into colored bands, timer from the first tap
   (0.1 ms precision), share with colored squares.
   One daily set per region (UTC date). Only the first daily attempt counts and only a solved one
   goes to the region's daily leaderboard. Progress is saved, so switching region or reloading
   neither resets the attempt nor stops the clock. */

const MAX_MISTAKES = 4;
const SQUARES = ['🟨', '🟩', '🟦', '🟪'];
const SHARE_URL = 'https://www.everyday1234567.com/games/connect-four';
const REGION_KEY = 'cf-region';
const stateKey = (region: Region, day: string) => `cf-state-${region}-${day}`;

/* ── localStorage helpers ── */
const STORE_EVENT = 'everyday-cf-change';
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v == null ? null : JSON.parse(v) as T; } catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function subscribeStore(cb: () => void) {
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(STORE_EVENT, cb); window.removeEventListener('storage', cb); };
}
function useStoredRegion(): Region | null {
  const raw = useSyncExternalStore(
    subscribeStore,
    () => { try { return localStorage.getItem(REGION_KEY); } catch { return null; } },
    () => null,
  );
  try { const v = raw ? JSON.parse(raw) : null; return isRegion(v) ? v : null; } catch { return null; }
}

function tone(freq: number, dur: number) {
  const ac = getGameAudio();
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.14, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch {}
}

/** mm:ss.ff while running (the final time uses mm:ss.ffff). */
function fmtLive(ms: number): string {
  const s = ms / 1000, m = Math.floor(s / 60), r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r.toFixed(2).padStart(5, '0')}`;
}

function shuffled<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The day after `day`, i.e. when the next set starts at 00:00 UTC. */
function nextDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return utcDayKey(d);
}

/** Language of the words, for line breaking, fonts and screen readers. */
function wordsLang(region: Region, uiLang: Lang): string {
  return region === 'world' ? uiLang : REGION_LANG[region];
}

/** Region label in the UI language: the name of the language its words are in ("Čeština", "English"…). */
function regionLabel(region: Region, uiLang: Lang, world: string): string {
  if (region === 'world') return world;
  const code = REGION_LANG[region].split('-')[0];
  try {
    const name = new Intl.DisplayNames([uiLang], { type: 'language' }).of(code);
    if (name) return name.charAt(0).toLocaleUpperCase(uiLang) + name.slice(1);
  } catch {}
  return code.toUpperCase();
}

const LIST_SEPARATOR: Record<string, string> = { ar: '، ', zh: '、', 'zh-Hans': '、', ja: '、' };

/* ── Tile text fitting ──
   Each tile starts at its CSS font size and shrinks in 0.5 px steps until the word fits on one line
   (nothing is ever clipped). If it still doesn't fit at 9 px, the word may split over two lines at
   a syllable (with a hyphen; CJK between characters) and the size is fitted again, down to 8 px. */
const MIN_FONT_WHOLE = 9;
const MIN_FONT_SPLIT = 8;

function fitTile(tile: HTMLElement) {
  const text = tile.firstElementChild as HTMLElement | null;
  if (!text) return;
  const style = getComputedStyle(tile);
  const room = () => tile.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const overflows = () => text.scrollWidth > text.clientWidth + 0.5 || text.offsetHeight > room() + 0.5;
  const shrink = (min: number) => {
    text.style.fontSize = '';
    let size = parseFloat(getComputedStyle(text).fontSize) || 15;
    while (overflows() && size > min) {
      size = Math.max(min, size - 0.5);
      text.style.fontSize = `${size}px`;
    }
  };
  tile.classList.remove('cf-split');
  shrink(MIN_FONT_WHOLE);
  if (!overflows()) return;
  tile.classList.add('cf-split');
  shrink(MIN_FONT_SPLIT);
}

/** Refits all tiles of a grid whenever the words change, the grid resizes or the web font loads. */
function useFitTiles(gridRef: React.RefObject<HTMLDivElement | null>, key: string) {
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const fitAll = () => grid.querySelectorAll<HTMLElement>('.cf-tile').forEach(fitTile);
    fitAll();
    let frame = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(fitAll); });
    ro.observe(grid);
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) fitAll(); }).catch(() => {});
    return () => { alive = false; ro.disconnect(); cancelAnimationFrame(frame); };
  }, [gridRef, key]);
}

/* Czech needs the accusative after "pro celé…" — the countries a set can belong to. */
const CS_WHOLE_COUNTRY: Record<string, string> = {
  cz: 'celé Česko', sk: 'celé Slovensko', de: 'celé Německo', at: 'celé Rakousko', ch: 'celé Švýcarsko',
  pl: 'celé Polsko', gb: 'celou Velkou Británii', us: 'celé USA', ie: 'celé Irsko', ca: 'celou Kanadu',
  au: 'celou Austrálii', nz: 'celý Nový Zéland', fr: 'celou Francii', be: 'celou Belgii', it: 'celou Itálii',
  es: 'celé Španělsko', mx: 'celé Mexiko', ar: 'celou Argentinu', pt: 'celé Portugalsko', br: 'celou Brazílii',
  ru: 'celé Rusko', cn: 'celou Čínu', jp: 'celé Japonsko', kr: 'celou Koreu', sa: 'celou Saúdskou Arábii',
  in: 'celou Indii',
};

/** "Same set for all of <country>" in the UI language. */
function sameSetLine(tr: { sameSet: string; sameSetWorld: string }, country: string | null, uiLang: Lang): string {
  if (!country) return tr.sameSetWorld;
  if (uiLang === 'cs' && CS_WHOLE_COUNTRY[country]) return `Stejná sada pro ${CS_WHOLE_COUNTRY[country]}`;
  let name = country.toUpperCase();
  try { name = new Intl.DisplayNames([uiLang], { type: 'region' }).of(name) ?? name; } catch {}
  return tr.sameSet.replace('{country}', name);
}

/* ═════════════════════════════ shell ═════════════════════════════ */

interface TimerControl { pause: () => void; resume: () => void }

/** Visitor's country for the Portuguese flag: from Vercel geolocation, else the browser language (pt-BR). */
const noSubscribe = () => () => {};
function useVisitorCountry(geoCountry: string | null): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => geoCountry ?? (/^pt-BR\b/i.test(navigator.language) ? 'BR' : null),
    () => geoCountry,
  );
}

export default function ConnectFour({ geoRegion, country }: { geoRegion: Region | null; country: string | null }) {
  const { t, lang } = useLang();
  const tr = t.connectFour;
  const isClient = useIsClient();
  const stored = useStoredRegion();
  const region: Region = stored ?? geoRegion ?? regionFromLang(lang);
  const [day, setDay] = useState(utcDayKey);
  const timerCtlRef = useRef<TimerControl | null>(null);
  const visitorCountry = useVisitorCountry(country);

  function chooseRegion(r: Region) {
    lsSet(REGION_KEY, r);
    window.dispatchEvent(new Event(STORE_EVENT));
  }

  // Many regions → a dropdown with SVG flags (one flag per option: the label is the language name only)
  const picker = (
    <FlagSelect
      id="cf-region-select" className="cf-region-btn" value={region} label={tr.region} flagSize={20}
      onChange={v => { if (isRegion(v)) chooseRegion(v); }}
      options={REGIONS.map(r => ({ value: r, flag: regionFlag(r, visitorCountry), label: regionLabel(r, lang, tr.regionWorld) }))}
    />
  );
  // Whose set it is: the visitor's own country when it plays this region, else the region's flag country
  const setCountry = region === 'world'
    ? null
    : (visitorCountry && regionFromCountry(visitorCountry) === region ? visitorCountry : regionFlag(region, visitorCountry)).toLowerCase();

  return (
    <GameShell
      gameId="connect-four"
      leaderboardId={dailyVariantLeaderboardId('connectfour', region, day)}
      onHide={() => timerCtlRef.current?.pause()}
      onShow={() => timerCtlRef.current?.resume()}
    >
      {isClient
        ? <ConnectFourGame key={`${region}-${day}`} region={region} picker={picker} setCountry={setCountry} shareFlag={regionFlagEmoji(region, visitorCountry)} day={day} onDayChange={setDay} timerCtlRef={timerCtlRef} />
        : <div className="cf-placeholder" />}
      <ConnectFourStyles />
    </GameShell>
  );
}

/* ═════════════════════════════ game ═════════════════════════════ */

type Mode = 'daily' | 'practice';

/** Tile id = group * 4 + word, so progress survives a UI language change (WORLD sets). */
interface Progress {
  setIndex: number;
  order: number[];
  solved: number[];
  mistakes: number;
  guessed: string[];
  /** Group of each picked tile, per guess (for the share grid). */
  history: number[][];
  started: boolean;
  over: boolean;
  win: boolean;
  /** Elapsed ms when saved, and the wall clock at that moment (the clock keeps running while away). */
  elapsed: number;
  savedAt: number;
}

function freshProgress(setIndex: number, seed: string | null): Progress {
  const ids = Array.from({ length: 16 }, (_, i) => i);
  return {
    setIndex,
    order: shuffled(ids, seed ? seededRandom(seed) : Math.random),
    solved: [], mistakes: 0, guessed: [], history: [],
    started: false, over: false, win: false, elapsed: 0, savedAt: 0,
  };
}

/** Elapsed time of a saved attempt; an unfinished one also counts the time spent away. */
function resumedElapsed(p: Progress): number {
  if (p.over || !p.started || !p.savedAt) return p.elapsed;
  return p.elapsed + Math.max(0, Date.now() - p.savedAt);
}

/** Stopwatch: accumulated ms + the running segment (performance.now, 0.1 ms precision).
    It paints straight into its <span> on every frame, so the board doesn't re-render 60× a second. */
function createTimer() {
  let acc = 0;
  let start: number | null = null;
  let frame = 0;
  let el: HTMLSpanElement | null = null;
  const elapsed = () => acc + (start == null ? 0 : performance.now() - start);
  const paint = () => {
    if (el) el.textContent = fmtLive(elapsed());
    if (start != null) frame = requestAnimationFrame(paint);
  };
  return {
    elapsed,
    attach(node: HTMLSpanElement | null) { el = node; if (el) el.textContent = fmtLive(elapsed()); },
    set(ms: number) { cancelAnimationFrame(frame); start = null; acc = ms; paint(); },
    run() { if (start != null) return; start = performance.now(); cancelAnimationFrame(frame); frame = requestAnimationFrame(paint); },
    stop() { if (start == null) return; acc += performance.now() - start; start = null; cancelAnimationFrame(frame); paint(); },
  };
}

interface GameProps {
  region: Region;
  /** Region flag emoji for the share text. */
  shareFlag: string;
  /** Region picker, shown above the board. */
  picker: React.ReactNode;
  /** Lower-case ISO code of the country the set is for (null = the whole world). */
  setCountry: string | null;
  day: string;
  onDayChange: (d: string) => void;
  timerCtlRef: React.RefObject<TimerControl | null>;
}

function ConnectFourGame({ region, picker, setCountry, shareFlag, day, onDayChange, timerCtlRef }: GameProps) {
  const { t, lang, rtl } = useLang();
  const tr = t.connectFour;
  const name = t.gamesHub.name_connectFour;
  const { onGameOver, openLeaderboard } = useGameShell();
  const dailyIndex = dailySetIndex(region, day);

  const [mode, setMode] = useState<Mode>('daily');
  const [p, setP] = useState<Progress>(() => {
    const saved = lsGet<Progress>(stateKey(region, day));
    return saved && saved.setIndex === dailyIndex && saved.order?.length === 16
      ? saved
      : freshProgress(dailyIndex, `${region}:${day}`);
  });
  const [sel, setSel] = useState<number[]>([]);
  const [shake, setShake] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const set = useMemo(() => getSet(region, p.setIndex, lang), [region, p.setIndex, lang]);
  const groupOf = (id: number) => Math.floor(id / 4);
  const wordOf = (id: number) => set.groups[groupOf(id)].words[id % 4];

  const gridRef = useRef<HTMLDivElement>(null);

  /* ── timer (see createTimer) ── */
  const [timer] = useState(createTimer);
  const attachTimer = useCallback((node: HTMLSpanElement | null) => timer.attach(node), [timer]);

  // Latest progress for save-on-leave
  const pRef = useRef(p);
  useEffect(() => { pRef.current = p; });
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; });

  const save = useCallback((next: Progress) => {
    if (modeRef.current !== 'daily') return;
    lsSet(stateKey(region, day), { ...next, elapsed: timer.elapsed(), savedAt: Date.now() } satisfies Progress);
  }, [region, day, timer]);

  // Resume a saved daily attempt: the time spent away counts too
  useEffect(() => {
    const cur = pRef.current;
    timer.set(resumedElapsed(cur));
    if (cur.started && !cur.over) timer.run();
    const onLeave = () => { if (!pRef.current.over && pRef.current.started) save(pRef.current); };
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
      pause: () => { timer.stop(); if (pRef.current.started && !pRef.current.over) save(pRef.current); },
      resume: () => { if (pRef.current.started && !pRef.current.over) timer.run(); },
    };
    return () => { timerCtlRef.current = null; };
  }, [timerCtlRef, timer, save]);

  // Midnight UTC → next day's set, but never in the middle of an attempt
  useEffect(() => {
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const today = utcDayKey(new Date(n));
      const cur = pRef.current;
      if (today !== day && (cur.over || !cur.started)) onDayChange(today);
    }, 1000);
    return () => clearInterval(id);
  }, [day, onDayChange]);

  const shakeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  function toggle(id: number) {
    if (p.over) return;
    getGameAudio(); // created inside the tap so sound is allowed
    if (!p.started) {
      const next = { ...p, started: true };
      setP(next);
      timer.run();
      save(next);
    }
    setMsg('');
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 4 ? [...s, id] : s);
  }

  function finish(next: Progress) {
    timer.stop();
    const timeMs = Math.max(0.1, Math.round(timer.elapsed() * 10) / 10);
    const final: Progress = { ...next, over: true, elapsed: timeMs };
    if (!next.win) {
      final.solved = [...next.solved, ...[0, 1, 2, 3].filter(g => !next.solved.includes(g))];
    }
    setP(final);
    setSel([]);
    if (mode !== 'daily') return;
    lsSet(stateKey(region, day), { ...final, savedAt: Date.now() });
    // The server re-checks the guesses (tile id = group × 4 + word)
    if (final.win) onGameOver({ timeMs, moves: final.history.length, proof: { guesses: final.guessed.map(k => k.split('-').map(Number)) } });
    else recordGameCompleted();
  }

  function submit() {
    if (sel.length !== 4 || p.over) return;
    const key = [...sel].sort((a, b) => a - b).join('-');
    if (p.guessed.includes(key)) { setMsg(tr.alreadyTried); return; }
    const groups = sel.map(groupOf);
    const counts = new Map<number, number>();
    groups.forEach(g => counts.set(g, (counts.get(g) ?? 0) + 1));
    const maxC = Math.max(...counts.values());
    const base: Progress = { ...p, guessed: [...p.guessed, key], history: [...p.history, groups] };

    if (maxC === 4) {
      const solved = [...p.solved, groups[0]];
      const next = { ...base, solved };
      setSel([]);
      tone(520 + solved.length * 110, 0.3);
      setMsg([tr.good1, tr.good2, tr.good3, tr.good4][solved.length - 1]);
      if (solved.length === 4) { finish({ ...next, win: true }); return; }
      setP(next);
      save(next);
      return;
    }

    const next = { ...base, mistakes: p.mistakes + 1 };
    tone(170, 0.3);
    setMsg(maxC === 3 ? tr.oneAway : tr.notGroup);
    setShake(sel);
    clearTimeout(shakeTimer.current);
    if (next.mistakes >= MAX_MISTAKES) {
      setP(next);
      shakeTimer.current = setTimeout(() => { setShake([]); finish(next); }, 450);
      return;
    }
    setP(next);
    save(next);
    shakeTimer.current = setTimeout(() => setShake([]), 380);
  }

  function shuffleTiles() {
    setP(cur => ({ ...cur, order: shuffled(cur.order) }));
  }

  function practice() {
    const n = setCount(region);
    let idx = Math.floor(Math.random() * n);
    if (n > 1 && idx === dailyIndex) idx = (idx + 1 + Math.floor(Math.random() * (n - 1))) % n;
    timer.set(0);
    modeRef.current = 'practice';
    setMode('practice');
    setP(freshProgress(idx, null));
    setSel([]); setMsg(''); setShareNote('');
  }

  function backToToday() {
    const saved = lsGet<Progress>(stateKey(region, day));
    const next = saved && saved.setIndex === dailyIndex ? saved : freshProgress(dailyIndex, `${region}:${day}`);
    timer.set(resumedElapsed(next));
    modeRef.current = 'daily';
    setMode('daily');
    setP(next);
    setSel([]); setMsg(''); setShareNote('');
    if (next.started && !next.over) timer.run();
  }

  // Enter = submit (when focus isn't in a form field or a dialog is open)
  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]') || document.querySelector('[role="dialog"]')) return;
      submitRef.current();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const finalTime = formatTimeMs(p.elapsed);
  const gridRows = p.history.map(row => row.map(g => SQUARES[g]).join(''));

  async function share() {
    const text = tr.shareText
      .replace('{name}', name)
      .replace('{date}', day)
      .replace('{flag}', shareFlag)
      .replace('{result}', p.win ? `⏱ ${finalTime}` : tr.unsolved)
      .replace('{mistakes}', tr.mistakes.replace('{n}', String(p.mistakes)).replace('{max}', String(MAX_MISTAKES)))
      .replace('{grid}', gridRows.join('\n'));
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

  const rest = p.order.filter(id => !p.solved.includes(groupOf(id)));
  const isPractice = mode === 'practice';
  const dateLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const msLeft = Math.max(0, Date.parse(`${nextDay(day)}T00:00:00Z`) - now);
  const countdown = [Math.floor(msLeft / 3.6e6), Math.floor(msLeft / 6e4) % 60, Math.floor(msLeft / 1000) % 60]
    .map(n => String(n).padStart(2, '0')).join(':');
  const wLang = wordsLang(region, lang);
  useFitTiles(gridRef, `${set.region}:${set.index}:${lang}:${rest.join(',')}`);

  const livesLeft = MAX_MISTAKES - p.mistakes;

  return (
    <div className="cf-app">
      <div className="cf-bar">
        <div className="cf-bar-pick">{picker}</div>
        <span className="cf-hearts" role="img" aria-label={`${tr.mistakesLeft} ${livesLeft}/${MAX_MISTAKES}`} title={tr.mistakesLeft}>
          {Array.from({ length: MAX_MISTAKES }, (_, k) => (
            <span key={k} aria-hidden="true" className={k < livesLeft ? 'on' : 'off'}>{k < livesLeft ? '💜' : '🤍'}</span>
          ))}
        </span>
        <div className="cf-timer tabular-nums" role="timer" aria-label={tr.timeAria}>
          <span ref={attachTimer} />
        </div>
      </div>

      <div className="cf-board" lang={wLang} dir={wLang === 'ar' ? 'rtl' : rtl ? 'rtl' : 'ltr'}>
        {p.solved.map(g => (
          <div key={g} className={`cf-band cf-g${g + 1}`}>
            <b>{set.groups[g].name}</b>
            <span>{set.groups[g].words.join(LIST_SEPARATOR[wLang] ?? ', ')}</span>
          </div>
        ))}
        {rest.length > 0 && (
          <div className="cf-grid" ref={gridRef}>
            {rest.map(id => {
              const w = wordOf(id);
              const on = sel.includes(id);
              return (
                <button
                  key={id} type="button"
                  className={`gx-tile cf-tile${on ? ' is-on' : ''}${shake.includes(id) ? ' shake' : ''}`}
                  aria-pressed={on} disabled={p.over} onClick={() => toggle(id)}
                >
                  <span className="cf-word">{w}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!p.over && (
        <>
          <div className="cf-msg" role="status">{msg}</div>
          <div className="cf-actions">
            <button type="button" className="gx-btn gx-ghost" onClick={shuffleTiles}>{tr.shuffle}</button>
            <button type="button" className="gx-btn gx-ghost" onClick={() => { setSel([]); setMsg(''); }} disabled={sel.length === 0}>{tr.deselect}</button>
            <button type="button" className="gx-btn gx-primary" onClick={submit} disabled={sel.length !== 4}>{tr.submit}</button>
          </div>
        </>
      )}

      {p.over && (
        <div className="cf-end">
          <h2>{p.win ? (p.mistakes === 0 ? tr.perfectTitle : tr.winTitle) : tr.loseTitle}</h2>
          {p.win
            ? <><div className="cf-time tabular-nums">{finalTime}</div><p>{tr.timeNote}</p></>
            : <p>{tr.loseText}</p>}
          <div className="cf-squares" role="img" aria-label={`${tr.gridAria}: ${gridRows.length}`}>
            {gridRows.map((r, i) => <div key={i}>{r}</div>)}
          </div>
          <div className="cf-end-actions">
            {!isPractice && (
              <>
                <button type="button" className="gx-btn gx-primary" onClick={share}>{tr.share}</button>
                <div className="cf-toast" aria-live="polite">{shareNote}</div>
                <button type="button" className="gx-btn gx-gold-btn" onClick={openLeaderboard}>{t.games.showLeaderboard}</button>
              </>
            )}
            <button type="button" className="gx-btn gx-ghost" onClick={practice}>{tr.practice}</button>
            {isPractice && <button type="button" className="gx-btn gx-ghost" onClick={backToToday}>{tr.backToToday}</button>}
          </div>
          {!isPractice && <div className="cf-next tabular-nums">{tr.nextIn.replace('{time}', countdown)}</div>}
        </div>
      )}

      <div className="cf-note" title={tr.note}>
        {isPractice && <span className="cf-badge">{tr.practiceBadge}</span>}
        <span className="cf-date">{dateLabel}</span>
        <span aria-hidden="true"> · </span>
        <span>{sameSetLine(tr, setCountry, lang)}</span>
      </div>
    </div>
  );
}

function ConnectFourStyles() {
  return (
    <style>{`
      .cf-placeholder { min-height: 520px; }
      .cf-app {
        --cf-ink: #F2F3FF; --cf-dim: #9AA0D0; --cf-line: #1E2350;
        --cf-g1: #FFC94D; --cf-g2: #2FE39A; --cf-g3: #4DA3FF; --cf-g4: #B9A8FF;
        display: flex; flex-direction: column; gap: 12px;
        color: var(--cf-ink); font-family: 'Poppins', system-ui, sans-serif;
        -webkit-tap-highlight-color: transparent;
      }

      /* one row: set picker · hearts · timer */
      .cf-bar { display: flex; align-items: center; gap: 8px; min-height: 48px; }
      .cf-bar-pick { flex: 0 1 auto; min-width: 0; display: flex; }
      .cf-region-btn.fsel-btn {
        min-height: 40px; padding: 0 10px; gap: 7px; border-radius: 999px; font: 700 13px 'Poppins', system-ui, sans-serif;
        background: linear-gradient(160deg, #1C2258, #121640); border: 1px solid rgba(255,255,255,0.1); color: var(--cf-ink);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
      }
      .cf-hearts { display: inline-flex; gap: 2px; font-size: 18px; line-height: 1; margin-inline: auto; flex-shrink: 0; }
      .cf-hearts .on { filter: drop-shadow(0 0 6px rgba(167,139,250,.75)); }
      .cf-hearts .off { opacity: .45; }
      .cf-timer {
        flex-shrink: 0; direction: ltr; font-weight: 800; font-size: 26px; line-height: 1; letter-spacing: .01em;
        color: #fff; text-shadow: 0 0 14px rgba(155,123,255,.9), 0 0 28px rgba(139,92,246,.55);
      }

      .cf-board { display: flex; flex-direction: column; gap: 8px; }
      .cf-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
      .cf-tile {
        font-weight: 800; font-size: 14px; line-height: 1.15;
        text-transform: uppercase; letter-spacing: .02em;
        height: 64px; min-width: 0; padding: 5px 4px;
        display: flex; align-items: center; justify-content: center; text-align: center;
        /* words never break inside; useFitTiles shrinks the font instead */
        overflow-wrap: normal; word-break: keep-all; hyphens: manual;
      }
      .cf-word { display: block; width: 100%; }
      .cf-tile.cf-split .cf-word { hyphens: auto; -webkit-hyphens: auto; word-break: normal; overflow-wrap: anywhere; }
      /* scripts without capitals or with joined letters: no letter spacing, more line height */
      .cf-board:lang(ar) .cf-tile, .cf-board:lang(hi) .cf-tile, .cf-board:lang(zh) .cf-tile,
      .cf-board:lang(ja) .cf-tile, .cf-board:lang(ko) .cf-tile { letter-spacing: 0; text-transform: none; }
      .cf-board:lang(ar) .cf-tile, .cf-board:lang(hi) .cf-tile { line-height: 1.4; }
      .cf-board:lang(ar) .cf-band b, .cf-board:lang(hi) .cf-band b,
      .cf-board:lang(zh) .cf-band b, .cf-board:lang(ja) .cf-band b, .cf-board:lang(ko) .cf-band b { letter-spacing: 0; }
      .cf-band span { overflow-wrap: anywhere; }
      .cf-tile.shake { animation: cfShake .35s; }
      @keyframes cfShake { 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }

      /* solved groups: glowing colour bars */
      .cf-band {
        --c: var(--cf-g1);
        border-radius: 14px; padding: 11px 12px; text-align: center; color: #0A0C1E;
        background: linear-gradient(160deg, color-mix(in srgb, var(--c) 82%, #fff), var(--c) 55%, color-mix(in srgb, var(--c) 78%, #000));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.55), 0 3px 0 color-mix(in srgb, var(--c) 55%, #000), 0 0 22px color-mix(in srgb, var(--c) 55%, transparent);
        animation: cfIn .35s ease-out;
      }
      .cf-band b { display: block; font-size: 14px; letter-spacing: .06em; text-transform: uppercase; }
      .cf-band span { font-size: 13px; font-weight: 600; text-transform: uppercase; }
      .cf-g1 { --c: var(--cf-g1); } .cf-g2 { --c: var(--cf-g2); }
      .cf-g3 { --c: var(--cf-g3); } .cf-g4 { --c: var(--cf-g4); }
      @keyframes cfIn { from { transform: scale(.9); opacity: .3; } to { transform: none; opacity: 1; } }

      .cf-msg { min-height: 20px; text-align: center; font-weight: 600; font-size: 14px; color: var(--cf-g1); }
      .cf-actions { display: flex; gap: 8px; }
      .cf-actions .gx-btn { flex: 1; min-width: 0; padding: 0 10px; }

      .cf-end {
        display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center;
        padding: 20px; border-radius: 18px; border: 1px solid rgba(255,255,255,.08);
        background: linear-gradient(160deg, #1C2258, #121640); box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
      }
      .cf-end h2 { margin: 0; font-size: 24px; font-weight: 800; text-wrap: balance; }
      .cf-time { font-size: 40px; font-weight: 800; color: #C4B5FD; line-height: 1; direction: ltr; text-shadow: 0 0 22px rgba(139,92,246,.7); }
      .cf-end p { margin: 0; color: var(--cf-dim); font-size: 14px; max-width: 36ch; }
      .cf-squares { font-size: 20px; line-height: 1.25; letter-spacing: 2px; }
      .cf-end-actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
      .cf-end-actions .gx-btn { width: 100%; }
      .cf-toast { font-size: 13px; color: var(--cf-g2); min-height: 18px; word-break: break-word; }
      .cf-next { font-size: 12px; color: var(--cf-dim); }

      .cf-note { font-size: 11px; color: var(--cf-dim); text-align: center; line-height: 1.5; }
      .cf-date { display: inline-block; }
      .cf-date::first-letter { text-transform: uppercase; }
      .cf-badge {
        display: inline-block; margin-inline-end: 6px; font-size: 11px; font-weight: 600; color: var(--cf-g1); padding: 1px 8px; border-radius: 999px;
        border: 1px solid rgba(255,201,77,.4); background: rgba(255,201,77,.1);
      }

      @media (max-width: 400px) {
        .cf-grid, .cf-board { gap: 6px; }
        .cf-tile { letter-spacing: 0; font-size: 12px; }
        .cf-timer { font-size: 22px; }
        .cf-hearts { font-size: 15px; gap: 1px; }
        .cf-region-btn.fsel-btn { padding: 0 8px; gap: 5px; max-width: 120px; }
      }
      @media (max-width: 480px) {
        .cf-actions .gx-btn { font-size: 13px; padding: 0 6px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cf-tile.shake, .cf-band { animation: none; }
      }
    `}</style>
  );
}
