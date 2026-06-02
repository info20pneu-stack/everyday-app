'use client';

import { useState, useCallback, useEffect } from 'react';

const CHARS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  digits:  '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

type Options = {
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
};

function generate(length: number, opts: Options): string {
  const pool = [
    opts.upper   ? CHARS.upper   : '',
    opts.lower   ? CHARS.lower   : '',
    opts.digits  ? CHARS.digits  : '',
    opts.symbols ? CHARS.symbols : '',
  ].join('');

  if (!pool) return '';

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  // Guarantee at least one char from each enabled category
  const required: string[] = [];
  if (opts.upper)   required.push(pick(CHARS.upper));
  if (opts.lower)   required.push(pick(CHARS.lower));
  if (opts.digits)  required.push(pick(CHARS.digits));
  if (opts.symbols) required.push(pick(CHARS.symbols));

  const result = Array.from(arr, v => pool[v % pool.length]);

  // Scatter required chars into random positions
  const positions = shuffleIndices(length).slice(0, required.length);
  positions.forEach((pos, i) => { result[pos] = required[i]; });

  return result.join('');
}

function pick(set: string): string {
  const i = crypto.getRandomValues(new Uint32Array(1))[0] % set.length;
  return set[i];
}

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  const rng = crypto.getRandomValues(new Uint32Array(n));
  for (let i = n - 1; i > 0; i--) {
    const j = rng[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type Strength = { label: string; color: string; bars: number; desc: string };

function calcStrength(pwd: string, opts: Options): Strength {
  if (!pwd) return { label: '', color: 'transparent', bars: 0, desc: '' };

  let score = 0;
  const len = pwd.length;

  if (len >= 12) score++;
  if (len >= 16) score++;
  if (len >= 24) score++;
  if (opts.upper && opts.lower) score++;
  if (opts.digits) score++;
  if (opts.symbols) score++;

  const activeSets = [opts.upper, opts.lower, opts.digits, opts.symbols].filter(Boolean).length;
  if (activeSets >= 3) score++;
  if (activeSets === 4) score++;

  if (score <= 2) return { label: 'Weak',        color: '#FF5555', bars: 1, desc: 'Easily cracked' };
  if (score <= 4) return { label: 'Fair',        color: '#FFB300', bars: 2, desc: 'Acceptable for general use' };
  if (score <= 6) return { label: 'Strong',      color: '#60A5FA', bars: 3, desc: 'Well protected' };
  return              { label: 'Very strong',  color: '#22C55E', bars: 4, desc: 'Excellent protection' };
}

function PasswordDisplay({ pwd, onCopy, copied }: {
  pwd: string; onCopy: () => void; copied: boolean;
}) {
  if (!pwd) return null;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(93,76,255,0.25)',
      borderRadius: 12,
      padding: '0.85rem 1rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      <span style={{
        flex: 1, fontFamily: 'monospace', fontSize: '1.05rem',
        color: 'var(--text1)', wordBreak: 'break-all', lineHeight: 1.5,
        letterSpacing: '0.5px',
      }}>
        {pwd.split('').map((ch, i) => {
          const color =
            CHARS.upper.includes(ch)   ? '#C084FC' :
            CHARS.digits.includes(ch)  ? '#60A5FA' :
            CHARS.symbols.includes(ch) ? '#34D399' :
            'var(--text1)';
          return <span key={i} style={{ color }}>{ch}</span>;
        })}
      </span>
      <button
        onClick={onCopy}
        title="Copy password"
        style={{
          flexShrink: 0,
          background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(93,76,255,0.15)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(93,76,255,0.3)'}`,
          borderRadius: 8, cursor: 'pointer',
          color: copied ? '#4ADE80' : 'var(--purple3)',
          fontSize: '0.78rem', fontWeight: 600,
          padding: '0.35rem 0.7rem',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? '✓ Copied' : '⎘ Copy'}
      </button>
    </div>
  );
}

