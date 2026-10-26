'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmtNumber } from '../../lib/formatNumber';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolField, ToolHero } from './tools/ToolFrame';

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

type Strength = { level: 0 | 1 | 2 | 3 | 4; color: string };

function calcStrength(pwd: string, opts: Options): Strength {
  if (!pwd) return { level: 0, color: 'transparent' };

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

  if (score <= 2) return { level: 1, color: '#FF5555' };
  if (score <= 4) return { level: 2, color: '#FFB300' };
  if (score <= 6) return { level: 3, color: '#60A5FA' };
  return { level: 4, color: '#22C55E' };
}

function charColor(ch: string): string {
  return CHARS.upper.includes(ch) ? '#D8B4FE'
    : CHARS.digits.includes(ch) ? '#7DD3FC'
    : CHARS.symbols.includes(ch) ? '#6EE7B7'
    : '#F2F3FF';
}

function getToggleOptions(t: Translations) {
  return [
    { key: 'upper'   as keyof Options, label: 'ABC', title: t.passwordGen.uppercase, color: '#C084FC' },
    { key: 'lower'   as keyof Options, label: 'abc', title: t.passwordGen.lowercase, color: '#A78BFA' },
    { key: 'digits'  as keyof Options, label: '123', title: t.passwordGen.numbers,   color: '#60A5FA' },
    { key: 'symbols' as keyof Options, label: '!@#', title: t.passwordGen.symbols,   color: '#34D399' },
  ];
}

export default function PasswordGenerator() {
  const { t, lang } = useLang();
  const TOGGLE_OPTIONS = getToggleOptions(t);
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
  const st = toolStrings(lang);
  const levelLabel = ['', st.pwWeak, st.pwFair, st.pwStrong, st.pwVeryStrong][strength.level];
  const levelDesc = ['', st.pwWeakDesc, st.pwFairDesc, st.pwStrongDesc, st.pwVeryStrongDesc][strength.level];

  // Entropy estimate
  const poolSize =
    (opts.upper   ? 26 : 0) +
    (opts.lower   ? 26 : 0) +
    (opts.digits  ? 10 : 0) +
    (opts.symbols ? CHARS.symbols.length : 0);
  const entropy = poolSize > 0 ? Math.floor(length * Math.log2(poolSize)) : 0;

  return (
    <ToolFrame toolId="hesla">
      <ToolHero
        label={st.pwYour}
        value={
          <span className="pg-pwd" dir="ltr" translate="no">
            {password.split('').map((ch, i) => <span key={i} style={{ color: charColor(ch) }}>{ch}</span>)}
          </span>
        }
        sub={strength.level > 0 && (
          <div className="pg-strength">
            <div className="pg-bars" aria-hidden="true">
              {[1, 2, 3, 4].map(n => (
                <i key={n} style={n <= strength.level ? { background: strength.color, boxShadow: `0 0 8px ${strength.color}` } : undefined} />
              ))}
            </div>
            <div><b style={{ color: strength.color }}>{levelLabel}</b> · {levelDesc} · {st.pwBits.replace('{n}', fmtNumber(entropy, lang))}</div>
          </div>
        )}
      />

      <div className="tf-actions">
        <ToolButton ghost onClick={() => regen()}>{t.passwordGen.generate}</ToolButton>
        <ToolButton onClick={copyPassword}>{copied ? t.passwordGen.copied : t.passwordGen.copy}</ToolButton>
      </div>

      <div className="tf-panel">
        <ToolField label={<span className="pg-len">{t.passwordGen.passwordLength}<b>{fmtNumber(length, lang)}</b></span>} htmlFor="pg-len">
          <input id="pg-len" type="range" min={8} max={64} value={length} className="pg-range"
            onChange={e => changeLength(Number(e.target.value))} />
        </ToolField>

        <ToolField label={t.passwordGen.characterSets}>
          <div className="pg-sets">
            {TOGGLE_OPTIONS.map(({ key, label, title, color }) => {
              const on = opts[key];
              const disabled = on && activeCount === 1;
              return (
                <button key={key} type="button" className={`tf-chip pg-set${on ? ' is-on' : ''}`} aria-pressed={on}
                  onClick={() => toggleOpt(key)} disabled={disabled} title={title} style={{ '--pc': color } as React.CSSProperties}>
                  <b dir="ltr">{label}</b>
                  <span>{title}</span>
                </button>
              );
            })}
          </div>
        </ToolField>
      </div>

      {history.length > 0 && (
        <div className="tf-panel">
          <div className="tf-label">🕘 {t.passwordGen.recentPasswords}</div>
          {history.map((h, i) => (
            <div key={i} className="pg-hist">
              <span dir="ltr" translate="no">{h}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(h)} title={t.passwordGen.copy} aria-label={t.passwordGen.copy}>⎘</button>
            </div>
          ))}
        </div>
      )}

      <div className="pg-legend">
        {[
          { color: '#D8B4FE', label: t.passwordGen.legend_upper },
          { color: '#F2F3FF', label: t.passwordGen.legend_lower },
          { color: '#7DD3FC', label: t.passwordGen.legend_digits },
          { color: '#6EE7B7', label: t.passwordGen.legend_symbols },
        ].map(({ color, label }) => (
          <span key={label}><i style={{ background: color }} />{label}</span>
        ))}
      </div>

      <style>{`
        .pg-pwd {
          display: block; font: 700 clamp(20px, 6vw, 28px)/1.35 ui-monospace, 'SFMono-Regular', Menlo, monospace;
          letter-spacing: .04em; word-break: break-all; text-shadow: none; min-height: 1.35em;
        }
        .pg-strength { display: flex; flex-direction: column; gap: 8px; align-items: center; font-weight: 500; font-size: 13px; }
        .pg-bars { display: flex; gap: 5px; width: min(240px, 100%); }
        .pg-bars i { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,.1); transition: background .3s; }
        .pg-len { display: flex; justify-content: space-between; width: 100%; }
        .pg-len b { color: #FDE68A; font-size: 15px; }
        .pg-range { width: 100%; accent-color: var(--tc); cursor: pointer; }
        .pg-sets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .pg-set { display: flex; flex-direction: column; gap: 2px; align-items: center; justify-content: center; min-height: 58px; padding: 6px 4px; border-radius: 14px; white-space: normal; }
        .pg-set b { font-family: ui-monospace, monospace; font-size: 15px; color: var(--pc); }
        .pg-set span { font-size: 11px; font-weight: 600; line-height: 1.2; text-align: center; }
        .pg-set.is-on b { color: #fff; }
        .pg-set:disabled { opacity: .6; cursor: not-allowed; }
        .pg-hist { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: rgba(10,14,42,.6); }
        .pg-hist span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, monospace; font-size: 13px; color: #C9CCE4; }
        .pg-hist button { background: none; border: 0; color: #C4B5FD; cursor: pointer; font-size: 16px; }
        .pg-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 14px; font-size: 12px; color: var(--tf-dim); }
        .pg-legend span { display: inline-flex; align-items: center; gap: 5px; }
        .pg-legend i { width: 9px; height: 9px; border-radius: 3px; }
        @media (max-width: 400px) { .pg-sets { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </ToolFrame>
  );
}
