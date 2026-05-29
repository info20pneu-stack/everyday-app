'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../../lib/LanguageContext';

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */

type HBGameId =
  | 'hb_reaction' | 'hb_numbermem' | 'hb_visualmem'
  | 'hb_verbalmem' | 'hb_seqmem' | 'hb_aimtrainer' | 'hb_mentalmath';

type TestId = 'reaction' | 'numbermem' | 'visualmem' | 'verbalmem' | 'seqmem' | 'aimtrainer' | 'mentalmath';

interface TestResult { gameId: HBGameId; timeMs: number; score?: number; }

interface LBEntry {
  id: string; game: HBGameId; name: string; country: string; city: string;
  timeMs: number; score?: number; date: number;
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

const GAME_ID: Record<TestId, HBGameId> = {
  reaction: 'hb_reaction', numbermem: 'hb_numbermem', visualmem: 'hb_visualmem',
  verbalmem: 'hb_verbalmem', seqmem: 'hb_seqmem', aimtrainer: 'hb_aimtrainer', mentalmath: 'hb_mentalmath',
};

const TEST_META: Record<TestId, { icon: string; color: string; glow: string; desc: string; bestKey: string; unit: string; lowerBetter?: boolean }> = {
  reaction:   { icon: '⚡', color: '#4ade80', glow: 'rgba(74,222,128,0.4)',   desc: 'Click when the green circle appears', bestKey: 'hb_best_reaction',   unit: 'ms',  lowerBetter: true  },
  numbermem:  { icon: '🔢', color: '#60a5fa', glow: 'rgba(96,165,250,0.4)',   desc: 'Remember increasingly long numbers',  bestKey: 'hb_best_numbermem',  unit: 'digits' },
  visualmem:  { icon: '👁',  color: '#a78bfa', glow: 'rgba(167,139,250,0.4)', desc: 'Remember the lit squares',            bestKey: 'hb_best_visualmem',  unit: 'level'  },
  verbalmem:  { icon: '📖', color: '#f472b6', glow: 'rgba(244,114,182,0.4)', desc: 'Seen this word before?',              bestKey: 'hb_best_verbalmem',  unit: 'words'  },
  seqmem:     { icon: '🎵', color: '#fb923c', glow: 'rgba(251,146,60,0.4)',  desc: 'Repeat the flashing sequence',        bestKey: 'hb_best_seqmem',     unit: 'length' },
  aimtrainer: { icon: '🎯', color: '#f87171', glow: 'rgba(248,113,113,0.4)', desc: 'Click 30 targets as fast as you can', bestKey: 'hb_best_aimtrainer', unit: 'ms',  lowerBetter: true  },
  mentalmath: { icon: '🧮', color: '#fbbf24', glow: 'rgba(251,191,36,0.4)',  desc: 'Solve arithmetic in 60 seconds',      bestKey: 'hb_best_mentalmath', unit: 'correct' },
};

const VERBAL_WORDS = [
  'apple','bridge','castle','dragon','eagle','forest','garden','harbor','island','jungle',
  'knight','lemon','mountain','needle','ocean','palace','queen','river','shadow','tiger',
  'umbrella','valley','window','yellow','zebra','anchor','bronze','copper','dagger','ember',
  'falcon','glacier','hammer','ivory','jasper','kingdom','lantern','marble','nectar','orbit',
  'phoenix','quartz','raven','silver','throne','violet','walnut','zephyr','alpha','beacon',
  'citrus','delta','epoch','flint','gravel','haven','inlet','jewel','kelp','lava',
  'maple','nova','opal','prism','quill','ridge','stone','titan','vapor','wheat',
  'azure','blaze','cedar','dusk','echo','frost','gust','haze','iris','jade',
  'lake','mist','noon','pine','rain','snow','thorn','vine','wave','axis',
  'bold','calm','dawn','edge','foam','glow','halo','iron','jolt','keen',
];

const WORLD_COUNTRIES = [
  'AF','AL','DZ','AR','AM','AU','AT','AZ','BH','BD','BY','BE','BO','BA','BR','BG','KH','CA',
  'CL','CN','CO','HR','CZ','DK','EC','EG','EE','ET','FI','FR','GE','DE','GH','GR','HU','IN',
  'ID','IE','IL','IT','JP','KZ','KE','KW','LV','LT','LU','MY','MX','MA','NL','NZ','NG','NO',
  'OM','PK','PE','PH','PL','PT','QA','RO','RU','SA','RS','SG','SK','ZA','KR','ES','LK','SE',
  'CH','TW','TH','TR','UA','AE','GB','US','VN',
].sort();

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

function hbGet<T>(key: string, fb: T): T {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fb; } catch { return fb; }
}
function hbSet(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function flagEmoji(code: string) {
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}
function countryName(code: string, lang: string) {
  try { return new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(code) ?? code; } catch { return code; }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.1) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
    o.onended = () => ctx.close();
  } catch {}
}

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

/* ══════════════════════════════════════════════════════════════
   PARTICLES
══════════════════════════════════════════════════════════════ */

