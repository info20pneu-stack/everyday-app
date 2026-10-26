'use client';

import { useState, useCallback } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { fmtDecimal, fmtNumber } from '../../lib/formatNumber';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolCard, ToolCards } from './tools/ToolFrame';

type Phase = 'idle' | 'ping' | 'download' | 'upload' | 'done' | 'error';

/* ─── Gauge math ─── */
const CX = 120, CY = 112, R = 86;
const START_DEG = -130, END_DEG = 130, SWEEP = 260;
const MAX_MBPS = 200;

function polar(deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}
function polarR(r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}
function arcD(startDeg: number, endDeg: number) {
  const s = polar(startDeg);
  const e = polar(endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M${s.x.toFixed(2)} ${s.y.toFixed(2)} A${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function speedColor(pct: number) {
  if (pct < 0.2) return '#FF5555';
  if (pct < 0.45) return '#FFB300';
  if (pct < 0.75) return '#60A5FA';
  return '#22C55E';
}

const TICKS = [0, 50, 100, 150, 200];

// Icons are shown separately from these labels, so strip the translation's
// own leading emoji (all follow "<emoji> Text").
function stripLeadingEmoji(s: string): string {
  return s.slice(s.indexOf(' ') + 1);
}

/** Short unit symbol in the UI language ("Mb/s", "ms"). */
function unitWord(unit: string, lang: string): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'short' })
      .formatToParts(1).filter(p => p.type === 'unit').map(p => p.value).join('').trim();
  } catch { return unit; }
}

function Gauge({ value, phase }: { value: number; phase: Phase }) {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const pct = Math.min(value / MAX_MBPS, 1);
  const vDeg = START_DEG + pct * SWEEP;
  const tip = polarR(R - 15, vDeg);
  const tail = polarR(13, vDeg + 180);
  const active = phase !== 'idle' && phase !== 'error';
  const col = active ? speedColor(pct) : 'rgba(255,255,255,0.2)';
  const isUpload = phase === 'upload';

  return (
    <svg viewBox="0 0 240 188" style={{ width: '100%', maxWidth: 300 }}>
      <defs>
        <filter id="stGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background arc */}
      <path d={arcD(START_DEG, END_DEG)} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth="20" strokeLinecap="round" />

      {/* Value arc */}
      {pct > 0.008 && !isUpload && (
        <path d={arcD(START_DEG, vDeg)} fill="none"
          stroke={col} strokeWidth="20" strokeLinecap="round"
          style={{ transition: 'all 0.1s ease-out' }} />
      )}

      {/* Upload phase: pulsing full arc */}
      {isUpload && (
        <path d={arcD(START_DEG, END_DEG)} fill="none"
          stroke="rgba(93,76,255,0.5)" strokeWidth="20" strokeLinecap="round"
          style={{ animation: 'stPulse 1.2s ease-in-out infinite' }} />
      )}

      {/* Ticks */}
      {TICKS.map(spd => {
        const deg = START_DEG + (spd / MAX_MBPS) * SWEEP;
        const inner = polarR(R - 13, deg);
        const outer = polarR(R + 10, deg);
        const lbl = polarR(R + 23, deg);
        return (
          <g key={spd}>
            <line x1={inner.x.toFixed(1)} y1={inner.y.toFixed(1)}
              x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
            <text x={lbl.x.toFixed(1)} y={lbl.y.toFixed(1)}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.3)" fontSize="12" fontFamily="monospace">
              {fmtNumber(spd, lang)}
            </text>
          </g>
        );
      })}

      {/* Needle */}
      {!isUpload && (
        <>
          <line x1={tail.x.toFixed(2)} y1={tail.y.toFixed(2)}
            x2={tip.x.toFixed(2)} y2={tip.y.toFixed(2)}
            stroke={col} strokeWidth="2.5" strokeLinecap="round"
            filter={active ? 'url(#stGlow)' : undefined}
            style={{ transition: 'all 0.1s ease-out' }}
          />
          <circle cx={CX} cy={CY} r={6} fill="#0A0E1C"
            stroke={col} strokeWidth="2.5"
            style={{ transition: 'stroke 0.1s ease-out' }}
          />
        </>
      )}
      {isUpload && (
        <circle cx={CX} cy={CY} r={6} fill="#0A0E1C"
          stroke="rgba(93,76,255,0.7)" strokeWidth="2.5" />
      )}

      {/* Center value */}
      {!isUpload ? (
        <>
          <text x={CX} y={CY + 32} textAnchor="middle"
            fill={active && value > 0 ? 'white' : 'rgba(255,255,255,0.15)'}
            fontSize="30" fontWeight="700" fontFamily="monospace"
            style={{ transition: 'fill 0.1s' }}>
            {active && value > 0 ? fmtDecimal(value, lang, 1) : '—'}
          </text>
          <text x={CX} y={CY + 50} textAnchor="middle"
            fill="rgba(255,255,255,0.4)" fontSize="12">
            {unitWord('megabit-per-second', lang)}
          </text>
        </>
      ) : (
        <>
          <text x={CX} y={CY + 28} textAnchor="middle"
            fill="rgba(93,76,255,0.9)" fontSize="18" fontWeight="600">
            {t.speedTest.upload}
          </text>
          <text x={CX} y={CY + 50} textAnchor="middle"
            fill="rgba(255,255,255,0.25)" fontSize="12">
            {st.stMeasuring}
          </text>
        </>
      )}
    </svg>
  );
}

