'use client';

import { useState, useEffect, useCallback } from 'react';

const WORDS_BY_LANG: Record<string, string[]> = {
  en: ['APPLE','BRAIN','CHAIR','DANCE','EAGLE','FLAME','GRACE','HAPPY','INPUT','JUICE','KNIFE','LEMON','MAGIC','NIGHT','OCEAN','PIANO','QUEEN','RIVER','SMILE','TIGER','ULTRA','VOICE','WATER','XENON','YOUTH','ZEBRA','BREAD','CLOUD','DREAM','EARTH','FROST','GIANT','HONEY','IMAGE','JEWEL','KINGS','LIGHT','MOUSE','NOVEL','OLIVE','PLANT','QUEST','RADIO','SNAKE','TRAIN','UPSET','VITAL','WHEAT','EXTRA','YOUNG'],
  de: ['APFEL','BRAND','STUHL','TANZE','ADLER','FLACH','GNADE','HAPPY','INPUT','SAFT','MESSER','ZITRO','MAGIE','NACHT','OZEAN','KLAVI','QUEEN','FLUSS','SMILE','TIGER','ULTRA','STIMM','WASSE','XENON','JUGND','ZEBRA','BROOT','WOLKE','TRAUM','EERDE','FROST','RIESE','HONIG','IMAGE','JUWEL','KINGS','LICHT','MAUSE','ROMAN','OLIVE','PLANT','QUEST','RADIO','SCHLA','ZUGNG','UPSET','VITAL','WEIZE','EXTRA','YOUNG'],
  cs: ['JABLO','MOZEK','ZIDLE','TANEC','OREL','PLAMEN','MILOST','STAST','VSTUP','STAVA','NUZ','CITRON','MAGIE','NOC','OCEAN','PIANO','QUEEN','REKA','USMEV','TYGR','ULTRA','HLAS','VODA','XENON','MLADEZ','ZEBRA','CHLEB','OBLAK','SEN','ZEME','MRAZ','OBOR','MED','OBRAZ','KLENOT','KINGS','SVETLO','MYS','ROMAN','OLIVA','ROSTL','QUEST','RADIO','HAD','VLAK','UPSET','VITAL','PSENICE','EXTRA','YOUNG'],
  fr: ['POMME','CERVE','CHAIS','DANSE','AIGLE','FLAME','GRACE','BONHE','INPUT','JUICE','COUTR','CITRO','MAGIE','NUITE','OCEAN','PIANO','QUEEN','RIVIÈ','SOURIR','TIGRE','ULTRA','VOIX','WATER','XENON','YOUTH','ZEBRE','BREAD','NUAGE','DREAM','TERRE','FROST','GIANT','MIEL','IMAGE','BIJOU','KINGS','LUMIÈ','SOURIS','ROMAN','OLIVE','PLANT','QUEST','RADIO','SERPE','TRAIN','UPSET','VITAL','WHEAT','EXTRA','YOUNG'],
  es: ['MANZA','CEREBR','SILLA','BAILE','AGUIL','LLAMA','GRACI','FELIZ','INPUT','JUICE','CUCHI','LIMON','MAGIA','NOCHE','OCEAN','PIANO','QUEEN','RIO','SONRI','TIGRE','ULTRA','VOICE','AGUA','XENON','YOUTH','ZEBRA','BREAD','NUBE','DREAM','TIERRA','FROST','GIANT','MIEL','IMAGE','JOYA','KINGS','LUZ','RATON','NOVEL','OLIVA','PLANT','QUEST','RADIO','VIBOR','TRAIN','UPSET','VITAL','TRIGO','EXTRA','YOUNG'],
};

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function getDailyWord(lang: string): string {
  const words = WORDS_BY_LANG[lang] || WORDS_BY_LANG['en'];
  const start = new Date('2024-01-01');
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return words[diff % words.length];
}

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'typing';

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const used = Array(WORD_LENGTH).fill(false);
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

const COLORS: Record<LetterState, string> = {
  correct: '#22C55E',
  present: '#FFB300',
  absent: '#3F3F46',
  empty: 'transparent',
  typing: 'transparent',
};

