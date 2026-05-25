'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../../lib/LanguageContext';

/* ═══════════════════════ DATA ═══════════════════════ */

type Country = { code: string };

// Tiered by recognizability:
//   indices  0–19  → easy pool   (top 20)
//   indices 20–49  → normal pool (top 50)
//   indices 50–79  → hard pool   (all 80)
const ALL_COUNTRIES: Country[] = [
  // ── easy (0–19) ──────────────────────────────────────────
  { code: 'US' }, { code: 'GB' }, { code: 'DE' }, { code: 'FR' },
  { code: 'IT' }, { code: 'ES' }, { code: 'JP' }, { code: 'CN' },
  { code: 'CA' }, { code: 'AU' }, { code: 'BR' }, { code: 'RU' },
  { code: 'IN' }, { code: 'MX' }, { code: 'KR' }, { code: 'TR' },
  { code: 'NL' }, { code: 'SE' }, { code: 'NO' }, { code: 'CH' },
  // ── normal (20–49) ───────────────────────────────────────
  { code: 'CZ' }, { code: 'SK' }, { code: 'PL' }, { code: 'AT' },
  { code: 'BE' }, { code: 'DK' }, { code: 'FI' }, { code: 'PT' },
  { code: 'GR' }, { code: 'ZA' }, { code: 'EG' }, { code: 'SA' },
  { code: 'AE' }, { code: 'TH' }, { code: 'ID' }, { code: 'MY' },
  { code: 'SG' }, { code: 'UA' }, { code: 'RO' }, { code: 'HU' },
  { code: 'HR' }, { code: 'CO' }, { code: 'IL' }, { code: 'NG' },
  { code: 'KE' }, { code: 'PH' }, { code: 'VN' }, { code: 'IE' },
  { code: 'NZ' }, { code: 'AR' },
  // ── hard (50–79) ─────────────────────────────────────────
  { code: 'CL' }, { code: 'PE' }, { code: 'EC' }, { code: 'PK' },
  { code: 'BD' }, { code: 'LK' }, { code: 'QA' }, { code: 'KW' },
  { code: 'OM' }, { code: 'BG' }, { code: 'RS' }, { code: 'LT' },
  { code: 'LV' }, { code: 'EE' }, { code: 'IS' }, { code: 'LU' },
  { code: 'DZ' }, { code: 'MA' }, { code: 'ET' }, { code: 'GH' },
  { code: 'TZ' }, { code: 'SN' }, { code: 'GE' }, { code: 'AL' },
  { code: 'AM' }, { code: 'AZ' }, { code: 'MD' }, { code: 'BY' },
  { code: 'MM' }, { code: 'KH' },
];

// Pool slices used by difficulty
const POOL_EASY   = ALL_COUNTRIES.slice(0, 20);
const POOL_NORMAL = ALL_COUNTRIES.slice(0, 50);
const POOL_HARD   = ALL_COUNTRIES;            // all 80

// MemoryGame still needs a flat unique array (up to 50 pairs for 10×10)
const UNIQUE_COUNTRIES = ALL_COUNTRIES;

const WORD_BANK = [
  'Slunce','Měsíc','Hvězda','Mrak','Déšť','Strom','Květ','List','Hora','Řeka',
  'Kočka','Pes','Pták','Ryba','Vlk','Červená','Modrá','Zelená','Žlutá','Bílá',
  'Jaro','Léto','Podzim','Zima','Vítr','Oheň','Voda','Země','Led','Kámen',
];

function flagEmoji(code: string) {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

function getCountryName(code: string, lang: string): string {
  try {
    const dn = new Intl.DisplayNames([lang, 'en'], { type: 'region' });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function dateSeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtTimeSecs(s: number): string {
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ═══════════════════════ SHARED UI ═══════════════════════ */

const CARD_BG: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  padding: '1.25rem',
  boxShadow: 'var(--card-shadow)',
};

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '5px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}

function BestBadge({ label, value }: { label: string; value: string | number }) {
  if (!value) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: '8px', padding: '3px 10px' }}>
      <span style={{ fontSize: '12px' }}>🏆</span>
      <span style={{ fontSize: '11px', color: 'var(--amber)' }}>{label}: {value}</span>
    </div>
  );
}

/* ═══════════════════════ MEMORY GAME ═══════════════════════ */

