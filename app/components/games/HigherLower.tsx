'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { getGameAudio } from '../../../lib/games/gameAudio';
import { useIsClient } from '../../../lib/games/useIsClient';
import { dailyLeaderboardId, utcDayKey } from '../../../lib/gamesCatalog';
import {
  ROUNDS, buildPairs, formatValue, itemName, type CategoryId, type HLPair,
} from '../../../lib/games/higherLowerData';
import GameShell, { useGameShell } from './GameShell';
import { HL_BEST_KEY, HL_DAYS_KEY, hlDoneKey } from '../../../lib/dailyTrio';

/* Higher or Lower — port of games-reference/higher-lower.
   10 pairs a day seeded with the UTC date (everyone gets the same set), animated reveal,
   progress bar, day streak, sharing with a 🟩🟥 grid and a practice mode with a random set.
   Only the first daily attempt goes to the (daily) leaderboard; practice never does. */

const REVEAL_MS = 700;
const NEXT_MS = 1100;
const SHARE_URL = 'https://www.everyday1234567.com/games/higher-lower';

/* ── localStorage helpers (keys from the demo, `vn-` = "vyšší nebo nižší") ── */
const STORE_EVENT = 'everyday-hl-change';
const BEST_KEY = HL_BEST_KEY;
const DAYS_KEY = HL_DAYS_KEY;
const doneKey = hlDoneKey;

interface DaysStreak { n: number; last: string | null }
interface DoneRecord { score: number; results: boolean[] }

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) as T; } catch { return fallback; }
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
/** Raw localStorage value that re-renders when this game writes (or another tab does). */
function useStoredRaw(key: string): string | null {
  return useSyncExternalStore(
    subscribeStore,
    () => { try { return localStorage.getItem(key); } catch { return null; } },
    () => null,
  );
}

function parseStored<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDayKey(d);
}
/** The streak still counts when the last finished day is today or yesterday. */
function currentStreak(s: DaysStreak, day: string): number {
  return s.last === day || s.last === previousDay(day) ? s.n : 0;
}

function tone(freq: number, dur: number) {
  const ac = getGameAudio();
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch {}
}

export default function HigherLower() {
  const [day, setDay] = useState(utcDayKey);
  const bestRaw = useStoredRaw(BEST_KEY);
  const best = useMemo(() => {
    const n = Number(parseStored<number>(bestRaw) ?? 0);
    return n > 0 ? { timeMs: 0, score: n } : null;
  }, [bestRaw]);
  const isClient = useIsClient();

  return (
    <GameShell gameId="higher-lower" leaderboardId={dailyLeaderboardId('higherlower', day)} best={best}>
      {/* The game state comes from localStorage, so it renders on the client only (key = new day → fresh state) */}
      {isClient ? <HigherLowerGame key={day} day={day} onDayChange={setDay} /> : <div className="hl-placeholder" />}
      <HigherLowerStyles />
    </GameShell>
  );
}

type Mode = 'daily' | 'practice';
type Phase = 'ask' | 'reveal' | 'end';

interface Round {
  mode: Mode;
  pairs: HLPair[];
  idx: number;
  results: boolean[];
  phase: Phase;
}

function freshRound(mode: Mode, seed: string): Round {
  return { mode, pairs: buildPairs(seed), idx: 0, results: [], phase: 'ask' };
}