function StrengthBar({ strength }: { strength: Strength }) {
  if (!strength.label) return null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.78rem', color: strength.color, fontWeight: 600 }}>
          {strength.label}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
          {strength.desc}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: n <= strength.bars ? strength.color : 'rgba(255,255,255,0.07)',
            transition: 'background 0.3s',
            boxShadow: n <= strength.bars ? `0 0 6px ${strength.color}66` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

const TOGGLE_OPTIONS = [
  { key: 'upper'   as keyof Options, label: 'ABC', title: 'Uppercase letters', color: '#C084FC' },
  { key: 'lower'   as keyof Options, label: 'abc', title: 'Lowercase letters', color: '#A78BFA' },
  { key: 'digits'  as keyof Options, label: '123', title: 'Numbers',           color: '#60A5FA' },
  { key: 'symbols' as keyof Options, label: '!@#', title: 'Symbols',           color: '#34D399' },
];

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState<Options>({ upper: true, lower: true, digits: true, symbols: false });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const regen = useCallback((len = length, o = opts) => {
    const pwd = generate(len, o);
    setPassword(pwd);
    setCopied(false);
  }, [length, opts]);

  useEffect(() => { regen(); }, []);

  function toggleOpt(key: keyof Options) {
    const active = Object.values(opts).filter(Boolean).length;
    if (opts[key] && active === 1) return; // keep at least one
    const next = { ...opts, [key]: !opts[key] };
    setOpts(next);
    regen(length, next);
  }

  function changeLength(val: number) {
    setLength(val);
    regen(val, opts);
  }

  function copyPassword() {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setHistory(h => [password, ...h].slice(0, 5));
    });
  }

  const strength = calcStrength(password, opts);
  const activeCount = Object.values(opts).filter(Boolean).length;

  // Entropy estimate
  const poolSize =
    (opts.upper   ? 26 : 0) +
    (opts.lower   ? 26 : 0) +
    (opts.digits  ? 10 : 0) +
    (opts.symbols ? CHARS.symbols.length : 0);
  const entropy = poolSize > 0 ? Math.floor(length * Math.log2(poolSize)) : 0;

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🔑</span>
          <span style={{ color: 'var(--text1)', fontWeight: 600, fontSize: '1rem' }}>
            Password Generator
          </span>
        </div>
        <span style={{
          background: 'rgba(93,76,255,0.1)', border: '1px solid rgba(93,76,255,0.2)',
          borderRadius: 7, padding: '2px 8px',
          color: 'var(--purple3)', fontSize: '0.72rem', fontFamily: 'monospace',
        }}>
          ~{entropy} bit
        </span>
      </div>

      {/* Password display */}
      <PasswordDisplay pwd={password} onCopy={copyPassword} copied={copied} />

      {/* Strength */}
      <StrengthBar strength={strength} />

      {/* Length slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>Password length</span>
          <span style={{
            fontFamily: 'monospace', fontWeight: 700,
            color: 'var(--purple3)', fontSize: '1rem',
          }}>
            {length}
          </span>
        </div>
        <input
          type="range" min={8} max={64} value={length}
          onChange={e => changeLength(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--purple2)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          <span style={{ color: 'var(--text3)', fontSize: '0.68rem' }}>8</span>
          <span style={{ color: 'var(--text3)', fontSize: '0.68rem' }}>64</span>
        </div>
      </div>

      {/* Character set toggles */}
      <div>
        <div style={{ color: 'var(--text2)', fontSize: '0.82rem', marginBottom: '0.6rem' }}>
          Character sets
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
          {TOGGLE_OPTIONS.map(({ key, label, title, color }) => {
            const on = opts[key];
            const disabled = on && activeCount === 1;
            return (
              <button
                key={key}
                onClick={() => toggleOpt(key)}
                disabled={disabled}
                title={title}
                style={{
                  background: on ? `${color}18` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${on ? color + '55' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
                  padding: '0.5rem 0.25rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  transition: 'all 0.2s',
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <span style={{
                  fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem',
                  color: on ? color : 'var(--text3)',
                  transition: 'color 0.2s',
                }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.6rem', color: on ? color : 'var(--text3)', opacity: 0.8 }}>
                  {title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          onClick={() => regen()}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, var(--purple), var(--purple2))',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            color: 'white', fontWeight: 600, fontSize: '0.88rem',
            padding: '0.7rem',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          ↺ Vygenerovat
        </button>
        <button
          onClick={copyPassword}
          style={{
            flex: 1,
            background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, cursor: 'pointer',
            color: copied ? '#4ADE80' : 'var(--text2)',
            fontWeight: 600, fontSize: '0.88rem',
            padding: '0.7rem',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ color: 'var(--text3)', fontSize: '0.72rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent passwords
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8, padding: '0.4rem 0.7rem',
              }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.78rem',
                  color: 'var(--text3)', flex: 1, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {h}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(h)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text3)', fontSize: '0.7rem', padding: '0 0 0 0.5rem',
                    flexShrink: 0,
                  }}
                  title="Copy"
                >
                  ⎘
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { color: '#C084FC', label: 'Upper' },
          { color: '#A78BFA', label: 'Lower' },
          { color: '#60A5FA', label: 'Digits' },
          { color: '#34D399', label: 'Symbols' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