const DIFFS = {
  '4×4':   { cols: 4,  pairs: 8,  cardPx: 74 },
  '6×6':   { cols: 6,  pairs: 18, cardPx: 52 },
  '8×8':   { cols: 8,  pairs: 32, cardPx: 40 },
  '10×10': { cols: 10, pairs: 50, cardPx: 32 },
} as const;
type DiffKey = keyof typeof DIFFS;

type MemCard = { id: number; pairId: number; code: string };

function MemoryGame() {
  const { lang } = useLang();
  const [diff, setDiff]       = useState<DiffKey>('4×4');
  const [cards, setCards]     = useState<MemCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves]     = useState(0);
  const [secs, setSecs]       = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver]       = useState(false);
  const [locked, setLocked]   = useState(false);
  const best = lsGet<Record<DiffKey, number>>('mem_best', {} as Record<DiffKey, number>);

  const initGame = useCallback((d: DiffKey) => {
    const { pairs } = DIFFS[d];
    const seed = dateSeed();
    const countries = seededShuffle(UNIQUE_COUNTRIES, seed).slice(0, pairs);
    const deck: MemCard[] = [];
    countries.forEach((c, i) => {
      deck.push({ id: i * 2, pairId: i, code: c.code });
      deck.push({ id: i * 2 + 1, pairId: i, code: c.code });
    });
    setCards(seededShuffle(deck, seed + 7));
    setFlipped([]); setMatched(new Set()); setMoves(0); setSecs(0);
    setRunning(false); setOver(false); setLocked(false);
  }, []);

  useEffect(() => { initGame(diff); }, [diff, initGame]);

  useEffect(() => {
    if (!running || over) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running, over]);

  function handleClick(cardId: number) {
    if (locked || over || flipped.length >= 2 || flipped.includes(cardId) || matched.has(cardId)) return;
    if (!running) setRunning(true);
    const next = [...flipped, cardId];
    setFlipped(next);
    if (next.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);
      const [a, b] = next;
      const ca = cards.find(c => c.id === a)!;
      const cb = cards.find(c => c.id === b)!;
      if (ca.pairId === cb.pairId) {
        const nm = new Set(matched); nm.add(a); nm.add(b);
        setMatched(nm); setFlipped([]);
        if (nm.size === cards.length) {
          setOver(true); setRunning(false);
          const prev = best[diff] ?? Infinity;
          if (newMoves < prev) lsSet('mem_best', { ...best, [diff]: newMoves });
        }
      } else {
        setLocked(true);
        setTimeout(() => { setFlipped([]); setLocked(false); }, 900);
      }
    }
  }

  const { cols, cardPx } = DIFFS[diff];
  const emojiSz = cols <= 4 ? 28 : cols <= 6 ? 20 : cols <= 8 ? 15 : 12;

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {(Object.keys(DIFFS) as DiffKey[]).map(d => (
          <button key={d} onClick={() => setDiff(d)} style={{
            flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            background: d === diff ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: d === diff ? '#fff' : 'var(--text3)',
          }}>{d}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <StatChip label="Tahy" value={moves} />
        <StatChip label="Čas" value={fmtTime(secs)} />
        <StatChip label="Páry" value={`${matched.size / 2}/${DIFFS[diff].pairs}`} />
        <button onClick={() => initGame(diff)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '0 12px', cursor: 'pointer' }}>↺</button>
      </div>

      {best[diff] && <div style={{ marginBottom: '10px' }}><BestBadge label={diff} value={`${best[diff]} tahů`} /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '4px' }}>
        {cards.map(card => {
          const isFlipped  = flipped.includes(card.id) || matched.has(card.id);
          const isMatched  = matched.has(card.id);
          const isActive   = flipped.includes(card.id) && !isMatched;
          return (
            <div
              key={card.id}
              onClick={() => handleClick(card.id)}
              style={{ height: cardPx, perspective: '600px', cursor: isFlipped || locked ? 'default' : 'pointer' }}
            >
              <div style={{
                width: '100%', height: '100%', position: 'relative',
                transformStyle: 'preserve-3d', transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  background: 'rgba(93,76,255,0.15)', border: '1px solid rgba(93,76,255,0.3)',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.max(emojiSz - 6, 10), color: 'rgba(93,76,255,0.5)',
                }}>✦</div>
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: isMatched ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)',
                  border: isMatched ? '1px solid rgba(34,197,94,0.45)' : isActive ? '1px solid rgba(93,76,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '1px',
                  boxShadow: isActive ? '0 0 14px rgba(93,76,255,0.55)' : 'none',
                }}>
                  <span style={{ fontSize: emojiSz, lineHeight: 1 }}>{flagEmoji(card.code)}</span>
                  {cols <= 6 && (
                    <span style={{ fontSize: '7px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                      {getCountryName(card.code, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {over && (
        <div style={{ marginTop: '14px', background: 'linear-gradient(135deg, rgba(93,76,255,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(93,76,255,0.35)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎉</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '700', color: '#fff' }}>Splněno!</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{moves} tahů · {fmtTime(secs)}</div>
          <button onClick={() => initGame(diff)} style={{ marginTop: '12px', background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '9px 24px', cursor: 'pointer', fontWeight: '600' }}>
            Hrát znovu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ WORD CHAIN ═══════════════════════ */

type WCPhase = 'showing' | 'recall' | 'success' | 'fail';

function WordChain() {
  const [round, setRound]         = useState(1);
  const [sequence, setSequence]   = useState<string[]>([]);
  const [display, setDisplay]     = useState<string[]>([]);
  const [phase, setPhase]         = useState<WCPhase>('showing');
  const [showIdx, setShowIdx]     = useState(-1);
  const [clicked, setClicked]     = useState<string[]>([]);
  const [shakingWord, setShaking] = useState<string | null>(null);
  const [glowWord, setGlowWord]   = useState<string | null>(null);
  const [score, setScore]         = useState(0);
  const bestRef = useRef(lsGet<number>('wc_best', 0));

  function startRound(r: number) {
    const seed = dateSeed() + r * 37;
    const seq = seededShuffle(WORD_BANK, seed).slice(0, r + 2);
    setSequence(seq);
    setDisplay(seededShuffle(seq, seed + 1));
    setPhase('showing');
    setShowIdx(-1);
    setClicked([]);
    setShaking(null);
    setGlowWord(null);
  }

  useEffect(() => { startRound(1); setRound(1); setScore(0); }, []);

  useEffect(() => {
    if (phase !== 'showing') return;
    if (showIdx >= sequence.length - 1) {
      const t = setTimeout(() => setPhase('recall'), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowIdx(i => i + 1), 800);
    return () => clearTimeout(t);
  }, [phase, showIdx, sequence.length]);

  function handleWordClick(word: string) {
    if (phase !== 'recall') return;
    const expected = sequence[clicked.length];
    if (word === expected) {
      setGlowWord(word);
      setTimeout(() => setGlowWord(null), 500);
      const next = [...clicked, word];
      setClicked(next);
      if (next.length === sequence.length) {
        setPhase('success');
        const newScore = score + sequence.length;
        setScore(newScore);
        if (round + 1 > bestRef.current) {
          bestRef.current = round + 1;
          lsSet('wc_best', round + 1);
        }
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          startRound(nextRound);
        }, 1200);
      }
    } else {
      setShaking(word);
      setTimeout(() => setShaking(null), 600);
      setTimeout(() => setPhase('fail'), 700);
    }
  }

  function restart() { setRound(1); setScore(0); startRound(1); }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <StatChip label="Kolo" value={round} />
        <StatChip label="Slova" value={sequence.length} />
        <StatChip label="Skóre" value={score} />
        {bestRef.current > 0 && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}><BestBadge label="Nejlepší" value={`kolo ${bestRef.current}`} /></div>}
      </div>

      {phase === 'showing' && (
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Zapamatuj si pořadí!
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {sequence.map((w, i) => (
              <div key={w + i} style={{
                padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                background: i === showIdx ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : i < showIdx ? 'rgba(93,76,255,0.15)' : 'rgba(255,255,255,0.04)',
                border: i === showIdx ? 'none' : '1px solid rgba(255,255,255,0.07)',
                color: i === showIdx ? '#fff' : i < showIdx ? 'var(--purple3)' : 'transparent',
                boxShadow: i === showIdx ? '0 0 18px rgba(93,76,255,0.6)' : 'none',
                transition: 'all 0.3s',
                animation: i === showIdx ? 'wordPop 0.3s ease' : 'none',
              }}>
                {i <= showIdx ? w : '—'}
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === 'recall' || phase === 'success') && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {phase === 'success' ? '✅ Správně! Připravuji další…' : `Klikni ve správném pořadí (${clicked.length + 1}/${sequence.length})`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {display.map((w, i) => {
              const isClicked = clicked.includes(w);
              const isGlowing = glowWord === w;
              const isShaking = shakingWord === w;
              return (
                <button key={w + i} onClick={() => handleWordClick(w)} disabled={isClicked || phase === 'success'} style={{
                  padding: '9px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: isClicked ? 'default' : 'pointer',
                  background: isGlowing ? 'rgba(34,197,94,0.25)' : isClicked ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)',
                  color: isClicked ? 'var(--green2)' : '#fff',
                  boxShadow: isGlowing ? '0 0 18px rgba(34,197,94,0.5)' : 'none',
                  border: isGlowing ? '1px solid rgba(34,197,94,0.5)' : isClicked ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.1)',
                  animation: isShaking ? 'shake 0.5s ease' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}>
                  {isClicked ? `✓ ${w}` : w}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '14px' }}>
            {sequence.map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < clicked.length ? 'var(--green2)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'fail' && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>😅</div>
          <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Kolo {round}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '2px' }}>Skóre: {score} bodů</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '14px' }}>Správné pořadí: {sequence.join(' → ')}</div>
          <button onClick={restart} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '9px 24px', cursor: 'pointer', fontWeight: '600' }}>
            Hrát znovu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ FLAG QUIZ ═══════════════════════ */

type FQState   = 'playing' | 'answered' | 'done';
type FQDiff    = 'easy' | 'normal' | 'hard';
type FQVariant = 'A' | 'B';
type Question  = { correct: Country; options: Country[] };
type FQRecord  = { score: number; time: number; date: number; diff: FQDiff; variant: FQVariant };

const TOTAL_Q = 10;
const SHARE_URL = 'everyday-app.vercel.app';

const FQ_DIFFS: { key: FQDiff; label: string; pool: Country[] }[] = [
  { key: 'easy',   label: '🟢 Lehká',   pool: POOL_EASY   },
  { key: 'normal', label: '🟡 Střední', pool: POOL_NORMAL },
  { key: 'hard',   label: '🔴 Těžká',   pool: POOL_HARD   },
];

const CONFETTI_COLORS = ['#5D4CFF','#FFB300','#4ade80','#f87171','#60a5fa','#e879f9','#fb923c'];

function ConfettiBurst() {
  const pieces = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 2 * Math.PI;
    const r     = 56 + (i % 4) * 18;
    return {
      tx: Math.round(Math.cos(angle) * r),
      ty: Math.round(Math.sin(angle) * r),
      color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:   i % 2 === 0 ? 7 : 5,
      round:  i % 3 !== 0,
      delay:  (i % 5) * 55,
    };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: p.size, height: p.size,
          marginLeft: -p.size / 2, marginTop: -p.size / 2,
          borderRadius: p.round ? '50%' : '2px',
          background: p.color,
          animation: `cflyOut 0.65s ease-out ${p.delay}ms both`,
          ['--tx' as string]: `${p.tx}px`,
          ['--ty' as string]: `${p.ty}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// Always 4 options
function buildQuestions(seed: number, pool: Country[]): Question[] {
  const shuffled = seededShuffle(pool, seed);
  return shuffled.slice(0, TOTAL_Q).map((correct, i) => {
    const wrong = seededShuffle(
      shuffled.filter(c => c.code !== correct.code), seed + i + 1
    ).slice(0, 3);
    return { correct, options: seededShuffle([correct, ...wrong], seed + i + 99) };
  });
}

function optionColors(
  code: string, correct: string, selected: string | null, state: FQState
): { bg: string; border: string; color: string; shadow: string; anim: string } {
  const isCorrect  = code === correct;
  const isSelected = code === selected;
  const show       = state === 'answered';
  if (show && isCorrect)                return { bg: 'rgba(34,197,94,0.15)',  border: '1px solid rgba(34,197,94,0.5)',  color: 'var(--green2)', shadow: '0 0 16px rgba(34,197,94,0.3)', anim: 'none' };
  if (show && isSelected && !isCorrect) return { bg: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',  color: '#EF4444',       shadow: 'none',                         anim: 'shake 0.4s ease' };
  return { bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', shadow: 'none', anim: 'none' };
}

function FlagQuiz() {
  const { lang } = useLang();
  const [diff,        setDiff]        = useState<FQDiff>('normal');
  const [variant,     setVariant]     = useState<FQVariant>('A');
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [current,     setCurrent]     = useState(0);
  const [score,       setScore]       = useState(0);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [state,       setState]       = useState<FQState>('playing');
  const [streak,      setStreak]      = useState(0);
  const [maxStreak,   setMaxStreak]   = useState(0);
  const [liveSecs,    setLiveSecs]    = useState(0);
  const [finalSecs,   setFinalSecs]   = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [showBoard,   setShowBoard]   = useState(false);

  const startTimeRef  = useRef<number | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordsRef    = useRef<FQRecord[]>(lsGet<FQRecord[]>('fq_records', []));

  // Clean up timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function stopTimer(): number {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    return startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
  }

  function init(d: FQDiff = diff, v: FQVariant = variant) {
    stopTimer();
    startTimeRef.current = null;
    const cfg = FQ_DIFFS.find(x => x.key === d)!;
    setQuestions(buildQuestions(dateSeed() + Math.floor(Math.random() * 1000), cfg.pool));
    setCurrent(0); setScore(0); setSelected(null); setState('playing');
    setStreak(0); setMaxStreak(0);
    setLiveSecs(0); setFinalSecs(0); setIsNewRecord(false); setCopied(false); setShowBoard(false);
  }

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDiff(d: FQDiff)       { setDiff(d);    init(d, variant); }
  function handleVariant(v: FQVariant) { setVariant(v); init(diff, v); }

  function handleAnswer(code: string) {
    if (state !== 'playing' || selected) return;

    // Start timer on first answer
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setLiveSecs(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 500);
    }

    setSelected(code);
    setState('answered');
    const isCorrect  = questions[current]?.correct.code === code;
    const newScore   = isCorrect ? score + 1 : score;
    const newStreak  = isCorrect ? streak + 1 : 0;
    if (isCorrect) setScore(newScore);
    setStreak(newStreak);
    setMaxStreak(ms => Math.max(ms, newStreak));

    setTimeout(() => {
      if (current + 1 >= TOTAL_Q) {
        const elapsed = stopTimer();
        setFinalSecs(elapsed);
        setState('done');

        // Detect new record for this (diff, variant) combo
        const prevRecs = recordsRef.current.filter(r => r.diff === diff && r.variant === variant);
        const prevBestScore = prevRecs.length ? Math.max(...prevRecs.map(r => r.score)) : -1;
        const prevBestTime  = prevRecs.filter(r => r.score === prevBestScore).reduce((m, r) => Math.min(m, r.time), Infinity);
        const isRecord = newScore > prevBestScore || (newScore === prevBestScore && elapsed < prevBestTime);
        setIsNewRecord(isRecord);

        // Save record
        const entry: FQRecord = { score: newScore, time: elapsed, date: Date.now(), diff, variant };
        const updated = [...recordsRef.current, entry].sort((a, b) => b.score - a.score || a.time - b.time);
        recordsRef.current = updated;
        lsSet('fq_records', updated);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
        setState('playing');
      }
    }, 1100);
  }

  async function handleShare() {
    const diffLabel = FQ_DIFFS.find(d => d.key === diff)?.label ?? diff;
    const text = `🌍 Flag Quiz (${diffLabel}): ${score}/${TOTAL_Q} za ${fmtTimeSecs(finalSecs)}!${isNewRecord ? ' 🏆 Nový rekord!' : ''} Dokážeš mě porazit? ${SHARE_URL}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (!questions.length) return null;
  const q      = questions[current];
  const top5   = recordsRef.current.slice(0, 5);
  const diffLabel = (d: FQDiff) => d === 'easy' ? '🟢' : d === 'normal' ? '🟡' : '🔴';

  return (
    <div>
      {/* ── Variant toggle ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {([
          { v: 'A' as FQVariant, label: '🚩 Vlajka → Název' },
          { v: 'B' as FQVariant, label: '🔤 Název → Vlajka' },
        ]).map(({ v, label }) => (
          <button key={v} onClick={() => handleVariant(v)} style={{
            flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '12px', fontWeight: '600',
            background: v === variant ? 'rgba(93,76,255,0.25)' : 'rgba(255,255,255,0.04)',
            color: v === variant ? 'var(--purple3)' : 'var(--text3)',
            outline: v === variant ? '1px solid rgba(93,76,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Difficulty selector ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {FQ_DIFFS.map(d => (
          <button key={d.key} onClick={() => handleDiff(d.key)} style={{
            flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '11px', fontWeight: '600',
            background: d.key === diff ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: d.key === diff ? '#fff' : 'var(--text3)',
          }}>{d.label}</button>
        ))}
      </div>

      {/* ── In-game ── */}
      {state !== 'done' && (
        <>
          {/* Progress + live timer */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '5px' }}>
              <span>Otázka {current + 1} / {TOTAL_Q}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {streak >= 2 && <span style={{ animation: 'firePulse 1s infinite', display: 'inline-block' }}>🔥 {streak}</span>}
                <span>✅ {score}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: liveSecs > 0 ? 'var(--text2)' : 'var(--text3)' }}>
                  ⏱ {fmtTimeSecs(liveSecs)}
                </span>
              </div>
            </div>
            <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(current / TOTAL_Q) * 100}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue2))', borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Variant A: flag → text options */}
          {variant === 'A' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-block', fontSize: '96px', lineHeight: 1,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px', padding: '14px 24px',
                  boxShadow: '0 0 40px rgba(93,76,255,0.12)',
                }}>
                  {flagEmoji(q.correct.code)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                  Které zemi patří tato vlajka?
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {q.options.map(opt => {
                  const { bg, border, color, shadow, anim } = optionColors(opt.code, q.correct.code, selected, state);
                  const isC = opt.code === q.correct.code;
                  const isS = opt.code === selected;
                  return (
                    <button key={opt.code} onClick={() => handleAnswer(opt.code)} disabled={!!selected} style={{
                      padding: '14px 12px', borderRadius: '10px', border, background: bg, color,
                      fontSize: '13px', fontWeight: '600', cursor: selected ? 'default' : 'pointer',
                      textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: shadow, animation: anim, transition: 'all 0.2s',
                    }}>
                      <span style={{ lineHeight: 1.3 }}>{getCountryName(opt.code, lang)}</span>
                      {state === 'answered' && isC && <span style={{ flexShrink: 0 }}>✓</span>}
                      {state === 'answered' && isS && !isC && <span style={{ flexShrink: 0 }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Variant B: name → flag options */}
          {variant === 'B' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px', padding: '18px 32px',
                  boxShadow: '0 0 40px rgba(93,76,255,0.12)',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2 }}>
                    {getCountryName(q.correct.code, lang)}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                  Která vlajka patří tomuto státu?
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {q.options.map(opt => {
                  const { bg, border, shadow, anim } = optionColors(opt.code, q.correct.code, selected, state);
                  const isC = opt.code === q.correct.code;
                  const isS = opt.code === selected;
                  return (
                    <button key={opt.code} onClick={() => handleAnswer(opt.code)} disabled={!!selected} style={{
                      padding: '18px 8px', borderRadius: '12px', border, background: bg,
                      cursor: selected ? 'default' : 'pointer', position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      boxShadow: shadow, animation: anim, transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: '52px', lineHeight: 1 }}>{flagEmoji(opt.code)}</span>
                      {state === 'answered' && isC  && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: '14px', color: 'var(--green2)' }}>✓</span>}
                      {state === 'answered' && isS && !isC && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: '14px', color: '#EF4444' }}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Results ── */}
      {state === 'done' && (
        <div style={{ textAlign: 'center' }}>

          {/* Score card — pulse gold border on new record */}
          <div style={{
            display: 'inline-block', position: 'relative',
            borderRadius: '16px', padding: '18px 32px', marginBottom: '12px',
            background: isNewRecord
              ? 'linear-gradient(135deg, rgba(255,179,0,0.12), rgba(93,76,255,0.1))'
              : 'rgba(255,255,255,0.03)',
            border: isNewRecord ? '1px solid rgba(255,179,0,0.5)' : '1px solid rgba(255,255,255,0.06)',
            animation: isNewRecord ? 'newRecPulse 0.8s ease-out' : 'none',
          }}>
            {isNewRecord && <ConfettiBurst />}

            <div style={{
              fontSize: '52px', fontWeight: '800', fontFamily: 'Poppins',
              background: 'linear-gradient(135deg, var(--purple3), var(--blue2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}>
              {score}/{TOTAL_Q}
            </div>
            <div style={{ fontSize: '15px', color: 'var(--text2)', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
              ⏱ {fmtTimeSecs(finalSecs)}
            </div>

            {isNewRecord && (
              <div style={{
                marginTop: '8px', fontSize: '13px', fontWeight: '700',
                color: '#FFB300', animation: 'newRecBadge 0.5s cubic-bezier(.34,1.56,.64,1) 0.1s both',
                letterSpacing: '0.5px',
              }}>
                🏆 NOVÝ REKORD!
              </div>
            )}
          </div>

          {/* Reaction text */}
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '14px' }}>
            {score === 10 ? '🏆 Perfektní skóre!' : score >= 8 ? '🌟 Výborně!' : score >= 6 ? '👍 Dobře!' : score >= 4 ? '📚 Trénuj dál' : '🌍 Zeměpis není snadný'}
          </div>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '14px' }}>
            <StatChip label="Správně" value={score} />
            <StatChip label="Špatně"  value={TOTAL_Q - score} />
            {maxStreak >= 2 && <StatChip label="Max série" value={`${maxStreak} 🔥`} />}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button onClick={() => init()} style={{
              background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
              border: 'none', borderRadius: '10px', color: '#fff',
              fontSize: '13px', fontWeight: '600', padding: '10px 22px', cursor: 'pointer',
            }}>
              ↺ Hrát znovu
            </button>
            <button onClick={handleShare} style={{
              background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
              border: copied ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px', color: copied ? 'var(--green2)' : 'var(--text2)',
              fontSize: '13px', fontWeight: '600', padding: '10px 22px', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {copied ? '✓ Zkopírováno!' : '↗ Sdílet výsledek'}
            </button>
          </div>

          {/* Leaderboard */}
          <div style={{ textAlign: 'left' }}>
            <button
              onClick={() => setShowBoard(v => !v)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                color: 'var(--text3)', fontSize: '12px', fontWeight: '600',
                padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>🏅 Moje top 5 výsledků</span>
              <span>{showBoard ? '▲' : '▼'}</span>
            </button>

            {showBoard && top5.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {top5.map((rec, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 12px', borderRadius: '9px',
                    background: i === 0 && rec.score === score && rec.time === finalSecs
                      ? 'rgba(255,179,0,0.10)'
                      : 'rgba(255,255,255,0.03)',
                    border: i === 0 && rec.score === score && rec.time === finalSecs
                      ? '1px solid rgba(255,179,0,0.25)'
                      : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: '15px', width: '22px', textAlign: 'center', flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', minWidth: '36px' }}>
                      {rec.score}/{TOTAL_Q}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTimeSecs(rec.time)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {new Date(rec.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{
                      fontSize: '10px', color: 'var(--text3)',
                      background: 'rgba(255,255,255,0.06)', borderRadius: '5px',
                      padding: '2px 5px', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {diffLabel(rec.diff)}{rec.variant}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showBoard && top5.length === 0 && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text3)' }}>
                Zatím žádné záznamy.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */

type TabId = 'memory' | 'wordchain' | 'flagquiz';
const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'memory',    label: 'Pexeso', emoji: '🃏' },
  { id: 'wordchain', label: 'Řetěz',  emoji: '📝' },
  { id: 'flagquiz',  label: 'Vlajky', emoji: '🌍' },
];

export default function DailyGames() {
  const [tab, setTab] = useState<TabId>('memory');

  return (
    <div style={CARD_BG}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        🎮 Denní hry
      </h2>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontWeight: '600', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            background: t.id === tab ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.05)',
            color: t.id === tab ? '#fff' : 'var(--text2)',
          }}>
            <span>{t.emoji}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'memory'    && <MemoryGame />}
      {tab === 'wordchain' && <WordChain />}
      {tab === 'flagquiz'  && <FlagQuiz />}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-7px); }
          40%      { transform: translateX(7px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes wordPop {
          0%   { transform: scale(0.85); opacity: 0.4; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes firePulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.3); }
        }
        @keyframes cflyOut {
          from { opacity: 1; transform: translate(0,0) scale(1) rotate(0deg); }
          to   { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.25) rotate(200deg); }
        }
        @keyframes newRecPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,179,0,0.7); }
          50%  { box-shadow: 0 0 0 18px rgba(255,179,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,179,0,0); }
        }
        @keyframes newRecBadge {
          from { opacity: 0; transform: scale(0.5) translateY(6px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </div>
  );
}