export default function WordleGames() {
  const [lang] = useState('en');
  const [target] = useState(() => getDailyWord('en'));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});
  const [message, setMessage] = useState('');

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showMessage('Word must be 5 letters!');
      return;
    }
    const newGuesses = [...guesses, current];
    const eval_ = evaluateGuess(current, target);
    const newLetterStates = { ...letterStates };
    current.split('').forEach((letter, i) => {
      const prev = newLetterStates[letter];
      if (prev !== 'correct') newLetterStates[letter] = eval_[i];
    });
    setLetterStates(newLetterStates);
    setGuesses(newGuesses);
    setRevealed(prev => [...prev, newGuesses.length - 1]);
    setCurrent('');
    if (current === target) {
      setWon(true);
      setGameOver(true);
      showMessage('🎉 Brilliant!');
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      showMessage(`The word was ${target}`);
    }
  }, [current, guesses, target, letterStates]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      const key = e.key.toUpperCase();
      if (key === 'ENTER') { submitGuess(); return; }
      if (key === 'BACKSPACE') { setCurrent(p => p.slice(0, -1)); return; }
      if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
        setCurrent(p => p + key);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver, current, submitGuess]);

  const handleVirtualKey = (key: string) => {
    if (gameOver) return;
    if (key === 'ENTER') { submitGuess(); return; }
    if (key === '⌫') { setCurrent(p => p.slice(0, -1)); return; }
    if (current.length < WORD_LENGTH) setCurrent(p => p + key);
  };

  const shareResult = () => {
    const emoji = guesses.map(g => evaluateGuess(g, target).map(s =>
      s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬜'
    ).join('')).join('\n');
    navigator.clipboard.writeText(`EVERY DAY Wordle\n${emoji}\neveryday1234567.com`);
    showMessage('Copied to clipboard!');
  };

  const rows = Array(MAX_GUESSES).fill(null).map((_, ri) => {
    const guess = guesses[ri] || '';
    const isCurrent = ri === guesses.length;
    const word = isCurrent ? current : guess;
    const eval_ = ri < guesses.length ? evaluateGuess(guess, target) : null;
    return { word, eval_, isCurrent, isRevealed: revealed.includes(ri) };
  });

  return (
    <div style={{ background: 'rgba(15,20,40,0.92)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 0 30px rgba(93,76,255,0.10)', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'Poppins', fontSize: '22px', color: '#fff', letterSpacing: '3px' }}>WORDLE</h2>
        <p style={{ fontSize: '12px', color: '#71717A' }}>Guess the 5-letter word in 6 tries</p>
      </div>

      {message && (
        <div style={{ background: '#fff', color: '#000', borderRadius: '8px', padding: '8px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '500', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.5rem', alignItems: 'center' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '6px', animation: row.isCurrent && shake ? 'shake 0.5s' : undefined }}>
            {Array(WORD_LENGTH).fill(null).map((_, ci) => {
              const letter = row.word[ci] || '';
              const state: LetterState = row.eval_ ? row.eval_[ci] : (letter ? 'typing' : 'empty');
              return (
                <div key={ci} style={{
                  width: '52px', height: '52px',
                  border: `2px solid ${state === 'empty' ? '#3F3F46' : state === 'typing' ? '#A1A1AA' : COLORS[state]}`,
                  borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: '700', color: '#fff',
                  background: state === 'empty' || state === 'typing' ? 'transparent' : COLORS[state],
                  transition: 'all 0.3s',
                  fontFamily: 'Poppins',
                }}>
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', marginBottom: '1rem' }}>
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '4px' }}>
            {row.map(key => {
              const state = letterStates[key];
              const bg = state ? COLORS[state] : '#3F3F46';
              return (
                <button key={key} onClick={() => handleVirtualKey(key)} style={{
                  background: bg, border: 'none', borderRadius: '6px',
                  color: '#fff', fontWeight: '600', fontSize: key.length > 1 ? '10px' : '13px',
                  padding: '0', cursor: 'pointer',
                  width: key.length > 1 ? '52px' : '34px', height: '44px',
                  transition: 'background 0.3s',
                }}>
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <div style={{ fontSize: '16px', color: won ? '#22C55E' : '#f05a5a', fontWeight: '600', marginBottom: '8px' }}>
            {won ? '🎉 You won!' : `😞 The word was: ${target}`}
          </div>
          <button onClick={shareResult} style={{ background: 'linear-gradient(135deg, #5D4CFF, #7A3FFF)', border: 'none', borderRadius: '10px', color: '#fff', padding: '10px 24px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            Share Result 📤
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}