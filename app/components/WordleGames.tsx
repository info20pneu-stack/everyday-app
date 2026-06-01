'use client';

import { useState, useEffect, useCallback } from 'react';

/* ── Word lists per category (5-letter, uppercase) ── */
const WORDS: Record<string, string[]> = {
  classic: ['WORLD','CRANE','FLAME','GHOST','PLANT','LIGHT','BRAIN','WATER','STONE','BREAK','CLOUD','DANCE','EARTH','FROST','GRANT','HOUSE','KNIFE','LEMON','MAGIC','NIGHT','OCEAN','PEACE','QUEEN','RIVER','SHELF','TIGER','VAULT','WITCH','YOUTH','ANGEL','BLADE','CHESS','DRIFT','EAGLE','FAITH','GLOVE','HEART','JUICE','KARMA','LASER','MAPLE','NURSE','OZONE','PIXEL','QUEST','SMOKE','TRAIN','UMBRA','VERSE','WATCH'],
  football:['BENCH','BLOCK','COACH','CROSS','DERBY','DRAFT','EXTRA','FIELD','FINAL','FLANK','GUARD','GOALS','MATCH','PITCH','SQUAD','SCORE','SHOOT','SKILL','SPORT','STEAL','TITLE','TOUCH','TRIAL','VILLA','YOUTH','TEAMS','FIRST','PRESS','CURVE','DRIVE','FLAGS','LIMIT','MOVES','RIVAL','SHOTS','TIMER','WINGS','ZONES','ARENA','CHAMP','CLUBS','FOULS','LINES','THIRD','SWEEP','SUPER','ULTRA','BREAK','AWARD','FINAL'],
  hockey:  ['BLADE','BLOCK','CHECK','DRAFT','GOALS','GLIDE','GUARD','KINGS','MAPLE','PUCKS','SCORE','SAVES','SHOTS','SKATE','STICK','TEAMS','TITLE','WINGS','CLEAN','FIRST','SHIFT','POINT','POWER','ZONES','CROWD','RINKS','BENCH','CYCLE','ICING','LINES','MASKS','PATCH','RINGS','SLAPS','TRADE','NORTH','FINAL','RAPID','SWIPE','HOLDS','FINES','BLAZE','CREST','FORCE','GRIND','HURLS','JUMPS','KICKS','LEAPS','MOVES'],
  car:     ['BRAKE','CABIN','CARGO','CHOKE','COUPE','CRASH','CURVE','DRIVE','DRIFT','ELITE','EXTRA','FIRST','FLARE','FORCE','GAUGE','GLIDE','GRAND','GUARD','HATCH','LIGHT','MOTOR','NITRO','PEDAL','PILOT','POWER','QUICK','RADAR','RALLY','RAPID','RACER','ROADS','SEDAN','SHIFT','SPORT','SPEED','STEER','TESLA','TITAN','TURBO','ULTRA','VALVE','VROOM','WHEEL','WIPER','WRECK','CIVIC','TRACK','GRILL','TORQS','LANES'],
  crypto:  ['BLOCK','CHAIN','COINS','ETHER','FUNDS','HALVE','LEDGE','LIMIT','LINKS','MINER','MINTS','NODES','NONCE','PRICE','PROOF','RELAY','SHARD','SMART','STAKE','STORE','TOKEN','TRADE','TRUST','VAULT','VALID','WAVES','YIELD','BEARS','BULLS','DEBIT','FORGE','GRANT','HEDGE','PROXY','RALLY','RATES','REALM','RISKS','SEEDS','SPENT','SWEEP','TALLY','TESTS','USAGE','VALUE','WORTH','GAINS','FLOAT','BONDS','ASSET'],
  animal:  ['BEARS','BISON','COBRA','CRANE','DINGO','EAGLE','EGRET','ELAND','FINCH','GECKO','GOOSE','HERON','HORSE','HYENA','KOALA','LEMUR','LLAMA','MACAW','MOOSE','MOUSE','OKAPI','OTTER','PANDA','QUAIL','RAVEN','ROBIN','SABLE','SHARK','SHEEP','SKUNK','SLOTH','SNAIL','SNAKE','STORK','TAPIR','TIGER','VIPER','WHALE','ZEBRA','BREAM','GUPPY','HIPPO','KRILL','NEWTS','QUOLL','WOMBAT','PLOVER','STOAT','VOLES','MOLES'],
  plant:   ['ALDER','ALGAE','APPLE','ASPEN','ASTER','BASIL','BEECH','BIRCH','CACAO','CANNA','CEDAR','CHIVE','CLOVE','DAISY','ELDER','FERNS','HOLLY','LILAC','LOTUS','MAPLE','MYRRH','PANSY','PEACH','PEONY','POPPY','REEDS','SEDGE','SEEDS','SHRUB','SPORE','STALK','SUMAC','THYME','TULIP','VINES','VIOLA','WHEAT','YUCCA','AGAVE','BRIAR','CRESS','EMMER','ERGOT','GORSE','HEATH','OCHNA','ROOTS','SORREL','ENDIVE','FROND'],
  city:    ['TOKYO','PARIS','CAIRO','DELHI','DUBAI','SEOUL','SOFIA','TUNIS','OSAKA','HANOI','KABUL','KYOTO','LAGOS','DAKAR','QUITO','MIAMI','MINSK','AMMAN','ASWAN','BASEL','BREST','CUSCO','DAVOS','DOVER','ESSEN','GENOA','KAZAN','KONYA','LHASA','LIEGE','MACAU','MALMO','PATAN','RONDA','SIENA','SPLIT','TARTU','TOURS','VADUZ','WUHAN','YALTA','BERNE','ACCRA','GHENT','NATAL','EVIAN','TROMS','ZARIA','NICEA','DERRY'],
};