function Burst({ color }: { color: string }) {
  const pts = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * 2 * Math.PI;
    const r = 50 + (i % 3) * 18;
    return { tx: Math.cos(a) * r, ty: Math.sin(a) * r, size: i % 2 === 0 ? 7 : 4, delay: (i % 5) * 50 };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2,
          borderRadius: '50%', background: color,
          animation: `hbBurst 0.6s ease-out ${p.delay}ms both`,
          ['--tx' as string]: `${p.tx}px`, ['--ty' as string]: `${p.ty}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LEADERBOARD SUBMIT + VIEW
══════════════════════════════════════════════════════════════ */

type SubmitPhase = 'idle' | 'form' | 'submitting' | 'done';

function HBLeaderboard({ gameId, color, lowerBetter, scoreLabel }: {
  gameId: HBGameId; color: string; lowerBetter?: boolean; scoreLabel: string;
}) {
  const { lang } = useLang();
  const [entries, setEntries] = useState<LBEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?game=${gameId}&period=all`)
      .then(r => r.json() as Promise<{ entries: LBEntry[] }>)
      .then(d => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gameId]);

  function fmtVal(e: LBEntry) {
    if (lowerBetter) return `${e.timeMs}ms`;
    if (e.score !== undefined) return String(e.score);
    return `${e.timeMs}ms`;
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
        🌍 Global Top {entries.length > 0 ? `— ${entries.length} players` : ''}
      </div>
      {loading ? (
        <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '12px' }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '12px' }}>No records yet. Be the first!</div>
      ) : (
        <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {entries.slice(0, 50).map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
              borderRadius: '7px', background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ fontSize: '12px', width: '22px', textAlign: 'right', flexShrink: 0, color: 'var(--text3)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
              {e.country && <span style={{ fontSize: '13px', flexShrink: 0 }} title={e.city || e.country}>{flagEmoji(e.country)}</span>}
              <span style={{ fontSize: '12px', fontWeight: '700', color, flexShrink: 0, fontFamily: 'monospace' }}>{fmtVal(e)}</span>
            </div>
          ))}
        </div>
      )}
      {/* suppress unused warning */ void scoreLabel}
    </div>
  );
}