function HigherLowerGame({ day, onDayChange }: { day: string; onDayChange: (d: string) => void }) {
  const { t, lang } = useLang();
  const tr = t.higherLower;
  const name = t.gamesHub.name_higherLower;
  const { onGameOver, startRound, openLeaderboard } = useGameShell();

  // Today's set, or the saved result when today's challenge is already done
  const [round, setRound] = useState<Round>(() => {
    const done = lsGet<DoneRecord | null>(doneKey(day), null);
    const r = freshRound('daily', day);
    return done ? { ...r, results: done.results, idx: ROUNDS, phase: 'end' } : r;
  });
  const [shown, setShown] = useState<number | null>(null);
  const [shareNote, setShareNote] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const streak = currentStreak(parseStored<DaysStreak>(useStoredRaw(DAYS_KEY)) ?? { n: 0, last: null }, day);
  const best = Number(parseStored<number>(useStoredRaw(BEST_KEY)) ?? 0);

  const score = round.results.filter(Boolean).length;
  const pair = round.pairs[Math.min(round.idx, ROUNDS - 1)];
  const lastOk = round.phase === 'reveal' && shown === pair.b.value ? round.results[round.idx] : undefined;

  const timers = useRef<{ raf: number; next?: ReturnType<typeof setTimeout> }>({ raf: 0 });
  useEffect(() => () => {
    cancelAnimationFrame(timers.current.raf);
    clearTimeout(timers.current.next);
  }, []);

  // A fresh set restarts the tie-break timer
  useEffect(() => { startRound(); }, [startRound]);

  // Clock for the "new pairs in" countdown; after midnight UTC it switches to the new set,
  // but never in the middle of a game
  const roundRef = useRef(round);
  useEffect(() => { roundRef.current = round; });
  useEffect(() => {
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const today = utcDayKey(new Date(n));
      const r = roundRef.current;
      const idle = r.phase === 'end' || (r.mode === 'daily' && r.idx === 0 && r.phase === 'ask');
      if (today !== day && idle) onDayChange(today);
    }, 1000);
    return () => clearInterval(id);
  }, [day, onDayChange]);

  function finish(final: Round) {
    if (final.mode !== 'daily') return;
    const s = final.results.filter(Boolean).length;
    lsSet(doneKey(day), { score: s, results: final.results } satisfies DoneRecord);
    if (s > best) lsSet(BEST_KEY, s);
    const prev = lsGet<DaysStreak>(DAYS_KEY, { n: 0, last: null });
    if (prev.last !== day) lsSet(DAYS_KEY, { n: prev.last === previousDay(day) ? prev.n + 1 : 1, last: day });
    // First daily attempt → leaderboard (the time since the round started breaks ties)
    if (s > 0) onGameOver({ score: s });
  }

  function guess(higher: boolean) {
    if (round.phase !== 'ask') return;
    getGameAudio(); // created inside the tap so sound is allowed
    const ok = higher === (pair.b.value > pair.a.value);
    const target = pair.b.value;
    const results = [...round.results];
    results[round.idx] = ok;
    setRound(r => ({ ...r, phase: 'reveal', results }));

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    const settle = () => {
      setShown(target);
      const s = results.filter(Boolean).length;
      if (ok) tone(660 + s * 40, 0.25); else tone(180, 0.35);
      timers.current.next = setTimeout(() => {
        setShown(null);
        const next = round.idx + 1;
        if (next < ROUNDS) { setRound(r => ({ ...r, idx: next, phase: 'ask' })); return; }
        const final: Round = { ...round, results, idx: next, phase: 'end' };
        setRound(final);
        finish(final);
      }, NEXT_MS);
    };
    if (reduced) { settle(); return; }
    const anim = (now: number) => {
      const k = Math.min(1, (now - t0) / REVEAL_MS);
      const e = 1 - Math.pow(1 - k, 3);
      if (k < 1) {
        setShown(target * e);
        timers.current.raf = requestAnimationFrame(anim);
      } else settle();
    };
    timers.current.raf = requestAnimationFrame(anim);
  }

  function practice() {
    setShareNote('');
    setShown(null);
    setRound(freshRound('practice', `${day}:${Math.random()}`));
  }
  function backToToday() {
    const done = lsGet<DoneRecord | null>(doneKey(day), null);
    setShareNote('');
    if (done) setRound({ ...freshRound('daily', day), results: done.results, idx: ROUNDS, phase: 'end' });
    else { setRound(freshRound('daily', day)); startRound(); }
  }

  // Keyboard: ↑ higher, ↓ lower
  const guessRef = useRef(guess);
  useEffect(() => { guessRef.current = guess; });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]') || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      guessRef.current(e.key === 'ArrowUp');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const grid = round.results.map(r => (r ? '🟩' : '🟥')).join('');

  async function share() {
    const text = tr.shareText
      .replace('{name}', name)
      .replace('{date}', day)
      .replace('{score}', String(score))
      .replace('{grid}', grid)
      .replace('{streak}', String(Math.max(1, streak)));
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

  const catLabel: Record<CategoryId, string> = {
    pop: tr.catPop, area: tr.catArea, mountain: tr.catMountain, river: tr.catRiver,
  };
  const unit: Record<CategoryId, string> = {
    pop: tr.unitPop, area: tr.unitArea, mountain: tr.unitMountain, river: tr.unitRiver,
  };

  const dateLabel = new Date(`${day}T12:00:00Z`).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const msLeft = Math.max(0, Date.parse(`${nextDay(day)}T00:00:00Z`) - now);
  const countdown = [Math.floor(msLeft / 3.6e6), Math.floor(msLeft / 6e4) % 60, Math.floor(msLeft / 1000) % 60]
    .map(n => String(n).padStart(2, '0')).join(':');

  const msg = score === ROUNDS ? tr.msgPerfect : score >= 7 ? tr.msgGreat : score >= 4 ? tr.msgOk : tr.msgBad;
  const isPractice = round.mode === 'practice';

  return (
    <div className="hl-app">
      <div className="hl-top">
        <span className="hl-date">{dateLabel}</span>
        {isPractice && <span className="hl-badge">{tr.practiceBadge}</span>}
      </div>

      <div className="hl-hud">
        <div className="hl-pill"><span>{tr.score}</span><b className="tabular-nums">{score}</b></div>
        <div className="hl-pill hl-streak"><span>{tr.streak}</span><b className="tabular-nums">🔥 {streak}</b></div>
        <div className="hl-pill"><span>{tr.best}</span><b className="tabular-nums">{best}</b></div>
      </div>

      <div className="hl-progress" aria-hidden="true">
        {Array.from({ length: ROUNDS }, (_, k) => (
          <i key={k} className={round.results[k] === true ? 'ok' : round.results[k] === false ? 'no' : k === round.idx ? 'now' : ''} />
        ))}
      </div>

      {round.phase !== 'end' ? (
        <>
          <div className="hl-cat">
            {tr.round.replace('{n}', String(round.idx + 1)).replace('{total}', String(ROUNDS))} · <strong>{catLabel[pair.cat]}</strong>
          </div>
          <div className="hl-arena">
            <div className="hl-card hl-card-a">
              <div className="hl-emoji" aria-hidden="true">{pair.a.emoji}</div>
              <div className="hl-name">{itemName(pair.a, lang)}</div>
              <div className="hl-val tabular-nums">{formatValue(pair.cat, pair.a.value, lang)}</div>
              <div className="hl-unit">{unit[pair.cat]}</div>
            </div>
            <div className={`hl-vs${lastOk === true ? ' ok' : lastOk === false ? ' no' : ''}`} aria-hidden="true">
              {lastOk === true ? '✓' : lastOk === false ? '✗' : 'VS'}
            </div>
            <div className={`hl-card hl-card-b${lastOk === true ? ' ok' : lastOk === false ? ' no' : ''}`}>
              <div className="hl-emoji" aria-hidden="true">{pair.b.emoji}</div>
              <div className="hl-name">{itemName(pair.b, lang)}</div>
              <div className="hl-val tabular-nums" aria-live="polite">
                {shown == null ? '?' : formatValue(pair.cat, shown, lang)}
              </div>
              <div className="hl-unit">
                {round.phase === 'ask'
                  ? tr.question.replace('{name}', itemName(pair.a, lang))
                  : <>{unit[pair.cat]}{lastOk !== undefined && <span className="hl-sr"> · {lastOk ? tr.correct : tr.wrong}</span>}</>}
              </div>
              <div className="hl-choices">
                <button type="button" className="hl-up" onClick={() => guess(true)} disabled={round.phase !== 'ask'}>{tr.higher}</button>
                <button type="button" className="hl-down" onClick={() => guess(false)} disabled={round.phase !== 'ask'}>{tr.lower}</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="hl-end">
          <h2>{isPractice ? tr.practiceTitle : tr.doneTitle}</h2>
          <div className="hl-big tabular-nums">{score}/{ROUNDS}</div>
          <div className="hl-grid" role="img" aria-label={`${tr.gridAria}: ${score}/${ROUNDS}`}>{grid}</div>
          <p>{msg}</p>
          <div className="hl-actions">
          {!isPractice && (
            <>
              <button type="button" className="hl-btn" onClick={share}>{tr.share}</button>
              <div className="hl-toast" aria-live="polite">{shareNote}</div>
              <button type="button" className="hl-btn hl-gold" onClick={openLeaderboard}>{t.games.showLeaderboard}</button>
            </>
          )}
          <button type="button" className="hl-btn hl-ghost" onClick={practice}>{tr.practice}</button>
          {isPractice && <button type="button" className="hl-btn hl-ghost" onClick={backToToday}>{tr.backToToday}</button>}
          </div>
          <div className="hl-next tabular-nums">{tr.nextIn.replace('{time}', countdown)}</div>
        </div>
      )}

      <div className="hl-note">{tr.note}</div>
    </div>
  );
}