const MODES = [
  { id: 'classic',  label: 'Classic',   emoji: '🔤', color: '#538d4e', desc: 'Common 5-letter words' },
  { id: 'football', label: 'Football',  emoji: '⚽', color: '#2d6a4f', desc: 'Football terms & clubs' },
  { id: 'hockey',   label: 'Hockey',    emoji: '🏒', color: '#1d3557', desc: 'Ice hockey vocabulary' },
  { id: 'car',      label: 'Car',       emoji: '🚗', color: '#c1121f', desc: 'Automotive world' },
  { id: 'crypto',   label: 'Crypto',    emoji: '₿',  color: '#d97706', desc: 'Blockchain & finance' },
  { id: 'animal',   label: 'Animal',    emoji: '🦁', color: '#92400e', desc: 'Animals & wildlife' },
  { id: 'plant',    label: 'Plant',     emoji: '🌿', color: '#166534', desc: 'Flora & botany' },
  { id: 'city',     label: 'City',      emoji: '🌆', color: '#1e40af', desc: 'Cities of the world' },
];

type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'typed';

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getTarget(modeId: string): string {
  const list = WORDS[modeId] ?? WORDS.classic;
  return list[dateSeed() % list.length];
}

function evaluate(guess: string, target: string): TileState[] {
  const result: TileState[] = Array(5).fill('absent');
  const remaining = target.split('');
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) { result[i] = 'correct'; remaining[i] = ''; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'absent') {
      const j = remaining.indexOf(guess[i]);
      if (j !== -1) { result[i] = 'present'; remaining[j] = ''; }
    }
  }
  return result;
}

function tileBg(state: TileState, modeColor: string): string {
  if (state === 'correct') return modeColor;
  if (state === 'present') return '#b59f3b';
  if (state === 'absent')  return '#3a3a3c';
  return 'transparent';
}

function tileBorder(state: TileState, modeColor: string): string {
  if (state === 'correct' || state === 'present' || state === 'absent') return 'none';
  if (state === 'typed') return '2px solid rgba(255,255,255,0.5)';
  return '2px solid rgba(255,255,255,0.12)';
}

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