function HBSubmit({ result, color, lowerBetter, onDismiss }: {
  result: TestResult; color: string; lowerBetter?: boolean; onDismiss: () => void;
}) {
  const { lang } = useLang();
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [nick, setNick] = useState(() => hbGet('lb_nick', ''));
  const [country, setCountry] = useState(() => hbGet('lb_country', ''));
  const [city, setCity] = useState(() => hbGet('lb_city', ''));
  const [rank, setRank] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [showLB, setShowLB] = useState(false);

  const inputSt: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '8px', color: '#fff', fontSize: '13px', padding: '9px 11px', outline: 'none', boxSizing: 'border-box',
  };

  async function submit() {
    if (!nick.trim() || phase === 'submitting') return;
    setPhase('submitting'); setErr('');
    try {
      hbSet('lb_nick', nick.trim()); hbSet('lb_country', country); hbSet('lb_city', city.trim());
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: result.gameId, name: nick.trim(), country, city: city.trim(), timeMs: result.timeMs, score: result.score }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (res.status === 201 || data.notBetter || data.notInTop) {
        setRank((data.rank as number) ?? null);
        setPhase('done');
        tone(880, 0.2, 'sine', 0.1);
      } else {
        setErr((data.error as string) || 'Submission failed'); setPhase('form');
      }
    } catch { setErr('Connection error'); setPhase('form'); }
  }

  if (phase === 'done') {
    return (
      <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>Added to leaderboard!</div>
          {rank && <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '3px' }}>You are <span style={{ color: '#FFB300', fontWeight: '700' }}>#{rank}</span> globally</div>}
        </div>
        <button onClick={() => setShowLB(s => !s)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: showLB ? `${color}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${showLB ? color : 'rgba(255,255,255,0.1)'}`, color: showLB ? color : 'var(--text2)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          {showLB ? '▲ Hide' : '📊 View leaderboard'}
        </button>
        {showLB && <HBLeaderboard gameId={result.gameId} color={color} lowerBetter={lowerBetter} scoreLabel="" />}
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={() => setPhase('form')} style={{
          flex: 2, minWidth: '120px', padding: '10px', borderRadius: '9px', border: 'none',
          background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000',
          fontSize: '13px', fontWeight: '700', cursor: 'pointer',
          boxShadow: `0 0 16px ${color}55`,
        }}>🏅 Submit to leaderboard</button>
        <button onClick={() => { setShowLB(s => !s); }} style={{
          flex: 1, padding: '10px', borderRadius: '9px', border: `1px solid rgba(255,255,255,0.12)`,
          background: 'rgba(255,255,255,0.05)', color: 'var(--text2)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        }}>📊 Scores</button>
        <button onClick={onDismiss} style={{
          flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer',
        }}>✕</button>
        {showLB && <div style={{ width: '100%' }}><HBLeaderboard gameId={result.gameId} color={color} lowerBetter={lowerBetter} scoreLabel="" /></div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
        <input type="text" placeholder="Nickname" value={nick} maxLength={30} onChange={e => setNick(e.target.value.slice(0, 30))} style={inputSt} />
        <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
          <option value="">🌍 Select country…</option>
          {WORLD_COUNTRIES.map(c => <option key={c} value={c}>{flagEmoji(c)} {countryName(c, lang)}</option>)}
        </select>
        <input type="text" placeholder="City (optional)" value={city} maxLength={60} onChange={e => setCity(e.target.value.slice(0, 60))} style={inputSt} />
      </div>
      {err && <div style={{ fontSize: '11px', color: '#EF4444', marginBottom: '6px', textAlign: 'center' }}>{err}</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={submit} disabled={!nick.trim() || phase === 'submitting'} style={{
          flex: 2, padding: '10px', borderRadius: '8px', border: 'none',
          background: nick.trim() ? `linear-gradient(135deg,${color},${color}bb)` : 'rgba(255,255,255,0.1)',
          color: nick.trim() ? '#000' : 'var(--text3)', fontSize: '13px', fontWeight: '700', cursor: nick.trim() ? 'pointer' : 'not-allowed',
        }}>{phase === 'submitting' ? '…' : 'Save score'}</button>
        <button onClick={() => setPhase('idle')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   RESULT WRAPPER — shared result display + submit
══════════════════════════════════════════════════════════════ */

function ResultScreen({ result, meta, onRetry, onBack }: {
  result: TestResult;
  meta: typeof TEST_META[TestId];
  onRetry: () => void;
  onBack: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const bestKey = meta.bestKey;
  const oldBest = hbGet<number | null>(bestKey, null);

  let displayVal: string;
  let isNew = false;

  if (meta.lowerBetter) {
    displayVal = `${result.timeMs}ms`;
    isNew = oldBest === null || result.timeMs < oldBest;
    if (isNew) hbSet(bestKey, result.timeMs);
  } else {
    const sc = result.score ?? 0;
    displayVal = String(sc);
    isNew = oldBest === null || sc > oldBest;
    if (isNew) hbSet(bestKey, sc);
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
        {isNew && <Burst color={meta.color} />}
        <div style={{ fontFamily: 'Poppins', fontSize: '72px', fontWeight: '900', color: meta.color, lineHeight: 1, textShadow: `0 0 40px ${meta.glow}` }}>
          {displayVal}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{meta.unit}</div>
      </div>

      {isNew && (
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFB300', marginBottom: '8px', animation: 'hbSlideUp 0.4s cubic-bezier(.34,1.56,.64,1) both' }}>
          🏆 Personal best!
        </div>
      )}
      {!isNew && oldBest !== null && (
        <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
          Best: {meta.lowerBetter ? `${oldBest}ms` : String(oldBest)}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '4px' }}>
        <button onClick={onRetry} style={{ padding: '10px 22px', borderRadius: '9px', border: 'none', background: `linear-gradient(135deg,${meta.color},${meta.color}bb)`, color: '#000', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 0 16px ${meta.glow}` }}>
          ↺ Try again
        </button>
        <button onClick={onBack} style={{ padding: '10px 18px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer' }}>
          ← Menu
        </button>
      </div>

      {!submitted && (
        <HBSubmit result={result} color={meta.color} lowerBetter={meta.lowerBetter} onDismiss={() => setSubmitted(true)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   1. REACTION TIME
══════════════════════════════════════════════════════════════ */

type RTState = 'idle' | 'waiting' | 'ready' | 'result' | 'done';
const RT_ROUNDS = 5;

function ReactionTimeTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [state, setState] = useState<RTState>('idle');
  const [round, setRound] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const [false_, setFalse] = useState(false);
  const waitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(0);

  useEffect(() => () => clearTimeout(waitRef.current!), []);

  function startWait() {
    setState('waiting'); setFalse(false); setLast(null);
    const d = 1000 + Math.random() * 3500;
    waitRef.current = setTimeout(() => { setState('ready'); readyRef.current = performance.now(); }, d);
  }

  function handleClick() {
    if (state === 'idle') { setRound(1); setResults([]); startWait(); return; }
    if (state === 'waiting') {
      clearTimeout(waitRef.current!);
      setFalse(true); setLast(400);
      tone(220, 0.2, 'sawtooth', 0.08);
      const nr = [...results, 400];
      setResults(nr); setState('result');
      if (nr.length >= RT_ROUNDS) { setTimeout(() => onDone({ gameId: 'hb_reaction', timeMs: Math.round(nr.reduce((a, b) => a + b) / nr.length) }), 500); }
      return;
    }
    if (state === 'ready') {
      const ms = Math.round(performance.now() - readyRef.current);
      setLast(ms); setFalse(false);
      tone(ms < 200 ? 1046 : 659, 0.12, 'sine', 0.1);
      const nr = [...results, ms];
      setResults(nr); setState('result');
      if (nr.length >= RT_ROUNDS) { setTimeout(() => onDone({ gameId: 'hb_reaction', timeMs: Math.round(nr.reduce((a, b) => a + b) / nr.length) }), 500); }
    }
  }

  const color = TEST_META.reaction.color;
  const avg = results.length ? Math.round(results.reduce((a, b) => a + b) / results.length) : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {Array.from({ length: RT_ROUNDS }, (_, i) => (
          <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', background: i < results.length ? color : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div
        onClick={handleClick}
        style={{
          height: '220px', borderRadius: '16px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', cursor: state === 'result' && results.length < RT_ROUNDS ? 'default' : 'pointer',
          background: state === 'ready' ? `${color}22` : state === 'waiting' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          border: state === 'ready' ? `2px solid ${color}` : state === 'waiting' ? '2px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: state === 'ready' ? `0 0 40px ${color}44` : 'none',
          transition: 'all 0.12s', userSelect: 'none',
        }}
      >
        {state === 'idle' && <><div style={{ fontSize: '40px', marginBottom: '8px' }}>⚡</div><div style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: '700', color: '#fff' }}>Tap to start</div></>}
        {state === 'waiting' && <><div style={{ fontSize: '36px', animation: 'hbPulse 1.2s infinite' }}>🔴</div><div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px' }}>Wait for green…</div></>}
        {state === 'ready' && (
          <>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: color, boxShadow: `0 0 50px ${color}`, animation: 'hbPop 0.12s cubic-bezier(.34,1.56,.64,1)' }} />
            <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '800', color: '#fff', marginTop: '12px' }}>CLICK!</div>
          </>
        )}
        {state === 'result' && last !== null && (
          <div style={{ textAlign: 'center' }}>
            {false_ ? (
              <><div style={{ fontSize: '28px' }}>⚠️</div><div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '800', color: '#EF4444' }}>Too early!</div><div style={{ fontSize: '12px', color: 'var(--text3)' }}>+400ms penalty</div></>
            ) : (
              <><div style={{ fontFamily: 'Poppins', fontSize: '56px', fontWeight: '900', color: last < 200 ? '#4ade80' : last < 350 ? '#FFB300' : '#EF4444', lineHeight: 1 }}>{last}ms</div><div style={{ fontSize: '12px', color: 'var(--text3)' }}>{last < 150 ? '⚡ Lightning!' : last < 250 ? '🎯 Great!' : last < 400 ? '👍 Good' : '🐌 Slow'}</div></>
            )}
          </div>
        )}
      </div>

      {state === 'result' && results.length < RT_ROUNDS && (
        <button onClick={() => { setRound(r => r + 1); startWait(); }} style={{ width: '100%', marginTop: '10px', padding: '11px', borderRadius: '9px', border: 'none', background: `rgba(74,222,128,0.15)`, border2: `1px solid rgba(74,222,128,0.3)`, color: '#4ade80', fontSize: '14px', fontWeight: '700', cursor: 'pointer' } as React.CSSProperties}>
          Next round ({round}/{RT_ROUNDS}) →
        </button>
      )}

      <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
        {results.map((ms, i) => <span key={i} style={{ fontFamily: 'monospace', fontSize: '11px', color: ms <= 400 && false_ ? '#EF4444' : ms < 250 ? '#4ade80' : ms < 400 ? '#FFB300' : 'var(--text3)', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', padding: '2px 7px' }}>{ms}ms</span>)}
        {avg !== null && results.length > 1 && <span style={{ fontFamily: 'monospace', fontSize: '11px', color: color, fontWeight: '700', background: `${color}22`, borderRadius: '5px', padding: '2px 7px' }}>avg {avg}ms</span>}
      </div>

      <button onClick={onBack} style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. NUMBER MEMORY
══════════════════════════════════════════════════════════════ */

type NMState = 'idle' | 'showing' | 'input' | 'correct' | 'wrong' | 'done';

function NumberMemoryTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [state, setState] = useState<NMState>('idle');
  const [level, setLevel] = useState(3);
  const [number, setNumber] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalMs = useRef(Date.now());

  useEffect(() => () => clearInterval(timerRef.current!), []);

  function genNumber(digits: number) {
    let n = '';
    for (let i = 0; i < digits; i++) n += i === 0 ? String(Math.floor(Math.random() * 9) + 1) : String(Math.floor(Math.random() * 10));
    return n;
  }

  function startLevel(lv: number) {
    clearInterval(timerRef.current!);
    const n = genNumber(lv);
    setNumber(n); setInput(''); setState('showing');
    const showSecs = Math.ceil(lv * 0.7 + 1.5);
    setTimeLeft(showSecs * 10);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setState('input'); return 0; }
        return t - 1;
      });
    }, 100);
  }

  function checkInput() {
    if (input === number) {
      tone(880, 0.12, 'sine', 0.1);
      const nl = level + 1;
      setMaxLevel(nl - 1); setState('correct');
      setTimeout(() => { setLevel(nl); startLevel(nl); }, 1000);
    } else {
      tone(220, 0.25, 'sawtooth', 0.08);
      setMaxLevel(level - 1); setState('wrong');
      setTimeout(() => onDone({ gameId: 'hb_numbermem', timeMs: Date.now() - totalMs.current, score: level - 1 }), 800);
    }
  }

  const showPct = (timeLeft / Math.ceil((level * 0.7 + 1.5) * 10)) * 100;
  const color = TEST_META.numbermem.color;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
        <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color }}>{level} digits</div>
        {maxLevel > 0 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Best this round: {maxLevel}</div>}
      </div>

      {state === 'idle' && (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>🔢</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Number Memory</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>Memorize the number, then type it back</div>
          <button onClick={() => { totalMs.current = Date.now(); startLevel(3); setLevel(3); }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 0 20px ${color}55` }}>Start</button>
        </div>
      )}

      {state === 'showing' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '14px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${showPct}%`, background: color, borderRadius: '3px', transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ fontFamily: 'Poppins', fontSize: `${Math.max(28, 52 - level * 2)}px`, fontWeight: '900', color: '#fff', letterSpacing: '6px', padding: '30px 10px', background: `${color}11`, borderRadius: '14px', border: `1px solid ${color}33`, textShadow: `0 0 30px ${color}88` }}>
            {number}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>Memorize!</div>
        </div>
      )}

      {state === 'input' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>What was the number?</div>
          <input
            autoFocus type="text" inputMode="numeric" value={input}
            onChange={e => setInput(e.target.value.replace(/\D/g, '').slice(0, level + 2))}
            onKeyDown={e => e.key === 'Enter' && input.length > 0 && checkInput()}
            placeholder={'0'.repeat(level)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}55`, borderRadius: '10px', color: '#fff', fontSize: `${Math.max(20, 36 - level * 1.5)}px`, fontFamily: 'Poppins', fontWeight: '700', letterSpacing: '4px', padding: '16px 12px', textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
          />
          <button onClick={checkInput} disabled={input.length === 0} style={{ width: '100%', padding: '12px', borderRadius: '9px', border: 'none', background: input.length > 0 ? `linear-gradient(135deg,${color},${color}bb)` : 'rgba(255,255,255,0.1)', color: input.length > 0 ? '#000' : 'var(--text3)', fontSize: '14px', fontWeight: '700', cursor: input.length > 0 ? 'pointer' : 'not-allowed' }}>Submit</button>
        </div>
      )}

      {state === 'correct' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '40px' }}>✅</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '700', color: '#4ade80', marginTop: '6px' }}>Correct! Next level…</div>
        </div>
      )}

      {state === 'wrong' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '40px' }}>❌</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: '#EF4444', marginTop: '6px' }}>The number was: <span style={{ color: '#fff' }}>{number}</span></div>
          <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>You entered: {input}</div>
        </div>
      )}

      <button onClick={onBack} style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. VISUAL MEMORY
══════════════════════════════════════════════════════════════ */

type VMState = 'idle' | 'showing' | 'recall' | 'correct' | 'wrong' | 'done';

function VisualMemoryTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [state, setState] = useState<VMState>('idle');
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [grid, setGrid] = useState<boolean[]>(Array(16).fill(false));
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [maxLevel, setMaxLevel] = useState(0);
  const startMs = useRef(Date.now());
  const color = TEST_META.visualmem.color;

  const COLS = 4; const CELLS = 16;

  function startLevel(lv: number, lv_lives: number) {
    const count = Math.min(lv + 2, CELLS);
    const indices = shuffle(Array.from({ length: CELLS }, (_, i) => i)).slice(0, count);
    const tgt = new Set(indices);
    const g = Array(CELLS).fill(false).map((_, i) => tgt.has(i));
    setGrid(g); setTarget(tgt); setSelected(new Set()); setWrong(new Set());
    setState('showing');
    setTimeout(() => setState('recall'), 1500 + lv * 100);
  }

  function handleCell(i: number) {
    if (state !== 'recall') return;
    if (selected.has(i) || wrong.has(i)) return;
    const ns = new Set(selected); ns.add(i);
    if (!target.has(i)) {
      tone(220, 0.2, 'sawtooth', 0.07);
      const nw = new Set(wrong); nw.add(i); setWrong(nw);
      const nl = lives - 1; setLives(nl);
      if (nl <= 0) {
        setState('done');
        setTimeout(() => onDone({ gameId: 'hb_visualmem', timeMs: Date.now() - startMs.current, score: maxLevel }), 600);
      }
    } else {
      tone(660, 0.08, 'sine', 0.08);
      setSelected(ns);
      if (ns.size === target.size) {
        const nl = level + 1; setMaxLevel(nl - 1); setState('correct');
        setTimeout(() => { setLevel(nl); startLevel(nl, lives); }, 900);
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color }}>Level {level}</div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: 3 }, (_, i) => <span key={i} style={{ fontSize: '14px', opacity: i < lives ? 1 : 0.2 }}>❤️</span>)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{target.size || 0} squares</div>
      </div>

      {state === 'idle' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>👁</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>Memorize the blue squares, then click them</div>
          <button onClick={() => { startMs.current = Date.now(); startLevel(1, 3); }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 0 20px ${color}55` }}>Start</button>
        </div>
      )}

      {(state === 'showing' || state === 'recall' || state === 'correct' || state === 'wrong') && (
        <div>
          {state === 'showing' && <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>Memorize!</div>}
          {state === 'recall' && <div style={{ fontSize: '11px', color: color, textAlign: 'center', marginBottom: '8px', fontWeight: '700' }}>Click the lit squares</div>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px', maxWidth: '280px', margin: '0 auto' }}>
            {Array.from({ length: CELLS }, (_, i) => {
              const isTarget = grid[i];
              const isSel = selected.has(i);
              const isWrong = wrong.has(i);
              const showInPhase = state === 'showing' || state === 'correct';
              return (
                <div key={i} onClick={() => handleCell(i)} style={{
                  height: '58px', borderRadius: '8px', cursor: state === 'recall' && !isSel && !isWrong ? 'pointer' : 'default',
                  background: showInPhase && isTarget
                    ? `linear-gradient(135deg,${color},${color}aa)`
                    : isSel ? 'rgba(74,222,128,0.25)' : isWrong ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)',
                  border: showInPhase && isTarget
                    ? `1px solid ${color}` : isSel ? '1px solid rgba(74,222,128,0.5)' : isWrong ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: showInPhase && isTarget ? `0 0 12px ${color}66` : 'none',
                  transition: 'all 0.15s',
                }} />
              );
            })}
          </div>
        </div>
      )}

      {state === 'done' && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>Max level reached</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '56px', fontWeight: '900', color, lineHeight: 1 }}>{maxLevel}</div>
        </div>
      )}

      <button onClick={onBack} style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. VERBAL MEMORY
══════════════════════════════════════════════════════════════ */

function VerbalMemoryTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [active, setActive] = useState(false);
  const [word, setWord] = useState('');
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [pool, setPool] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const startMs = useRef(Date.now());
  const color = TEST_META.verbalmem.color;

  function nextWord(seenSet: Set<string>, poolArr: string[]) {
    const showSeen = seenSet.size >= 5 && Math.random() < 0.45;
    if (showSeen && seenSet.size > 0) {
      const seenArr = [...seenSet];
      return { w: seenArr[Math.floor(Math.random() * seenArr.length)], pool: poolArr };
    }
    if (poolArr.length === 0) return { w: [...seenSet][0] ?? 'apple', pool: poolArr };
    const w = poolArr[0];
    return { w, pool: poolArr.slice(1) };
  }

  function start() {
    const shuffled = shuffle(VERBAL_WORDS);
    const { w, pool: p } = nextWord(new Set(), shuffled);
    const ns = new Set<string>(); ns.add(w);
    setPool(p); setSeen(ns); setWord(w); setScore(0); setLives(3);
    setActive(true); startMs.current = Date.now();
  }

  function answer(isSeen: boolean) {
    const correct = isSeen ? seen.has(word) : !seen.has(word);
    if (correct) {
      tone(880, 0.08, 'sine', 0.09); setFlash('correct');
      setScore(s => s + 1);
    } else {
      tone(220, 0.2, 'sawtooth', 0.08); setFlash('wrong');
      const nl = lives - 1; setLives(nl);
      if (nl <= 0) {
        setActive(false);
        onDone({ gameId: 'hb_verbalmem', timeMs: Date.now() - startMs.current, score: score + (correct ? 1 : 0) });
        return;
      }
    }
    setTimeout(() => {
      setFlash(null);
      const ns = new Set(seen); ns.add(word);
      setSeen(ns);
      const { w, pool: p } = nextWord(ns, pool);
      setPool(p); setWord(w);
    }, 300);
  }

  const btnBase: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.12s' };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color }}>Score: {score}</div>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: 3 }, (_, i) => <span key={i} style={{ fontSize: '14px', opacity: i < lives ? 1 : 0.2 }}>❤️</span>)}
        </div>
      </div>

      {!active ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>📖</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Click <strong style={{ color }}>SEEN</strong> if shown before, <strong style={{ color: '#60a5fa' }}>NEW</strong> if not</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '20px' }}>3 lives</div>
          <button onClick={start} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 0 20px ${color}55` }}>Start</button>
        </div>
      ) : (
        <div>
          <div style={{
            textAlign: 'center', padding: '32px 20px', marginBottom: '16px',
            background: flash === 'correct' ? 'rgba(74,222,128,0.1)' : flash === 'wrong' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
            border: flash === 'correct' ? '1px solid rgba(74,222,128,0.4)' : flash === 'wrong' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', transition: 'background 0.15s, border 0.15s',
          }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' }}>{word}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => answer(true)} style={{ ...btnBase, background: `${color}22`, border: `1px solid ${color}55`, color }}>SEEN</button>
            <button onClick={() => answer(false)} style={{ ...btnBase, background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa' }}>NEW</button>
          </div>
        </div>
      )}

      <button onClick={onBack} style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. SEQUENCE MEMORY (Simon Says)
══════════════════════════════════════════════════════════════ */

type SMState = 'idle' | 'showing' | 'input' | 'correct' | 'done';

function SequenceMemoryTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [state, setState] = useState<SMState>('idle');
  const [level, setLevel] = useState(1);
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
  const startMs = useRef(Date.now());
  const color = TEST_META.seqmem.color;
  const CELLS = 9;

  function playSeq(s: number[]) {
    setState('showing');
    let i = 0;
    function step() {
      if (i >= s.length) { setTimeout(() => setState('input'), 400); return; }
      setLit(s[i]);
      tone(300 + s[i] * 40, 0.15, 'sine', 0.08);
      setTimeout(() => { setLit(null); setTimeout(step, 220); }, 500);
      i++;
    }
    setTimeout(step, 400);
  }

  function startLevel(lv: number) {
    const prev = seq.slice(0, lv - 1);
    const next = [...prev, Math.floor(Math.random() * CELLS)];
    setSeq(next); setInputIdx(0); setMaxLevel(lv - 1);
    playSeq(next);
  }

  function handleCell(i: number) {
    if (state !== 'input') return;
    tone(300 + i * 40, 0.1, 'sine', 0.08);
    if (i !== seq[inputIdx]) {
      tone(180, 0.3, 'sawtooth', 0.1); setState('done');
      onDone({ gameId: 'hb_seqmem', timeMs: Date.now() - startMs.current, score: maxLevel });
      return;
    }
    const ni = inputIdx + 1;
    if (ni >= seq.length) {
      setMaxLevel(seq.length); setState('correct');
      setTimeout(() => startLevel(level + 1), 900);
      setLevel(l => l + 1);
    } else {
      setInputIdx(ni);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color }}>Level {level}</div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>{state === 'showing' ? 'Watch…' : state === 'input' ? `Click ${inputIdx + 1}/${seq.length}` : state === 'correct' ? '✓ Correct!' : ''}</div>
      </div>

      {state === 'idle' ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>🎵</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>Watch the sequence and repeat it</div>
          <button onClick={() => { startMs.current = Date.now(); setSeq([]); startLevel(1); }} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 0 20px ${color}55` }}>Start</button>
        </div>
      ) : state === 'done' ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '56px', fontWeight: '900', color, lineHeight: 1 }}>{maxLevel}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>sequence length</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px', maxWidth: '260px', margin: '0 auto' }}>
          {Array.from({ length: CELLS }, (_, i) => (
            <div key={i} onClick={() => handleCell(i)} style={{
              height: '72px', borderRadius: '10px', cursor: state === 'input' ? 'pointer' : 'default',
              background: lit === i ? `${color}` : 'rgba(255,255,255,0.05)',
              border: lit === i ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
              boxShadow: lit === i ? `0 0 20px ${color}88` : 'none',
              transition: 'all 0.1s',
            }} />
          ))}
        </div>
      )}

      <button onClick={onBack} style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. AIM TRAINER