/* ─── Speed measurement ─── */
async function measurePing(): Promise<number> {
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    try {
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        cache: 'no-store', mode: 'no-cors',
      });
    } catch { /* timing still works */ }
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

async function measureDownload(onProgress: (mbps: number) => void): Promise<number> {
  const BYTES = 25_000_000;
  const resp = await fetch(`https://speed.cloudflare.com/__down?bytes=${BYTES}`, {
    cache: 'no-store',
  });
  if (!resp.body) throw new Error('No body');
  const reader = resp.body.getReader();
  let received = 0, lastBytes = 0;
  const t0 = performance.now();
  let lastT = t0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    const now = performance.now();
    if (now - lastT >= 200) {
      const mbps = ((received - lastBytes) * 8) / ((now - lastT) / 1000 * 1_000_000);
      onProgress(Math.max(0, mbps));
      lastT = now; lastBytes = received;
    }
  }
  const dt = (performance.now() - t0) / 1000;
  return (received * 8) / (dt * 1_000_000);
}

async function measureUpload(onProgress: (mbps: number) => void): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const SIZE = 10_000_000;
    const data = new Uint8Array(SIZE);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://speed.cloudflare.com/__up');
    let t0 = 0;

    xhr.upload.addEventListener('loadstart', () => { t0 = performance.now(); });
    xhr.upload.addEventListener('progress', (e) => {
      const dt = (performance.now() - t0) / 1000;
      if (dt > 0.15 && e.loaded > 0) {
        onProgress((e.loaded * 8) / (dt * 1_000_000));
      }
    });
    xhr.addEventListener('load', () => {
      const dt = (performance.now() - t0) / 1000;
      resolve((SIZE * 8) / (dt * 1_000_000));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.send(data);
  });
}

