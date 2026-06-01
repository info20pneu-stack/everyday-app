'use client';

import { useState, useEffect, useRef } from 'react';

const TYPING_TEXTS: Record<string, string> = {
  en: "The quick brown fox jumps over the lazy dog. A skilled typist can achieve remarkable speed through dedicated practice and proper technique. Speed develops from muscle memory built over time with consistent effort.",
  de: "Zwölf Boxkämpfer jagten Eva quer über den Sylter Deich. Die Tippgeschwindigkeit verbessert sich durch regelmäßiges Üben an der Tastatur. Übung macht den Meister — Ausdauer führt zum Erfolg.",
  cs: "Příliš žluťoučký kůň úpěl ďábelské ódy. Rychlé psaní vyžaduje pravidelný trénink a plné soustředění. Klávesnice se stává přirozeným prodloužením rukou zkušeného pisatele každý den.",
  fr: "Portez ce vieux whisky au juge blond qui fume. La vitesse de frappe s'améliore avec une pratique régulière et soutenue. Chaque session d'entraînement vous rapproche de la maîtrise totale du clavier.",
  es: "El veloz murciélago hindú comía feliz cardillo y kiwi. La velocidad de escritura mejora con práctica constante en el teclado. La dedicación diaria conduce a resultados sorprendentes con el tiempo.",
  it: "Il veloce volpe marrone salta sopra il cane pigro ogni giorno. La velocità di digitazione migliora con la pratica quotidiana alla tastiera. La tecnica corretta delle dita è fondamentale per raggiungere la velocità.",
  pl: "Pchnąć w tę łódź jeża lub ośm skrzyń fig. Szybkość pisania poprawia się dzięki regularnemu ćwiczeniu na klawiaturze. Każdy dzień ćwiczeń przybliża cię do mistrzostwa i sprawności pisania.",
  pt: "O veloz murganho roxo comeu o alface do jardim fresco. A velocidade de digitação melhora com a prática regular no teclado. Cada sessão de treino traz melhorias mensuráveis na performance pessoal.",
  ru: "Съешь же ещё этих мягких французских булок да выпей чаю. Скорость набора текста повышается при регулярных тренировках за клавиатурой. Каждое занятие приближает к поставленной цели совершенства.",
  zh: "今天天气晴朗，非常适合外出散步和锻炼身体。打字练习可以显著提高工作效率和计算机操作速度。坚持每天练习，速度和准确率都会逐渐提升，专注和耐心是成功的关键。",
  ja: "今日は晴れていて、とても気持ちの良い一日です。タイピングの練習を毎日続けることで、作業効率が大幅に向上します。正確さと速度の両方を意識して練習することが大切であり成長への道です。",
  ko: "오늘은 날씨가 맑고 기분 좋은 하루입니다. 타이핑 연습을 꾸준히 하면 업무 효율이 크게 향상됩니다. 정확성과 속도 모두를 의식하며 연습하는 것이 중요하며 매일의 노력이 성과를 만듭니다.",
  ar: "اليوم الطقس جميل ومناسب للخروج والتمتع بالهواء الطلق والطبيعة. ممارسة الكتابة بانتظام تحسن بشكل كبير الكفاءة في العمل اليومي. التركيز والصبر مفتاح النجاح في تحسين سرعة الطباعة على لوحة المفاتيح.",
  hi: "आज का मौसम बहुत सुंदर है और बाहर घूमने के लिए एकदम उपयुक्त है। नियमित टाइपिंग अभ्यास से काम की दक्षता में काफी सुधार होता है। धैर्य और एकाग्रता सफलता की कुंजी हैं और प्रतिदिन अभ्यास करना जरूरी है।",
};

const LANG_OPTIONS = [
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'cs', label: '🇨🇿 CS' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'it', label: '🇮🇹 IT' },
  { code: 'pl', label: '🇵🇱 PL' },
  { code: 'pt', label: '🇧🇷 PT' },
  { code: 'ru', label: '🇷🇺 RU' },
  { code: 'zh', label: '🇨🇳 ZH' },
  { code: 'ja', label: '🇯🇵 JA' },
  { code: 'ko', label: '🇰🇷 KO' },
  { code: 'ar', label: '🇸🇦 AR' },
  { code: 'hi', label: '🇮🇳 HI' },
];

const DURATIONS = [15, 30, 60, 120] as const;
type Duration = 15 | 30 | 60 | 120;
type Phase = 'idle' | 'playing' | 'done';

interface TSStats { wpm: number; cpm: number; accuracy: number; correct: number; total: number; }