══════════════════════════════════════════════════════════════ */

const AIM_W = 300, AIM_H = 200, AIM_R = 22, AIM_TARGETS = 30;

function AimTrainerTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [pos, setPos] = useState({ x: AIM_W / 2, y: AIM_H / 2 });
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const color = TEST_META.aimtrainer.color;

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function newTarget() {
    setPos({
      x: AIM_R + Math.random() * (AIM_W - AIM_R * 2),
      y: AIM_R + Math.random() * (AIM_H - AIM_R * 2),
    });
  }

  function handleClick() {
    if (done) return;
    if (!started) { startRef.current = performance.now(); setStarted(true); const tick = () => { setElapsed(performance.now() - startRef.current); rafRef.current = requestAnimationFrame(tick); }; rafRef.current = requestAnimationFrame(tick); }
    tone(660 + count * 15, 0.06, 'sine', 0.07);
    const nc = count + 1;
    setCount(nc);
    if (nc >= AIM_TARGETS) {
      cancelAnimationFrame(rafRef.current);
      const ms = Math.round(performance.now() - startRef.current);
      setElapsed(ms); setDone(true);
      onDone({ gameId: 'hb_aimtrainer', timeMs: ms });
    } else { newTarget(); }
  }

  function reset() { setStarted(false); setDone(false); setCount(0); setElapsed(0); cancelAnimationFrame(rafRef.current); newTarget(); }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', color }}>{count}/{AIM_TARGETS}</div>
        {started && !done && <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{(elapsed / 1000).toFixed(2)}s</div>}
      </div>

      <div style={{ position: 'relative', width: AIM_W, height: AIM_H, margin: '0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', cursor: done ? 'default' : 'crosshair' }}>
        {!done && (
          <div onClick={handleClick} style={{
            position: 'absolute', left: pos.x - AIM_R, top: pos.y - AIM_R,
            width: AIM_R * 2, height: AIM_R * 2, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}88)`,
            boxShadow: `0 0 20px ${color}88, 0 0 40px ${color}44`,
            animation: 'hbPop 0.12s cubic-bezier(.34,1.56,.64,1)',
          }} />
        )}
        {!started && !done && (
          <div onClick={handleClick} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,4,14,0.7)', cursor: 'pointer' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: '700', color: '#fff' }}>Aim Trainer</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>Click the first target to start</div>
            </div>
          </div>
        )}
        {done && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,4,14,0.8)' }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '40px', fontWeight: '900', color, lineHeight: 1 }}>{(elapsed / 1000).toFixed(3)}s</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>for {AIM_TARGETS} targets</div>
          </div>
        )}
      </div>

      {done && <button onClick={reset} style={{ marginTop: '10px', width: '100%', padding: '10px', borderRadius: '9px', border: 'none', background: `rgba(248,113,113,0.15)`, border2: `1px solid rgba(248,113,113,0.3)`, color, fontSize: '13px', fontWeight: '700', cursor: 'pointer' } as React.CSSProperties}>↺ Try again</button>}
      <button onClick={onBack} style={{ marginTop: '10px', display: 'block', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   7. MENTAL MATH
══════════════════════════════════════════════════════════════ */

type MMPhase = 'idle' | 'playing' | 'done';

function genMathProblem(): { expr: string; answer: number } {
  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '÷') { b = Math.floor(Math.random() * 9) + 2; answer = Math.floor(Math.random() * 12) + 2; a = b * answer; }
  else if (op === '×') { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }
  else if (op === '+') { a = Math.floor(Math.random() * 80) + 10; b = Math.floor(Math.random() * 60) + 5; answer = a + b; }
  else { a = Math.floor(Math.random() * 80) + 20; b = Math.floor(Math.random() * 40) + 5; if (a < b) [a, b] = [b, a]; answer = a - b; }
  return { expr: `${a} ${op} ${b}`, answer };
}

function MentalMathTest({ onDone, onBack }: { onDone: (r: TestResult) => void; onBack: () => void }) {
  const [phase, setPhase] = useState<MMPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [problem, setProblem] = useState(() => genMathProblem());
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const color = TEST_META.mentalmath.color;

  useEffect(() => () => clearInterval(timerRef.current!), []);

  function start() {
    scoreRef.current = 0; setScore(0); setTimeLeft(60); setInput(''); setFlash(null);
    setProblem(genMathProblem()); setPhase('playing');
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('done'); onDone({ gameId: 'hb_mentalmath', timeMs: 60000, score: scoreRef.current }); return 0; }
        return t - 1;
      });
    }, 1000);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function submit() {
    if (phase !== 'playing' || !input.trim()) return;
    const val = parseInt(input, 10);
    if (val === problem.answer) {
      tone(1046, 0.07, 'sine', 0.08); setFlash('correct');
      scoreRef.current++; setScore(scoreRef.current);
    } else {
      tone(220, 0.15, 'sawtooth', 0.07); setFlash('wrong');
    }
    setInput('');
    setTimeout(() => { setFlash(null); setProblem(genMathProblem()); inputRef.current?.focus(); }, 200);
  }

  const pct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 20 ? color : timeLeft > 10 ? '#FFB300' : '#EF4444';

  return (
    <div>
      {phase === 'idle' ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '44px', marginBottom: '10px' }}>🧮</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>Solve as many equations as possible in 60s</div>
          <button onClick={start} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 0 20px ${color}55` }}>Start</button>
        </div>
      ) : phase === 'playing' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1, height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: timerColor, borderRadius: '4px', transition: 'width 0.9s linear, background 0.3s' }} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: '800', color: timerColor, minWidth: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: '8px', padding: '4px 12px', fontSize: '13px', fontWeight: '700', color }}>✓ {score}</div>
          </div>
          <div style={{
            textAlign: 'center', padding: '22px 12px', marginBottom: '14px',
            background: flash === 'correct' ? 'rgba(74,222,128,0.12)' : flash === 'wrong' ? 'rgba(239,68,68,0.1)' : `${color}0f`,
            border: `1px solid ${flash === 'correct' ? 'rgba(74,222,128,0.4)' : flash === 'wrong' ? 'rgba(239,68,68,0.35)' : `${color}33`}`,
            borderRadius: '14px', transition: 'background 0.12s',
          }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '38px', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>{problem.expr} = ?</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef} type="text" inputMode="numeric" value={input}
              onChange={e => setInput(e.target.value.replace(/[^0-9-]/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="?"
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: `1px solid ${color}44`, borderRadius: '9px', color: '#fff', fontSize: '24px', fontFamily: 'Poppins', fontWeight: '700', padding: '12px 14px', textAlign: 'center', outline: 'none' }}
            />
            <button onClick={submit} style={{ padding: '12px 18px', borderRadius: '9px', border: 'none', background: `linear-gradient(135deg,${color},${color}bb)`, color: '#000', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>→</button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '64px', fontWeight: '900', color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>correct in 60s</div>
        </div>
      )}

      <button onClick={onBack} style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer' }}>← Back</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TEST RUNNER — wraps game + result screen
══════════════════════════════════════════════════════════════ */

const TEST_COMPS: Record<TestId, React.ComponentType<{ onDone: (r: TestResult) => void; onBack: () => void }>> = {
  reaction:   ReactionTimeTest,
  numbermem:  NumberMemoryTest,
  visualmem:  VisualMemoryTest,
  verbalmem:  VerbalMemoryTest,
  seqmem:     SequenceMemoryTest,
  aimtrainer: AimTrainerTest,
  mentalmath: MentalMathTest,
};

function TestRunner({ testId, onBack }: { testId: TestId; onBack: () => void }) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [key, setKey] = useState(0);
  const meta = TEST_META[testId];
  const Comp = TEST_COMPS[testId];

  if (result) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>{meta.icon}</span>
          <div>
            <div style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: '700', color: '#fff' }}>
              {testId.charAt(0).toUpperCase() + testId.slice(1).replace(/([A-Z])/g, ' $1')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{meta.desc}</div>
          </div>
        </div>
        <ResultScreen
          result={result} meta={meta}
          onRetry={() => { setResult(null); setKey(k => k + 1); }}
          onBack={onBack}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '28px' }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Poppins', fontSize: '15px', fontWeight: '700', color: '#fff' }}>
            {['Reaction Time','Number Memory','Visual Memory','Verbal Memory','Sequence Memory','Aim Trainer','Mental Math'][['reaction','numbermem','visualmem','verbalmem','seqmem','aimtrainer','mentalmath'].indexOf(testId)]}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{meta.desc}</div>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text3)', fontSize: '12px', padding: '5px 10px', cursor: 'pointer' }}>✕</button>
      </div>
      <Comp key={key} onDone={r => { setResult(r); }} onBack={onBack} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */

