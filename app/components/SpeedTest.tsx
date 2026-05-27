'use client';

import { useState, useCallback } from 'react';

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

function Gauge({ value, phase }: { value: number; phase: Phase }) {
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
              fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">
              {spd}
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
            {active && value > 0 ? value.toFixed(1) : '—'}
          </text>
          <text x={CX} y={CY + 50} textAnchor="middle"
            fill="rgba(255,255,255,0.3)" fontSize="10">
            Mbps
          </text>
        </>
      ) : (
        <>
          <text x={CX} y={CY + 28} textAnchor="middle"
            fill="rgba(93,76,255,0.9)" fontSize="18" fontWeight="600">
            ↑ Odesílání
          </text>
          <text x={CX} y={CY + 50} textAnchor="middle"
            fill="rgba(255,255,255,0.25)" fontSize="10">
            měření...
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
  const [phase, setPhase] = useState<Phase>('idle');
  const [gauge, setGauge] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  const [errMsg, setErrMsg] = useState('');

  const running = phase !== 'idle' && phase !== 'done' && phase !== 'error';

  const runTest = useCallback(async () => {
    setPing(null); setDownload(null); setUpload(null);
    setGauge(0); setErrMsg('');

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
    } catch (e) {
      setErrMsg('Nelze se připojit k testovacímu serveru. Může jít o CORS nebo výpadek spojení.');
      setPhase('error');
    }
  }, []);

  function pingQuality(ms: number) {
    if (ms < 20) return { label: 'Výborný', color: '#22C55E' };
    if (ms < 50) return { label: 'Dobrý', color: '#60A5FA' };
    if (ms < 100) return { label: 'Průměrný', color: '#FFB300' };
    return { label: 'Vysoký', color: '#FF5555' };
  }

  const stats = [
    {
      icon: '📡', label: 'Ping', value: ping,
      fmt: (v: number) => v.toFixed(0), unit: 'ms',
      quality: ping != null ? pingQuality(ping) : null,
    },
    {
      icon: '↓', label: 'Download', value: download,
      fmt: (v: number) => v.toFixed(1), unit: 'Mbps',
      quality: download != null ? {
        label: download > 100 ? 'Výborný' : download > 30 ? 'Dobrý' : 'Pomalý',
        color: download > 100 ? '#22C55E' : download > 30 ? '#60A5FA' : '#FF5555',
      } : null,
    },
    {
      icon: '↑', label: 'Upload', value: upload,
      fmt: (v: number) => v.toFixed(1), unit: 'Mbps',
      quality: upload != null ? {
        label: upload > 50 ? 'Výborný' : upload > 10 ? 'Dobrý' : 'Pomalý',
        color: upload > 50 ? '#22C55E' : upload > 10 ? '#60A5FA' : '#FF5555',
      } : null,
    },
  ];

  const phaseLabel: Record<Phase, string> = {
    idle: '', ping: 'Měření latence...', download: 'Testování stahování...',
    upload: 'Testování odesílání...', done: 'Test dokončen', error: '',
  };

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span style={{ color: 'var(--text1)', fontWeight: 600, fontSize: '1rem' }}>Speed Test</span>
        </div>
        {running && (
          <span style={{ color: 'var(--purple3)', fontSize: '0.78rem', animation: 'stBlink 1.2s ease-in-out infinite' }}>
            {phaseLabel[phase]}
          </span>
        )}
        {phase === 'done' && (
          <span style={{
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 7, padding: '2px 8px', fontSize: '0.75rem', color: '#4ADE80',
          }}>
            ✓ Hotovo
          </span>
        )}
      </div>

      {/* Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-0.5rem' }}>
        <Gauge value={gauge} phase={phase} />
      </div>

      {/* Phase indicator strip */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {(['ping', 'download', 'upload'] as Phase[]).map((p, i) => {
          const done = phase === 'done' || (phase === 'upload' && i < 2) || (phase === 'download' && i < 1);
          const active = phase === p;
          return (
            <div key={p} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: done ? 'var(--green)' : active ? 'var(--purple2)' : 'rgba(255,255,255,0.07)',
              transition: 'background 0.4s',
              ...(active ? { animation: 'stPulse 1.2s ease-in-out infinite' } : {}),
            }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '-0.75rem' }}>
        {(['Ping', 'Download', 'Upload'] as const).map((l, i) => (
          <div key={l} style={{
            flex: 1, textAlign: 'center',
            fontSize: '0.65rem', color: 'var(--text3)',
          }}>{l}</div>
        ))}
      </div>

      {/* Result cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
        {stats.map(({ icon, label, value, fmt, unit, quality }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${quality ? quality.color + '33' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12, padding: '0.7rem 0.5rem',
            textAlign: 'center', transition: 'border-color 0.4s',
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{icon}</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {label}
            </div>
            <div style={{
              fontFamily: 'monospace', fontWeight: 700,
              fontSize: value != null ? '1.15rem' : '1.3rem',
              color: quality ? quality.color : 'rgba(255,255,255,0.18)',
              marginTop: '0.15rem', transition: 'color 0.4s',
              lineHeight: 1.2,
            }}>
              {value != null ? fmt(value) : '—'}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.65rem', marginTop: '1px' }}>{unit}</div>
            {quality && (
              <div style={{ color: quality.color, fontSize: '0.6rem', marginTop: '3px', opacity: 0.8 }}>
                {quality.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {phase === 'error' && (
        <div style={{
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10, padding: '0.7rem 1rem',
          color: '#FCA5A5', fontSize: '0.8rem',
        }}>
          ⚠️ {errMsg}
        </div>
      )}

      {/* Button */}
      <button
        onClick={runTest}
        disabled={running}
        style={{
          background: running
            ? 'rgba(255,255,255,0.04)'
            : 'linear-gradient(135deg, var(--purple), var(--purple2))',
          border: 'none', borderRadius: 12,
          color: running ? 'rgba(255,255,255,0.3)' : 'white',
          cursor: running ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem', fontWeight: 600,
          padding: '0.8rem',
          transition: 'all 0.2s',
          letterSpacing: '0.3px',
        }}
      >
        {running
          ? '⏳ Probíhá test...'
          : phase === 'done' || phase === 'error'
            ? '🔄 Spustit znovu'
            : '▶ Spustit Speed Test'}
      </button>

      <style>{`
        @keyframes stPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes stBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