function computeStats(typed: string, text: string, elapsedSec: number): TSStats {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correct++;
  }
  const total = typed.length;
  const min = elapsedSec / 60;
  const wpm = min > 0 ? Math.round((correct / 5) / min) : 0;
  const cpm = min > 0 ? Math.round(correct / min) : 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
  return { wpm, cpm, accuracy, correct, total };
}

function WpmGraph({ history }: { history: number[] }) {
  if (history.length < 2) return null;
  const max = Math.max(...history, 10);
  const bars = history.slice(-60);
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '3px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>WPM Graph</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '44px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '4px 6px' }}>
        {bars.map((v, i) => (
          <div key={i} style={{
            flex: 1, minWidth: '2px',
            height: `${Math.max(2, Math.round((v / max) * 36))}px`,
            background: `rgba(93,76,255,${0.35 + (v / max) * 0.65})`,
            borderRadius: '2px 2px 0 0',
            transition: 'height 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}

export function TypingSpeedTest({ onComplete }: {
  onComplete: (timeMs: number, wpm: number, diff: string) => void;
}) {
  const [duration, setDuration]     = useState<Duration>(60);
  const [lang, setLang]             = useState('en');
  const [phase, setPhase]           = useState<Phase>('idle');
  const [timeLeft, setTimeLeft]     = useState<number>(60);
  const [typed, setTyped]           = useState('');
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [stats, setStats]           = useState<TSStats>({ wpm: 0, cpm: 0, accuracy: 100, correct: 0, total: 0 });
  const [finalStats, setFinalStats] = useState<TSStats | null>(null);
  const [bestWpm, setBestWpm]       = useState(0);

  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const typedRef   = useRef('');
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const baseText = TYPING_TEXTS[lang] ?? TYPING_TEXTS.en;
  const fullText = (baseText + ' ').repeat(Math.ceil(350 / baseText.length)).trim();

  useEffect(() => {
    try { setBestWpm(JSON.parse(localStorage.getItem('typing_best_wpm') || '0')); } catch {}
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    typedRef.current = '';
    elapsedRef.current = 0;
    setTyped('');
    setTimeLeft(duration);
    setWpmHistory([]);
    setStats({ wpm: 0, cpm: 0, accuracy: 100, correct: 0, total: 0 });
    setFinalStats(null);
    setPhase('playing');

    timerRef.current = setInterval(() => {
      elapsedRef.current++;
      const elapsed = elapsedRef.current;
      const s = computeStats(typedRef.current, fullText, elapsed);
      setStats(s);
      setWpmHistory(h => [...h, s.wpm]);
      setTimeLeft(duration - elapsed);

      if (elapsed >= duration) {
        clearInterval(timerRef.current!);
        setFinalStats(s);
        setPhase('done');
        if (s.wpm > bestWpm) {
          setBestWpm(s.wpm);
          try { localStorage.setItem('typing_best_wpm', String(s.wpm)); } catch {}
        }
        onComplete(duration * 1000, s.wpm, `${duration}s`);
      }
    }, 1000);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (phase !== 'playing') return;
    const val = e.target.value.slice(0, fullText.length);
    typedRef.current = val;
    setTyped(val);
  }

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    typedRef.current = '';
    elapsedRef.current = 0;
    setTyped('');
    setTimeLeft(duration);
    setWpmHistory([]);
    setStats({ wpm: 0, cpm: 0, accuracy: 100, correct: 0, total: 0 });
    setFinalStats(null);
    setPhase('idle');
  }

  const WINDOW = 130;
  const windowStart = Math.max(0, typed.length - 40);
  const visibleText = fullText.slice(windowStart, windowStart + WINDOW);

  const timerPct = (timeLeft / duration) * 100;
  const timerColor = timeLeft > duration * 0.4 ? 'var(--purple)' : timeLeft > duration * 0.15 ? '#FFB300' : '#EF4444';
  const accColor = stats.accuracy >= 95 ? 'var(--green2)' : stats.accuracy >= 80 ? '#FFB300' : '#f87171';

  return (
    <div>
      {/* Duration + Language — idle only */}
      {phase === 'idle' && (
        <>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => { setDuration(d); setTimeLeft(d); }} style={{
                flex: 1, padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '700',
                background: d === duration ? 'linear-gradient(135deg,var(--purple),#7A3FFF)' : 'rgba(255,255,255,0.06)',
                color: d === duration ? '#fff' : 'var(--text3)',
              }}>{d}s</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {LANG_OPTIONS.map(lo => (
              <button key={lo.code} onClick={() => setLang(lo.code)} style={{
                padding: '3px 7px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: lo.code === lang ? '700' : '400',
                background: lo.code === lang ? 'rgba(93,76,255,0.25)' : 'rgba(255,255,255,0.04)',
                color: lo.code === lang ? 'var(--purple3)' : 'var(--text3)',
                outline: lo.code === lang ? '1px solid rgba(93,76,255,0.5)' : 'none',
              }}>{lo.label}</button>
            ))}
          </div>
        </>
      )}

      {/* Playing — timer + live stats */}
      {phase === 'playing' && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: '3px', transition: 'width 0.9s linear, background 0.3s' }} />
            </div>
            <div style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: '800', color: timerColor, minWidth: '30px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</div>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { val: stats.wpm,      label: 'WPM',      color: '#fff' },
              { val: stats.cpm,      label: 'CPM',      color: '#fff' },
              { val: `${stats.accuracy}%`, label: 'ACC', color: accColor },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '5px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Poppins', color }}>{val}</div>
                <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text display + hidden textarea */}
      {(phase === 'idle' || phase === 'playing') && (
        <div
          style={{
            position: 'relative',
            background: 'rgba(0,0,0,0.25)',
            border: phase === 'playing' ? '1px solid rgba(93,76,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', padding: '14px', marginBottom: '10px',
            minHeight: '72px', cursor: 'text',
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {phase === 'idle' ? (
            <div style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.7', color: 'rgba(255,255,255,0.2)', userSelect: 'none', wordBreak: 'break-all' }}>
              {fullText.slice(0, 130)}
            </div>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.7', userSelect: 'none', wordBreak: 'break-all' }}>
              {visibleText.split('').map((char, i) => {
                const absIdx = windowStart + i;
                const isTyped   = absIdx < typed.length;
                const isCursor  = absIdx === typed.length;
                const isCorrect = isTyped && typed[absIdx] === char;
                return (
                  <span key={i} style={{
                    color: isCursor ? '#fff' : isCorrect ? '#4ade80' : isTyped ? '#f87171' : 'rgba(255,255,255,0.28)',
                    background: isCursor ? 'rgba(93,76,255,0.85)' : isTyped && !isCorrect ? 'rgba(239,68,68,0.18)' : 'transparent',
                    borderRadius: isCursor ? '2px' : '0',
                  }}>{char}</span>
                );
              })}
            </div>
          )}
          <textarea
            ref={inputRef}
            value={typed}
            onChange={handleInput}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            style={{
              position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%',
              resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', color: 'transparent', caretColor: 'transparent',
              cursor: 'text', fontSize: '14px', padding: '14px',
            }}
            onKeyDown={e => { if (e.key === 'Escape') reset(); }}
          />
        </div>
      )}

      {/* Live WPM graph */}
      {phase === 'playing' && <WpmGraph history={wpmHistory} />}

      {/* Idle — start button */}
      {phase === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          {bestWpm > 0 && (
            <div style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,179,0,0.1)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: '8px', padding: '3px 10px' }}>
              <span>🏆</span>
              <span style={{ fontSize: '11px', color: 'var(--amber)' }}>Best: {bestWpm} WPM</span>
            </div>
          )}
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>Click text or Start • Esc to reset</div>
          <button onClick={startGame} style={{
            background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none', borderRadius: '10px',
            color: '#fff', fontSize: '14px', fontWeight: '700', padding: '10px 28px', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(93,76,255,0.4)',
          }}>▶ Start ({duration}s)</button>
        </div>
      )}

      {/* Done screen */}
      {phase === 'done' && finalStats && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '14px 24px', borderRadius: '14px',
            background: 'rgba(93,76,255,0.1)', border: '1px solid rgba(93,76,255,0.3)',
            marginBottom: '10px',
          }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '64px', fontWeight: '900', background: 'linear-gradient(135deg,var(--purple3),#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
              {finalStats.wpm}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>WPM</div>
            {finalStats.wpm >= bestWpm && finalStats.wpm > 0 && (
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#FFB300', marginTop: '4px' }}>🏆 New record!</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            {[
              { val: finalStats.cpm,      label: 'CPM',         color: '#fff' },
              { val: `${finalStats.accuracy}%`, label: 'Accuracy', color: finalStats.accuracy >= 95 ? 'var(--green2)' : finalStats.accuracy >= 80 ? '#FFB300' : '#f87171' },
              { val: finalStats.correct,  label: 'Correct',     color: '#fff' },
              { val: `${duration}s`,       label: 'Duration',    color: 'var(--text2)' },
            ].map(({ val, label, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '7px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color }}>{val}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{label}</div>
              </div>
            ))}
          </div>

          <WpmGraph history={wpmHistory} />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
            <button onClick={reset} style={{
              background: 'linear-gradient(135deg,var(--purple),#7A3FFF)', border: 'none',
              borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600',
              padding: '9px 22px', cursor: 'pointer',
            }}>↺ Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