const TEST_NAMES: Record<TestId, string> = {
  reaction: 'Reaction Time', numbermem: 'Number Memory', visualmem: 'Visual Memory',
  verbalmem: 'Verbal Memory', seqmem: 'Sequence Memory', aimtrainer: 'Aim Trainer', mentalmath: 'Mental Math',
};

export default function HumanBenchmark() {
  const [active, setActive] = useState<TestId | null>(null);
  const [bests, setBests] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const b: Record<string, number | null> = {};
    (Object.keys(TEST_META) as TestId[]).forEach(id => { b[id] = hbGet<number | null>(TEST_META[id].bestKey, null); });
    setBests(b);
  }, [active]);

  const CARD_BG_STYLE: React.CSSProperties = {
    background: 'rgba(8,12,36,0.96)',
    border: '1px solid rgba(93,76,255,0.15)',
    borderRadius: '16px',
    padding: '1.2rem',
    boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
  };

  if (active) {
    return (
      <div style={CARD_BG_STYLE}>
        <TestRunner testId={active} onBack={() => setActive(null)} />
        <HBStyles />
      </div>
    );
  }

  return (
    <div style={CARD_BG_STYLE}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '26px' }}>🧠</div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'Poppins', fontSize: '16px', fontWeight: '800', color: '#fff' }}>Human Benchmark</h2>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>Measure your cognitive abilities</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {(Object.keys(TEST_META) as TestId[]).map(id => {
          const m = TEST_META[id];
          const best = bests[id];
          return (
            <button key={id} onClick={() => setActive(id)} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: '12px', padding: '14px 12px', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${m.color}66`; (e.currentTarget as HTMLButtonElement).style.background = `${m.color}0d`; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${m.glow}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.border = '1px solid rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '22px' }}>{m.icon}</span>
                <span style={{ fontFamily: 'Poppins', fontSize: '12px', fontWeight: '700', color: '#fff' }}>{TEST_NAMES[id]}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px', lineHeight: 1.3 }}>{m.desc}</div>
              {best !== null ? (
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: m.color }}>
                  {m.lowerBetter ? `${best}ms` : `${best} ${m.unit}`}
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Not played</div>
              )}
            </button>
          );
        })}
      </div>

      <HBStyles />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */

function HBStyles() {
  return (
    <style>{`
      @keyframes hbBurst {
        from { opacity: 1; transform: translate(0,0) scale(1); }
        to   { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.2) rotate(180deg); }
      }
      @keyframes hbPop {
        0%   { transform: scale(0); opacity: 0; }
        70%  { transform: scale(1.18); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes hbPulse {
        0%,100% { transform: scale(1); }
        50%     { transform: scale(1.15); }
      }
      @keyframes hbSlideUp {
        from { opacity: 0; transform: scale(0.7) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  );
}
