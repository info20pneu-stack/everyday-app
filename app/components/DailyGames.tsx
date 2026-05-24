'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════ DATA ═══════════════════════ */

type Country = { code: string; name: string };

const COUNTRIES: Country[] = [
  { code: 'US', name: 'USA' },           { code: 'GB', name: 'Velká Británie' },
  { code: 'DE', name: 'Německo' },       { code: 'FR', name: 'Francie' },
  { code: 'IT', name: 'Itálie' },        { code: 'ES', name: 'Španělsko' },
  { code: 'CZ', name: 'Česko' },         { code: 'SK', name: 'Slovensko' },
  { code: 'PL', name: 'Polsko' },        { code: 'AT', name: 'Rakousko' },
  { code: 'CH', name: 'Švýcarsko' },     { code: 'NL', name: 'Nizozemsko' },
  { code: 'BE', name: 'Belgie' },        { code: 'SE', name: 'Švédsko' },
  { code: 'NO', name: 'Norsko' },        { code: 'DK', name: 'Dánsko' },
  { code: 'FI', name: 'Finsko' },        { code: 'PT', name: 'Portugalsko' },
  { code: 'GR', name: 'Řecko' },         { code: 'TR', name: 'Turecko' },
  { code: 'JP', name: 'Japonsko' },      { code: 'CN', name: 'Čína' },
  { code: 'KR', name: 'J. Korea' },      { code: 'IN', name: 'Indie' },
  { code: 'BR', name: 'Brazílie' },      { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexiko' },        { code: 'CA', name: 'Kanada' },
  { code: 'AU', name: 'Austrálie' },     { code: 'NZ', name: 'Nový Zéland' },
  { code: 'ZA', name: 'J. Afrika' },     { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'S. Arábie' },     { code: 'AE', name: 'Emiráty' },
  { code: 'TH', name: 'Thajsko' },       { code: 'ID', name: 'Indonésie' },
  { code: 'MY', name: 'Malajsie' },      { code: 'SG', name: 'Singapur' },
  { code: 'UA', name: 'Ukrajina' },      { code: 'RO', name: 'Rumunsko' },
  { code: 'HU', name: 'Maďarsko' },      { code: 'HR', name: 'Chorvatsko' },
  { code: 'RU', name: 'Rusko' },         { code: 'IL', name: 'Izrael' },
  { code: 'NG', name: 'Nigérie' },       { code: 'KE', name: 'Keňa' },
  { code: 'PH', name: 'Filipíny' },      { code: 'VN', name: 'Vietnam' },
  { code: 'IE', name: 'Irsko' },         { code: 'HR', name: 'Chorvatsko' },
];

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

type MemCard = { id: number; pairId: number; country: Country };

function MemoryGame() {
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
    const countries = seededShuffle(COUNTRIES, seed).slice(0, pairs);
    const deck: MemCard[] = [];
    countries.forEach((c, i) => {
      deck.push({ id: i * 2, pairId: i, country: c });
      deck.push({ id: i * 2 + 1, pairId: i, country: c });
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
      {/* Difficulty */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {(Object.keys(DIFFS) as DiffKey[]).map(d => (
          <button key={d} onClick={() => setDiff(d)} style={{
            flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
            background: d === diff ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.06)',
            color: d === diff ? '#fff' : 'var(--text3)',
          }}>{d}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <StatChip label="Tahy" value={moves} />
        <StatChip label="Čas" value={fmtTime(secs)} />
        <StatChip label="Páry" value={`${matched.size / 2}/${DIFFS[diff].pairs}`} />
        <button onClick={() => initGame(diff)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '0 12px', cursor: 'pointer' }}>↺</button>
      </div>

      {best[diff] && <div style={{ marginBottom: '10px' }}><BestBadge label={diff} value={`${best[diff]} tahů`} /></div>}

      {/* Grid */}
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
                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  background: 'rgba(93,76,255,0.15)', border: '1px solid rgba(93,76,255,0.3)',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.max(emojiSz - 6, 10), color: 'rgba(93,76,255,0.5)',
                }}>✦</div>
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: isMatched ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.07)',
                  border: isMatched ? '1px solid rgba(34,197,94,0.45)' : isActive ? '1px solid rgba(93,76,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '1px',
                  boxShadow: isActive ? '0 0 14px rgba(93,76,255,0.55)' : 'none',
                }}>
                  <span style={{ fontSize: emojiSz, lineHeight: 1 }}>{flagEmoji(card.country.code)}</span>
                  {cols <= 6 && (
                    <span style={{ fontSize: '7px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>
                      {card.country.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Game over */}
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
  const [display, setDisplay]     = useState<string[]>([]); // shuffled for recall
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

  // Start first round on mount
  useEffect(() => { startRound(1); setRound(1); setScore(0); }, []);

  // Animate showing phase
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
        // Round complete
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

  function restart() {
    setRound(1); setScore(0); startRound(1);
  }

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <StatChip label="Kolo" value={round} />
        <StatChip label="Slova" value={sequence.length} />
        <StatChip label="Skóre" value={score} />
        {bestRef.current > 0 && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}><BestBadge label="Nejlepší" value={`kolo ${bestRef.current}`} /></div>}
      </div>

      {/* Showing phase */}
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

      {/* Recall phase */}
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
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '14px' }}>
            {sequence.map((_, i) => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < clicked.length ? 'var(--green2)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {/* Fail screen */}
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

type FQState = 'playing' | 'answered' | 'done';
type Question = { correct: Country; options: Country[] };

const TOTAL_Q = 10;

function buildQuestions(seed: number): Question[] {
  const shuffled = seededShuffle(COUNTRIES, seed);
  return shuffled.slice(0, TOTAL_Q).map((correct, i) => {
    const wrong = seededShuffle(shuffled.filter(c => c.code !== correct.code), seed + i + 1).slice(0, 3);
    return { correct, options: seededShuffle([correct, ...wrong], seed + i + 99) };
  });
}

function FlagQuiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]     = useState(0);
  const [score, setScore]         = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [state, setState]         = useState<FQState>('playing');
  const [streak, setStreak]       = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const bestRef = useRef(lsGet<number>('fq_best', 0));

  function init() {
    setQuestions(buildQuestions(dateSeed() + Math.floor(Math.random() * 1000)));
    setCurrent(0); setScore(0); setSelected(null); setState('playing');
    setStreak(0); setMaxStreak(0);
  }

  useEffect(() => { init(); }, []);

  function handleAnswer(code: string) {
    if (state !== 'playing' || selected) return;
    setSelected(code);
    setState('answered');
    const correct = questions[current]?.correct.code === code;
    const newScore = correct ? score + 1 : score;
    const newStreak = correct ? streak + 1 : 0;
    if (correct) setScore(newScore);
    setStreak(newStreak);
    setMaxStreak(ms => Math.max(ms, newStreak));

    setTimeout(() => {
      if (current + 1 >= TOTAL_Q) {
        setState('done');
        if (newScore > bestRef.current) {
          bestRef.current = newScore;
          lsSet('fq_best', newScore);
        }
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
        setState('playing');
      }
    }, 1100);
  }

  if (!questions.length) return null;
  const q = questions[current];

  return (
    <div>
      {state !== 'done' && (
        <>
          {/* Progress */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginBottom: '5px' }}>
              <span>Otázka {current + 1} / {TOTAL_Q}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✅ {score}</span>
                {streak >= 2 && <span style={{ animation: 'firePulse 1s infinite', display: 'inline-block' }}>🔥 {streak}</span>}
              </div>
            </div>
            <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(current / TOTAL_Q) * 100}%`, background: 'linear-gradient(90deg, var(--purple), var(--blue2))', borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Big flag */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{
              display: 'inline-block',
              fontSize: '96px', lineHeight: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '18px', padding: '14px 24px',
              boxShadow: '0 0 40px rgba(93,76,255,0.12)',
            }}>
              {flagEmoji(q.correct.code)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>Která země má tuto vlajku?</div>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {q.options.map(opt => {
              const isSelected = selected === opt.code;
              const isCorrect  = opt.code === q.correct.code;
              const showResult = state === 'answered';
              let bg = 'rgba(255,255,255,0.05)';
              let border = '1px solid rgba(255,255,255,0.1)';
              let color = '#fff';
              let shadow = 'none';
              let anim = 'none';
              if (showResult && isCorrect) {
                bg = 'rgba(34,197,94,0.15)'; border = '1px solid rgba(34,197,94,0.5)';
                color = 'var(--green2)'; shadow = '0 0 16px rgba(34,197,94,0.3)';
              } else if (showResult && isSelected && !isCorrect) {
                bg = 'rgba(239,68,68,0.15)'; border = '1px solid rgba(239,68,68,0.5)';
                color = '#EF4444'; anim = 'shake 0.4s ease';
              }
              return (
                <button key={opt.code} onClick={() => handleAnswer(opt.code)} disabled={!!selected} style={{
                  padding: '12px 10px', borderRadius: '10px', border, background: bg, color,
                  fontSize: '13px', fontWeight: '600', cursor: selected ? 'default' : 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: shadow, animation: anim, transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: '22px' }}>{flagEmoji(opt.code)}</span>
                  <span>{opt.name}</span>
                  {showResult && isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
                  {showResult && isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>✗</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Results */}
      {state === 'done' && (
        <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
          <div style={{ fontSize: '48px', fontWeight: '800', fontFamily: 'Poppins', background: 'linear-gradient(135deg, var(--purple3), var(--blue2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
            {score}/{TOTAL_Q}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '12px' }}>
            {score === 10 ? '🏆 Perfektní skóre!' : score >= 8 ? '🌟 Výborně!' : score >= 6 ? '👍 Dobře!' : score >= 4 ? '📚 Trénuj dál' : '🌍 Zeměpis není snadný'}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            <StatChip label="Správně" value={score} />
            <StatChip label="Špatně" value={TOTAL_Q - score} />
            {maxStreak >= 2 && <StatChip label="Max série" value={`${maxStreak} 🔥`} />}
          </div>
          {bestRef.current > 0 && <div style={{ marginBottom: '14px' }}><BestBadge label="Rekord" value={`${bestRef.current}/${TOTAL_Q}`} /></div>}
          <button onClick={init} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', padding: '10px 28px', cursor: 'pointer', fontWeight: '600' }}>
            Hrát znovu
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */

type TabId = 'memory' | 'wordchain' | 'flagquiz';
const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'memory',    label: 'Pexeso',  emoji: '🃏' },
  { id: 'wordchain', label: 'Řetěz',   emoji: '📝' },
  { id: 'flagquiz',  label: 'Vlajky',  emoji: '🌍' },
];

export default function DailyGames() {
  const [tab, setTab] = useState<TabId>('memory');

  return (
    <div style={CARD_BG}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        🎮 Denní hry
      </h2>

      {/* Tabs */}
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
      `}</style>
    </div>
  );
}