/* ── Confetti ── */
const CONFETTI_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a78bfa','#ec4899'];
function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    x: 5 + (i % 12) * 8,
    delay: (i % 6) * 120,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: i % 3 === 0 ? 10 : 7,
    round: i % 2 === 0,
  }));
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${p.x}%`,
          width: p.size, height: p.size,
          borderRadius: p.round ? '50%' : '2px',
          background: p.color,
          animation: `wCf 1.4s ease-in ${p.delay}ms both`,
        }} />
      ))}
    </div>
  );
}

/* ── Game component ── */
function WordleGame({ modeId, onBack }: { modeId: string; onBack: () => void }) {
  const mode = MODES.find(m => m.id === modeId)!;
  const target = getTarget(modeId);
  const MAX = 6;
  const lsKey = `wordle_v2_${modeId}`;

  const [guesses,   setGuesses]   = useState<string[]>([]);
  const [evals,     setEvals]     = useState<TileState[][]>([]);
  const [current,   setCurrent]   = useState('');
  const [revealed,  setRevealed]  = useState<Set<string>>(new Set()); // "row-col"
  const [animating, setAnimating] = useState(false);
  const [phase,     setPhase]     = useState<'playing'|'won'|'lost'>('playing');
  const [shake,     setShake]     = useState(false);
  const [message,   setMessage]   = useState('');
  const [copied,    setCopied]    = useState(false);
  const [streak,    setStreak]    = useState<{ cur: number; best: number; lastDate: number }>(() => {
    try { return JSON.parse(localStorage.getItem(lsKey) || '{"cur":0,"best":0,"lastDate":0}'); } catch { return { cur: 0, best: 0, lastDate: 0 }; }
  });

  // Key colors derived from completed rows
  const keyColors: Record<string, TileState> = {};
  evals.forEach((row, ri) => {
    row.forEach((s, ci) => {
      const k = guesses[ri]?.[ci];
      if (!k) return;
      const prev = keyColors[k];
      if (!prev || (s === 'correct') || (s === 'present' && prev === 'absent')) keyColors[k] = s;
    });
  });

  function showMsg(msg: string, ms = 2000) {
    setMessage(msg);
    setTimeout(() => setMessage(''), ms);
  }

  const submit = useCallback(() => {
    if (animating || phase !== 'playing') return;
    if (current.length < 5) {
      setShake(true); setTimeout(() => setShake(false), 500);
      showMsg('Not enough letters'); return;
    }
    const guess = current.toUpperCase();
    const ev = evaluate(guess, target);
    const rowIdx = guesses.length;
    setGuesses(g => [...g, guess]);
    setEvals(e => [...e, ev]);
    setCurrent('');
    setAnimating(true);

    // Reveal tiles one by one
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setRevealed(r => new Set([...r, `${rowIdx}-${i}`]));
      }, i * 300 + 250);
    }

    setTimeout(() => {
      setAnimating(false);
      if (ev.every(s => s === 'correct')) {
        setPhase('won');
        const msgs = ['🧠 Genius!','✨ Magnificent!','🌟 Impressive!','🎉 Splendid!','👏 Great!','😅 Phew!'];
        showMsg(msgs[rowIdx] ?? '🎉', 3000);
        const today = dateSeed();
        const newCur = streak.lastDate === today - 1 ? streak.cur + 1 : 1;
        const s = { cur: newCur, best: Math.max(streak.best, newCur), lastDate: today };
        setStreak(s);
        try { localStorage.setItem(lsKey, JSON.stringify(s)); } catch {}
      } else if (rowIdx + 1 >= MAX) {
        setPhase('lost');
        showMsg(target, 5000);
        const s = { ...streak, cur: 0 };
        setStreak(s);
        try { localStorage.setItem(lsKey, JSON.stringify(s)); } catch {}
      }
    }, 5 * 300 + 400);
  }, [animating, current, guesses, target, phase, streak, lsKey]);

  const handleKey = useCallback((k: string) => {
    if (phase !== 'playing' || animating) return;
    if (k === '⌫' || k === 'BACKSPACE') { setCurrent(c => c.slice(0, -1)); return; }
    if (k === 'ENTER') { submit(); return; }
    if (/^[A-Z]$/.test(k) && current.length < 5) setCurrent(c => c + k);
  }, [phase, animating, current, submit]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => handleKey(e.key.toUpperCase());
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleKey]);

  function buildGrid(): string {
    return evals.map(row =>
      row.map(s => s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛').join('')
    ).join('\n');
  }

  async function share() {
    const text = `${mode.emoji} EVERY DAY Wordle – ${mode.label}\n${evals.length}/${MAX}\n\n${buildGrid()}\neveryday1234567.com`;
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <button onClick={onBack} style={{
          background: `${mode.color}22`, border: `1px solid ${mode.color}55`,
          borderRadius: '8px', color: mode.color, fontSize: '12px', fontWeight: '600',
          padding: '5px 11px', cursor: 'pointer',
        }}>‹ Back</button>
        <span style={{ fontSize: '18px' }}>{mode.emoji}</span>
        <span style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: '800', color: '#fff', flex: 1 }}>
          {mode.label} Wordle
        </span>
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
          <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px 7px', color: '#FFB300' }}>🔥 {streak.cur}</span>
          <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px 7px', color: 'var(--text3)' }}>🏆 {streak.best}</span>
        </div>
      </div>

      {/* Toast */}
      {message && (
        <div style={{
          textAlign: 'center', marginBottom: '8px',
          background: 'rgba(255,255,255,0.92)', color: '#111',
          borderRadius: '8px', padding: '7px 16px',
          fontWeight: '700', fontSize: '13px',
          animation: 'wToast 0.18s ease',
        }}>{message}</div>
      )}

      {/* Grid */}
      <div style={{ position: 'relative' }}>
        {phase === 'won' && <Confetti />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', marginBottom: '14px' }}>
          {Array.from({ length: MAX }, (_, row) => {
            const isCur = row === guesses.length && phase === 'playing';
            const letters = row < guesses.length
              ? guesses[row].split('')
              : isCur
                ? [...current.split(''), ...Array(5 - current.length).fill('')]
                : Array(5).fill('');

            return (
              <div key={row} style={{
                display: 'flex', gap: '5px',
                animation: isCur && shake ? 'wShake 0.4s ease' : 'none',
              }}>
                {letters.map((ch, col) => {
                  const isRev = revealed.has(`${row}-${col}`);
                  const evalState: TileState | undefined = (row < guesses.length && isRev) ? evals[row]?.[col] : undefined;
                  const state: TileState = evalState ?? (ch ? (row < guesses.length ? 'absent' : 'typed') : 'empty');
                  const isFlipping = row < guesses.length && !isRev;

                  return (
                    <div key={col} style={{
                      width: '52px', height: '52px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Poppins', fontSize: '22px', fontWeight: '800', color: '#fff',
                      background: tileBg(evalState ?? (state), mode.color),
                      border: tileBorder(state, mode.color),
                      borderRadius: '6px',
                      animation: isFlipping
                        ? `wFlipDown 0.25s ease-in ${col * 0.3}s both, wFlipUp 0.25s ease-out ${col * 0.3 + 0.25}s both`
                        : (state === 'typed' && ch ? 'wPop 0.1s ease' : 'none'),
                    }}>
                      {ch}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', marginBottom: '12px' }}>
        {KB_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '4px' }}>
            {row.map(key => {
              const kc = keyColors[key];
              const bg = kc === 'correct' ? mode.color : kc === 'present' ? '#b59f3b' : kc === 'absent' ? '#3a3a3c' : 'rgba(255,255,255,0.12)';
              return (
                <button key={key} onClick={() => handleKey(key)} style={{
                  height: '44px', width: (key === 'ENTER' || key === '⌫') ? '58px' : '32px',
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: bg, color: '#fff',
                  fontSize: key.length > 1 ? '10px' : '13px',
                  fontWeight: '700', fontFamily: 'Poppins',
                }}>{key}</button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Win/lose actions */}
      {(phase === 'won' || phase === 'lost') && (
        <div style={{ textAlign: 'center' }}>
          <button onClick={share} style={{
            background: copied ? `${mode.color}33` : 'rgba(255,255,255,0.07)',
            border: copied ? `1px solid ${mode.color}77` : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', color: copied ? mode.color : '#fff',
            fontSize: '13px', fontWeight: '600',
            padding: '9px 22px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? '✓ Copied!' : '📋 Share Grid'}
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
            New word tomorrow{phase === 'lost' ? ` · Answer: ${target}` : ''}
          </div>
        </div>
      )}

      <style>{`
        @keyframes wFlipDown { from{transform:scaleY(1)} to{transform:scaleY(0)} }
        @keyframes wFlipUp   { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes wPop      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.14)} }
        @keyframes wShake    { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes wToast    { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wCf       { 0%{opacity:1;transform:translateY(0) rotate(0)} 100%{opacity:0;transform:translateY(380px) rotate(600deg)} }
      `}</style>
    </div>
  );
}

/* ── Mode picker / exported component ── */
export default function WordleGames({ embedded = false }: { embedded?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    return <WordleGame modeId={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      {!embedded && (
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '14px' }}>
          🟩 Wordle Games
        </h2>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: `linear-gradient(135deg, ${m.color}22, ${m.color}0a)`,
              outline: `1px solid ${m.color}44`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px ${m.color}44`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>{m.emoji}</div>
            <div style={{ fontFamily: 'Poppins', fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>{m.label}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{m.desc}</div>
            <div style={{ fontSize: '9px', color: `${m.color}cc`, marginTop: '6px', letterSpacing: '0.5px' }}>
              {getTarget(m.id).slice(0,1)}{'·'.repeat(3)}{getTarget(m.id).slice(-1)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
