'use client';

import { useState, useEffect, useRef } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { CURRENCIES } from '../../lib/currencies';

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

/* ── 30-day rate chart ── */
function RateChart({ history, accentColor }: { history: RateHistory; accentColor: string }) {
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
          <div style={{ color: 'var(--text3)' }}>{dates[hoverIdx]?.slice(5)}</div>
          <div style={{ fontWeight: '700' }}>{values[hoverIdx]?.toFixed(4)}</div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
        <span>{min.toFixed(4)}</span>
        <span>{max.toFixed(4)}</span>
      </div>
    </div>
  );
}

export default function Currency() {
  const { t } = useLang();
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
  const result   = ((parseFloat(amount) || 0) / fromRate * toRate);
  const rate     = toRate / fromRate;

  const fromCurr = CURRENCIES.find(c => c.code === from)!;
  const toCurr   = CURRENCIES.find(c => c.code === to)!;

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    padding: '4px 8px',
    fontSize: '12px',
    outline: 'none',
  };

  const rowStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '.75rem',
  };

  const card: React.CSSProperties = {
    background: 'rgba(15,20,40,0.92)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 'var(--card-radius)',
    padding: '1.25rem',
    boxShadow: 'var(--card-shadow)',
  };

  return (
    <div className="card" style={card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>
          💵 Currency Converter
        </h2>
        <button className="icon-btn"
          onClick={loadRates}
          title="Refresh rates"
          disabled={fetchState === 'loading'}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '3px 8px', cursor: 'pointer', opacity: fetchState === 'loading' ? 0.5 : 1 }}
        >↺</button>
      </div>

      {/* Loading skeleton */}
      {fetchState === 'loading' && (
        <>
          <div style={{ height: '88px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', marginBottom: '.75rem' }} />
          <div style={{ height: '36px', borderRadius: '50%', width: '36px', background: 'rgba(255,255,255,0.04)', margin: '0 auto -.25rem', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ height: '88px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite', margin: '.75rem 0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: '52px', borderRadius: '10px', background: 'rgba(255,255,255,0.025)', animation: 'shimmer 1.5s infinite', animationDelay: `${i * 0.06}s` }} />
            ))}
          </div>
          <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
        </>
      )}

      {/* Main converter (visible when not in initial loading) */}
      {fetchState !== 'loading' && (
        <>
          <div style={rowStyle}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>You send</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '28px', fontWeight: '300', width: '150px', outline: 'none' }}
              />
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>{fromCurr.flag}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{from}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{fromCurr.name}</div>
                </div>
                <select value={from} onChange={e => setFrom(e.target.value)} style={selectStyle}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '-.25rem 0', position: 'relative', zIndex: 1 }}>
            <button className="icon-btn"
              onClick={() => { setFrom(to); setTo(from); }}
              style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '16px', cursor: 'pointer', color: '#fff' }}
            >⇅</button>
          </div>

          <div style={{ ...rowStyle, marginTop: '.75rem' }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>You receive</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '28px', fontWeight: '300', color: '#fff', width: '150px' }}>
                {result.toFixed(2)}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>{toCurr.flag}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{to}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{toCurr.name}</div>
                </div>
                <select value={to} onChange={e => setTo(e.target.value)} style={selectStyle}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '.5rem 1rem', fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginBottom: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>
              1 {from} = {rate.toFixed(4)} {to}
              &nbsp;·&nbsp;
              {dataSource === 'live' ? (
                <span style={{ color: 'var(--green2)' }}>● Live (frankfurter.app)</span>
              ) : (
                <span style={{ color: 'var(--amber)' }}>● Static data (backup)</span>
              )}
            </span>
            <button className="icon-btn"
              onClick={toggleFavPair}
              title={isFavPair ? t.currency.removeFavorite : t.currency.addFavorite}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: isFavPair ? '#FFB300' : 'var(--text3)', lineHeight: 1 }}
            >{isFavPair ? '★' : '☆'}</button>
          </div>

          {/* Favorite pairs */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
              {t.currency.favorites}
            </div>
            {favPairs.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.currency.noFavorites}</div>
            ) : (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {favPairs.map(p => (
                  <button
                    key={`${p.from}-${p.to}`}
                    onClick={() => { setFrom(p.from); setTo(p.to); }}
                    style={{
                      padding: '4px 9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: '600',
                      background: p.from === from && p.to === to ? 'rgba(93,76,255,0.25)' : 'rgba(255,255,255,0.06)',
                      color: p.from === from && p.to === to ? 'var(--purple3)' : 'var(--text2)',
                    }}
                  >{p.from}→{p.to}</button>
                ))}
              </div>
            )}
          </div>

          {/* 30-day chart */}
          <div style={{ ...rowStyle }}>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>
              {t.currency.chart30d} · {from}→{to}
            </div>
            {history ? (
              <RateChart history={history} accentColor="var(--purple3)" />
            ) : historyError ? (
              <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>{t.currency.chartUnavailable}</div>
            ) : (
              <div style={{ height: '70px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.5s infinite' }} />
            )}
          </div>

          {fetchState === 'error' && (
            <div style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'var(--amber)', marginBottom: '1rem', textAlign: 'center' }}>
              ⚠️ Live rates unavailable · showing backup data
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
            {CURRENCIES.filter(c => c.code !== 'USD').slice(0, 8).map(c => {
              const val = (1 / fromRate * (rates[c.code] ?? c.rate));
              return (
                <div key={c.code} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '.625rem .875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setTo(c.code)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{c.flag}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>{c.code}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{c.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>
                      {val.toFixed(val > 100 ? 1 : 4)}
                    </div>
                    <div style={{ fontSize: '12px', color: dataSource === 'live' ? 'var(--green2)' : 'var(--text3)' }}>
                      {dataSource === 'live' ? 'live' : 'static'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