/* ─── Main component ─── */
export default function SpeedTest() {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const [phase, setPhase] = useState<Phase>('idle');
  const [gauge, setGauge] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);

  const running = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  const runTest = useCallback(async () => {
    setPing(null); setDownload(null); setUpload(null);
    setGauge(0);

    try {
      setPhase('ping');
      const p = await measurePing();
      setPing(p);

      setPhase('download');
      setGauge(0);
      const dl = await measureDownload(setGauge);
      setDownload(parseFloat(dl.toFixed(2)));
      setGauge(dl);

      setPhase('upload');
      setGauge(0);
      const ul = await measureUpload(setGauge);
      setUpload(parseFloat(ul.toFixed(2)));
      setGauge(ul);

      setPhase('done');
    } catch {
      setPhase('error');
    }
  }, []);

  function pingQuality(ms: number) {
    if (ms < 20) return { label: st.qExcellent, color: '#22C55E' };
    if (ms < 50) return { label: st.qGood, color: '#60A5FA' };
    if (ms < 100) return { label: st.qAverage, color: '#FFB300' };
    return { label: st.qHigh, color: '#FF5555' };
  }
  function speedQuality(mbps: number, fast: number, ok: number) {
    return mbps > fast ? { label: st.qExcellent, color: '#22C55E' }
      : mbps > ok ? { label: st.qGood, color: '#60A5FA' }
      : { label: st.qSlow, color: '#FF5555' };
  }

  const mbps = unitWord('megabit-per-second', lang);
  const stats = [
    { icon: '📡', label: stripLeadingEmoji(t.speedTest.ping), value: ping, text: ping != null ? `${fmtNumber(Math.round(ping), lang)} ${unitWord('millisecond', lang)}` : '—', quality: ping != null ? pingQuality(ping) : null },
    { icon: '⬇️', label: stripLeadingEmoji(t.speedTest.download), value: download, text: download != null ? `${fmtDecimal(download, lang, 1)} ${mbps}` : '—', quality: download != null ? speedQuality(download, 100, 30) : null },
    { icon: '⬆️', label: stripLeadingEmoji(t.speedTest.upload), value: upload, text: upload != null ? `${fmtDecimal(upload, lang, 1)} ${mbps}` : '—', quality: upload != null ? speedQuality(upload, 50, 10) : null },
  ];

  const phaseLabel: Record<Phase, string> = {
    idle: st.stSpeed, ping: t.speedTest.measuring, download: t.speedTest.testingDownload,
    upload: t.speedTest.testingUpload, done: `✓ ${t.speedTest.complete}`, error: st.stSpeed,
  };

  return (
    <ToolFrame toolId="rychlost">
      <section className="tf-hero">
        <div className={`tf-hero-label${running ? ' st-blink' : ''}`}>{phaseLabel[phase]}</div>
        <div className="st-gauge"><Gauge value={gauge} phase={phase} /></div>
        <div className="st-strip">
          {(['ping', 'download', 'upload'] as Phase[]).map((p, i) => {
            const done = phase === 'done' || (phase === 'upload' && i < 2) || (phase === 'download' && i < 1);
            return <i key={p} className={done ? 'done' : phase === p ? 'now' : ''} />;
          })}
        </div>
      </section>

      <ToolCards>
        {stats.map(({ icon, label, text, quality }, i) => (
          <ToolCard key={label} wide={i === 0} icon={icon} color={quality?.color ?? '#8B5CF6'} label={label}
            value={<span dir="ltr">{text}</span>} sub={quality?.label} />
        ))}
      </ToolCards>

      {phase === 'error' && <div className="tf-note" style={{ color: '#FCA5A5' }}>⚠️ {st.stError}</div>}

      <ToolButton onClick={runTest} disabled={running}>
        {running ? t.speedTest.running : phase === 'done' || phase === 'error' ? t.speedTest.runAgain : t.speedTest.runTest}
      </ToolButton>

      <style>{`
        .st-gauge { display: flex; justify-content: center; margin: 18px 0 -6px; }
        .st-strip { display: flex; gap: 6px; margin-top: 8px; }
        .st-strip i { flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,.1); transition: background .4s; }
        .st-strip i.done { background: #22C55E; }
        .st-strip i.now { background: var(--tc); animation: stPulse 1.2s ease-in-out infinite; }
        .st-blink { animation: stBlink 1.2s ease-in-out infinite; }
        @keyframes stPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes stBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </ToolFrame>
  );
}