/** The day after `day` (yyyy-mm-dd), i.e. when the next set starts at 00:00 UTC. */
function nextDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return utcDayKey(d);
}

function HigherLowerStyles() {
  return (
    <style>{`
      .hl-placeholder { min-height: 520px; }
      .hl-app {
        --hl-card: #0B0F2A; --hl-line: #1E2350; --hl-ink: #F2F3FF; --hl-dim: #9AA0D0;
        --hl-accent: #5D4CFF; --hl-accent2: #9B8CFF; --hl-good: #2FE39A; --hl-bad: #FF5470; --hl-gold: #FFC94D;
        max-width: 760px; margin: 0 auto;
        display: flex; flex-direction: column; gap: 12px;
        color: var(--hl-ink); font-family: 'Poppins', system-ui, sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
      .hl-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 22px; }
      .hl-date { font-size: 12px; color: var(--hl-dim); text-transform: capitalize; }
      .hl-badge {
        font-size: 11px; font-weight: 600; color: var(--hl-gold); padding: 3px 10px; border-radius: 999px;
        border: 1px solid rgba(255,201,77,.4); background: rgba(255,201,77,.1);
      }
      .hl-hud { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; }
      .hl-pill {
        background: var(--hl-card); border: 1px solid var(--hl-line); border-radius: 14px; padding: 10px 12px;
        display: flex; flex-direction: column; gap: 2px; min-width: 0;
      }
      .hl-pill span {
        font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--hl-dim);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .hl-pill b { font-size: 24px; font-weight: 800; line-height: 1.1; }
      .hl-streak b { color: var(--hl-gold); }
      .hl-progress { display: flex; gap: 4px; }
      .hl-progress i { flex: 1; height: 6px; border-radius: 3px; background: var(--hl-line); transition: background .3s; }
      .hl-progress i.ok { background: var(--hl-good); }
      .hl-progress i.no { background: var(--hl-bad); }
      .hl-progress i.now { background: var(--hl-accent); }
      .hl-cat { text-align: center; font-size: 14px; color: var(--hl-dim); }
      .hl-cat strong { color: var(--hl-ink); font-weight: 600; }

      .hl-arena { position: relative; display: flex; flex-direction: column; gap: 12px; }
      .hl-card {
        position: relative; flex: 1; min-height: 190px; border-radius: 22px; padding: 20px;
        display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 6px;
        background: linear-gradient(160deg, #121747, #0B0F2A); border: 1px solid var(--hl-line); overflow: hidden;
        transition: transform .35s, border-color .3s, box-shadow .3s;
      }
      .hl-emoji { font-size: 38px; line-height: 1; }
      .hl-name { font-size: clamp(22px, 6.5vw, 30px); font-weight: 800; line-height: 1.1; text-wrap: balance; overflow-wrap: anywhere; }
      .hl-val {
        font-size: clamp(28px, 8vw, 40px); font-weight: 800; color: var(--hl-accent2); line-height: 1.15;
        text-shadow: 0 0 24px rgba(93,76,255,.6);
      }
      .hl-unit { font-size: 13px; color: var(--hl-dim); text-wrap: balance; }
      .hl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      .hl-card.ok { border-color: var(--hl-good); box-shadow: 0 0 0 2px var(--hl-good), 0 0 40px rgba(47,227,154,.35); }
      .hl-card.no { border-color: var(--hl-bad); box-shadow: 0 0 0 2px var(--hl-bad), 0 0 40px rgba(255,84,112,.35); animation: hlShake .4s; }
      @keyframes hlShake { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
      .hl-choices { display: flex; gap: 10px; width: 100%; margin-top: 8px; }
      .hl-choices button {
        flex: 1; min-height: 52px; font: inherit; font-weight: 800; font-size: 17px; border-radius: 14px; padding: 12px 8px;
        cursor: pointer; border: 0; color: var(--hl-ink); transition: transform .1s, opacity .2s;
      }
      .hl-choices button:active:not(:disabled) { transform: scale(.96); }
      .hl-choices button:disabled { opacity: .45; cursor: default; }
      .hl-up { background: var(--hl-accent); box-shadow: 0 6px 24px rgba(93,76,255,.45); }
      .hl-choices .hl-down { background: transparent; border: 2px solid var(--hl-accent); color: var(--hl-accent2); }
      .hl-app button:focus-visible { outline: 3px solid var(--hl-ink); outline-offset: 3px; }
      /* In the flow between the cards, pulled onto the seam by negative margins */
      .hl-vs {
        position: relative; z-index: 2; align-self: center; flex-shrink: 0; margin: -34px 0;
        width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center;
        font-weight: 800; font-size: 16px; background: #02040E; border: 2px solid var(--hl-accent);
        box-shadow: 0 0 22px rgba(93,76,255,.7);
      }
      .hl-vs.ok { border-color: var(--hl-good); color: var(--hl-good); }
      .hl-vs.no { border-color: var(--hl-bad); color: var(--hl-bad); }

      .hl-end {
        display: flex; flex-direction: column; gap: 14px; align-items: center; text-align: center;
        padding: 24px 18px; border-radius: 22px; background: var(--hl-card); border: 1px solid var(--hl-line);
        max-width: 480px; width: 100%; margin: 0 auto; box-sizing: border-box;
      }
      .hl-end h2 { margin: 0; font-size: 26px; font-weight: 800; text-wrap: balance; }
      .hl-big { font-size: 64px; font-weight: 800; line-height: 1; color: var(--hl-accent2); text-shadow: 0 0 30px rgba(93,76,255,.6); }
      .hl-grid { font-size: 22px; letter-spacing: 2px; white-space: nowrap; }
      .hl-actions { display: flex; flex-direction: column; align-items: center; gap: 14px; width: 100%; }
      .hl-end p { margin: 0; color: var(--hl-dim); font-size: 14px; max-width: 34ch; }
      .hl-btn {
        font: inherit; font-weight: 800; font-size: 16px; border: 0; border-radius: 14px; padding: 14px 22px;
        cursor: pointer; background: var(--hl-accent); color: var(--hl-ink); width: 100%;
      }
      .hl-btn.hl-gold { background: rgba(255,179,0,.12); border: 1px solid rgba(255,179,0,.35); color: #FFB300; }
      .hl-btn.hl-ghost { background: transparent; border: 2px solid var(--hl-line); }
      .hl-toast { font-size: 13px; color: var(--hl-good); min-height: 18px; max-width: 34ch; word-break: break-word; }
      .hl-next { font-size: 12px; color: var(--hl-dim); }
      .hl-note { font-size: 11px; color: var(--hl-dim); text-align: center; }

      /* Tablet / PC: cards side by side, VS badge on the seam */
      @media (max-width: 719px) {
        .hl-card-a { padding-bottom: 30px; }
        .hl-card-b { padding-top: 30px; }
      }
      @media (min-width: 720px) {
        .hl-arena { flex-direction: row; align-items: stretch; gap: 20px; }
        .hl-vs { margin: 0 -38px; }
        .hl-card { min-height: 300px; padding: 28px 24px; }
        .hl-name { font-size: 30px; }
        .hl-val { font-size: 40px; }
      }
      @media (max-width: 480px) {
        .hl-hud { gap: 6px; }
        .hl-pill { padding: 8px 10px; }
        .hl-pill b { font-size: 20px; }
        .hl-card { min-height: 160px; padding-left: 16px; padding-right: 16px; }
        .hl-grid { font-size: 18px; letter-spacing: 1px; }
        /* keep the lower button clear of the floating boss-key buttons */
        .hl-choices, .hl-actions { padding-right: 30px; box-sizing: border-box; }
        [dir="rtl"] .hl-choices, [dir="rtl"] .hl-actions { padding-right: 0; padding-left: 30px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .hl-card, .hl-card.no { animation: none; transition: none; }
      }
    `}</style>
  );
}
