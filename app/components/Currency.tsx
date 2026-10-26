'use client';

import { useState, useEffect, useRef } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { CURRENCIES } from '../../lib/currencies';
import FlagText from './FlagText';
import { useIsClient } from '../../lib/games/useIsClient';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolField, ToolHero, ToolTiles, useShare } from './tools/ToolFrame';

const STATIC_RATES = Object.fromEntries(CURRENCIES.map(c => [c.code, c.rate]));

type FetchState = 'loading' | 'ok' | 'error';
type DataSource = 'live' | 'static';

async function fetchRates(): Promise<Record<string, number>> {
  const res = await fetch('/api/rates');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as Record<string, number>;
}

type RateHistory = { dates: string[]; values: number[] };

async function fetchRateHistory(from: string, to: string): Promise<RateHistory> {
  const res = await fetch(`/api/rates?days=30&from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { dates: data.dates, values: data.values };
}

const FAV_PAIRS_KEY = 'currency_favorite_pairs_v1';
type FavPair = { from: string; to: string };

function loadFavPairs(): FavPair[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAV_PAIRS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveFavPairs(pairs: FavPair[]) {
  try { localStorage.setItem(FAV_PAIRS_KEY, JSON.stringify(pairs)); } catch {}
}

/** Exchange rate with 4 decimals in the language's format (0,9120). */
function fmtRate(n: number, lang: string): string {
  return new Intl.NumberFormat(lang, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(n);
}

/** Amount in a currency, e.g. "92,40" — 0 decimals for currencies without minor units (JPY, KRW). */
function fmtAmount(n: number, code: string, lang: string): string {
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits ?? 2;
  if (Math.abs(n) >= 1e9) return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  return new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** Currency name in the UI language ("americký dolar"), falling back to the English name. */
function currencyName(code: string, lang: string, fallback: string): string {
  try { return new Intl.DisplayNames([lang], { type: 'currency' }).of(code) ?? fallback; } catch { return fallback; }
}

/* ── 30-day rate chart ── */
function RateChart({ history, accentColor, lang }: { history: RateHistory; accentColor: string; lang: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 280, H = 70, PAD = 4;
  const { values, dates } = history;
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (values.length - 1);
  const points = values.map((v, i) => ({
    x: PAD + i * stepX,
    y: PAD + (H - PAD * 2) * (1 - (v - min) / range),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${H - PAD} L${points[0].x.toFixed(1)},${H - PAD} Z`;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round((relX - PAD) / stepX);
    setHoverIdx(Math.max(0, Math.min(values.length - 1, idx)));
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
        onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="rateChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#rateChartFill)" stroke="none" />
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hover && (
          <>
            <line x1={hover.x} y1={PAD} x2={hover.x} y2={H - PAD} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx={hover.x} cy={hover.y} r="3.5" fill={accentColor} stroke="#0f1428" strokeWidth="1.5" />
          </>
        )}
      </svg>
      {hover && hoverIdx !== null && (
        <div style={{
          position: 'absolute', top: 0, left: 0, transform: `translate(${Math.min(Math.max(hover.x - 30, 0), W - 60)}px, -2px)`,
          background: '#0f1428', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
          padding: '3px 7px', fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          <div style={{ color: 'var(--text3)' }}>{dates[hoverIdx] ? new Date(`${dates[hoverIdx]}T12:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' }) : ''}</div>
          <div style={{ fontWeight: '700' }}>{fmtRate(values[hoverIdx] ?? 0, lang)}</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
        <span>{fmtRate(min, lang)}</span>
        <span>{fmtRate(max, lang)}</span>
      </div>
    </div>
  );
}

export default function Currency() {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
  const { share, done } = useShare();
  const isClient = useIsClient();
  const [rates, setRates] = useState<Record<string, number>>(STATIC_RATES);
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [dataSource, setDataSource] = useState<DataSource>('static');
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [history, setHistory] = useState<RateHistory | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [favPairs, setFavPairs] = useState<FavPair[]>([]);

  useEffect(() => { setFavPairs(loadFavPairs()); }, []);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    setHistoryError(false);
    fetchRateHistory(from, to)
      .then(h => { if (!cancelled) setHistory(h); })
      .catch(() => { if (!cancelled) setHistoryError(true); });
    return () => { cancelled = true; };
  }, [from, to]);

  const isFavPair = favPairs.some(p => p.from === from && p.to === to);
  function toggleFavPair() {
    const next = isFavPair
      ? favPairs.filter(p => !(p.from === from && p.to === to))
      : [...favPairs, { from, to }].slice(-8);
    setFavPairs(next);
    saveFavPairs(next);
  }

  async function loadRates() {
    setFetchState('loading');
    try {
      const liveRates = await fetchRates();
      const merged: Record<string, number> = {};
      CURRENCIES.forEach(c => {
        merged[c.code] = liveRates[c.code] ?? c.rate;
      });
      setRates(merged);
      setDataSource('live');
      setFetchState('ok');
    } catch {
      // Fallback: static hardcoded rates
      setRates(STATIC_RATES);
      setDataSource('static');
      setFetchState('error');
    }
  }

  useEffect(() => { loadRates(); }, []);

  const fromRate = rates[from] ?? 1;
  const toRate   = rates[to]   ?? 1;
  const amountNum = parseFloat(amount.replace(',', '.')) || 0;
  const result   = amountNum / fromRate * toRate;
  const rate     = toRate / fromRate;

  const fromCurr = CURRENCIES.find(c => c.code === from)!;
  const toCurr   = CURRENCIES.find(c => c.code === to)!;
  // Intl currency names differ between Node's and the browser's ICU, so they appear after hydration
  const name = (c: (typeof CURRENCIES)[number]) => isClient ? currencyName(c.code, lang, c.name) : c.name;
  const option = (c: (typeof CURRENCIES)[number]) => `${c.code} · ${name(c)}`;
  const resultText = `${fmtAmount(amountNum, from, lang)} ${from} = ${fmtAmount(result, to, lang)} ${to}`;

  return (
    <ToolFrame toolId="meny">
      <div className="tf-panel">
        <ToolField label={t.currency.youSend} htmlFor="cur-amount">
          <div className="tf-row">
            <input id="cur-amount" type="text" inputMode="decimal" className="tf-input" style={{ flex: 1 }}
              value={amount} onChange={e => setAmount(e.target.value)} />
            <div className="cur-pick" style={{ flex: 1.4 }}>
              <span className="cur-flag"><FlagText text={fromCurr.flag} size={22} /></span>
              <select className="tf-input cur-select" value={from} onChange={e => setFrom(e.target.value)} aria-label={t.currency.youSend}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{option(c)}</option>)}
              </select>
            </div>
          </div>
        </ToolField>
        <button type="button" className="cur-swap" onClick={() => { setFrom(to); setTo(from); }} aria-label="⇅">⇅</button>
        <ToolField label={t.currency.youReceive} htmlFor="cur-to">
          <div className="cur-pick">
            <span className="cur-flag"><FlagText text={toCurr.flag} size={22} /></span>
            <select id="cur-to" className="tf-input cur-select" value={to} onChange={e => setTo(e.target.value)}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{option(c)}</option>)}
            </select>
          </div>
        </ToolField>
      </div>

      {fetchState === 'loading' ? (
        <div className="cur-skeleton" />
      ) : (
        <ToolHero
          label={<span className="tf-keep">{fmtAmount(amountNum, from, lang)} {from} =</span>}
          value={fmtAmount(result, to, lang)}
          unit={to}
          sub={
            <span className="cur-sub">
              <span dir="ltr">1 {from} = {fmtRate(rate, lang)} {to}</span>
              <span className={dataSource === 'live' ? 'cur-live' : 'cur-static'}>{dataSource === 'live' ? t.currency.liveLabel : t.currency.staticLabel}</span>
            </span>
          }
        />
      )}

      {fetchState === 'error' && <div className="tf-note" style={{ color: '#FFC94D' }}>{t.currency.liveError}</div>}

      <div className="tf-chips">
        <button type="button" className={`tf-chip${isFavPair ? ' is-on' : ''}`} aria-pressed={isFavPair} onClick={toggleFavPair}>
          {isFavPair ? '★' : '☆'} {isFavPair ? t.currency.removeFavorite : t.currency.addFavorite}
        </button>
        <button type="button" className="tf-chip" onClick={loadRates} disabled={fetchState === 'loading'}>↺ {t.currency.refresh}</button>
      </div>

      <div className="tf-panel">
        <div className="tf-label">⭐ {t.currency.favorites}</div>
        {favPairs.length === 0 ? (
          <div className="tf-note" style={{ textAlign: 'start' }}>{t.currency.noFavorites}</div>
        ) : (
          <div className="tf-chips">
            {favPairs.map(p => (
              <button key={`${p.from}-${p.to}`} type="button" dir="ltr"
                className={`tf-chip${p.from === from && p.to === to ? ' is-on' : ''}`}
                onClick={() => { setFrom(p.from); setTo(p.to); }}>{p.from} → {p.to}</button>
            ))}
          </div>
        )}
      </div>

      <div className="tf-panel">
        <div className="tf-label">📈 {t.currency.chart30d} · <span dir="ltr">{from} → {to}</span></div>
        {history ? (
          <RateChart history={history} accentColor="#4ADE80" lang={lang} />
        ) : historyError ? (
          <div className="tf-note">{t.currency.chartUnavailable}</div>
        ) : (
          <div className="cur-skeleton" style={{ height: 70 }} />
        )}
      </div>

      <ToolTiles items={CURRENCIES.filter(c => c.code !== from).slice(0, 8).map(c => ({
        label: `${c.code} · ${name(c)}`,
        value: fmtAmount(amountNum / fromRate * (rates[c.code] ?? c.rate), c.code, lang),
        accent: c.code === to,
      }))} />

      <ToolButton onClick={() => share(resultText)}>{done ? s.copied : <>📋 {s.copyResult}</>}</ToolButton>

      <style>{`
        .cur-pick { position: relative; display: flex; align-items: center; min-width: 0; }
        .cur-flag { position: absolute; inset-inline-start: 12px; display: inline-flex; pointer-events: none; }
        .cur-select { padding-inline-start: 44px; }
        .cur-swap {
          align-self: center; width: 42px; height: 42px; border-radius: 50%; cursor: pointer; margin: -4px 0;
          font-size: 18px; color: #fff; border: 1px solid color-mix(in srgb, var(--tc) 70%, #fff);
          background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 75%, #fff), color-mix(in srgb, var(--tc) 75%, #000));
          box-shadow: 0 0 16px color-mix(in srgb, var(--tc) 45%, transparent);
        }
        .cur-sub { display: inline-flex; flex-wrap: wrap; gap: 4px 12px; justify-content: center; }
        .cur-live { color: #4ADE80; }
        .cur-static { color: #FFC94D; }
        .cur-skeleton { height: 180px; border-radius: 22px; background: rgba(255,255,255,0.04); animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </ToolFrame>
  );
}
