'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmtUnit } from '../../lib/formatNumber';
import { toolStrings, type ToolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolHero } from './tools/ToolFrame';
import type { TickerData, Tab } from '../api/markets/route';

/* ── Price helpers ── */
/** Decimals for a price: small values get 4. */
function digitsFor(v: number): number {
  return v < 10 ? 4 : 2;
}

function fmtVal(v: number, _t: TickerData, lang: string): string {
  const d = digitsFor(v);
  return new Intl.NumberFormat(lang, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}

function fmtPrice(t: TickerData, lang: string): string {
  return fmtVal(t.price, t, lang);
}

function fmtPct(n: number, lang: string, sign = false): string {
  return new Intl.NumberFormat(lang, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: sign ? 'exceptZero' : 'never' }).format(n / 100);
}

type Period = '7D' | '1M' | '1Y';

const COUNTRY_CODES: Record<string, string> = { 'United States': 'US', 'United Kingdom': 'GB', Germany: 'DE', France: 'FR', Japan: 'JP', China: 'CN' };
const COMMODITY_KEYS: Record<string, keyof ToolStrings> = {
  Gold: 'cmGold', Silver: 'cmSilver', 'WTI Oil': 'cmWti', 'Brent Oil': 'cmBrent', 'Nat. Gas': 'cmGas',
  Copper: 'cmCopper', Wheat: 'cmWheat', Corn: 'cmCorn', 'Crude Oil': 'cmCrude',
};

/** Ticker title in the UI language: commodity names are translated, index / FX symbols stay. */
function tickerTitle(tk: TickerData, st: ToolStrings): string {
  const key = COMMODITY_KEYS[tk.symbol];
  return key ? st[key] : tk.symbol;
}

/** Sub-line in the UI language: the index's country, the FX pair's currencies, the commodity's exchange. */
function tickerSub(tk: TickerData, st: ToolStrings, lang: string): string {
  try {
    const cc = COUNTRY_CODES[tk.name];
    if (cc) return new Intl.DisplayNames([lang], { type: 'region' }).of(cc) ?? tk.name;
    if (/^[A-Z]{3}\/[A-Z]{3}$/.test(tk.symbol)) {
      const dn = new Intl.DisplayNames([lang], { type: 'currency' });
      return tk.symbol.split('/').map(c => dn.of(c) ?? c).join(' / ');
    }
  } catch {}
  const key = COMMODITY_KEYS[tk.name];
  return key ? st[key] : tk.name;
}

/** "7 d", "1 m.", "1 r." — the period buttons in the UI language. */
function periodLabel(p: Period, lang: string): string {
  return p === '7D' ? fmtUnit(7, 'day', lang, 'narrow') : p === '1M' ? fmtUnit(1, 'month', lang, 'narrow') : fmtUnit(1, 'year', lang, 'narrow');
}

function jitter(base: number, maxPct: number) {
  return base * (1 + (Math.random() - 0.5) * 2 * maxPct);
}

/* ── Sparkline (small, for list rows) ── */
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const W = 56, H = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || Math.abs(min) * 0.05 || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - 2 - ((v - min) / range) * (H - 4)}`).join(' ');
  const fillD = `M${pts.split(' ')[0].split(',')[0]},${H} L${pts} L${(data.length - 1) * W / (data.length - 1)},${H} Z`;
  const color = up ? '#4ade80' : '#f87171';
  const uid = up ? 'u' : 'd';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`mspk-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#mspk-${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Line chart (for detail popup) ── */
function LineChart({ data, up, label, lang }: { data: number[]; up: boolean; label: Period; lang: string }) {
  const W = 288, H = 130;
  const PL = 52, PR = 8, PT = 8, PB = 22;
  const CW = W - PL - PR, CH = H - PT - PB;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || Math.abs(min) * 0.05 || 1;
  const color = up ? '#4ade80' : '#f87171';
  const uid = `${label}-${up ? 'u' : 'd'}`;

  const pts = data.map((v, i) => ({
    x: PL + (i / (data.length - 1)) * CW,
    y: PT + (1 - (v - min) / range) * CH,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fill = `${line} L${pts[pts.length-1].x.toFixed(1)},${PT+CH} L${PL},${PT+CH} Z`;

  // Y labels: 3 levels
  const yLevels = [max, (min+max)/2, min];
  const yPos    = [PT, PT + CH/2, PT + CH];

  // X labels
  // X labels: the last weekdays / 4 dates of the month / 4 months of the year, in the UI language
  const now = new Date();
  const n7 = Math.min(7, data.length);
  const xLabels = label === '7D'
    ? Array.from({ length: n7 }, (_, i) => new Date(now.getTime() - (n7 - 1 - i) * 86_400_000).toLocaleDateString(lang, { weekday: 'short' }))
    : label === '1M'
    ? [21, 14, 7, 0].map(d => new Date(now.getTime() - d * 86_400_000).toLocaleDateString(lang, { day: 'numeric', month: 'numeric' }))
    : [9, 6, 3, 0].map(m => new Date(now.getFullYear(), now.getMonth() - m, 1).toLocaleDateString(lang, { month: 'short' }));
  const xStep = CW / (xLabels.length - 1);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`mlg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {yPos.map((y, i) => <line key={i} x1={PL} y1={y} x2={W-PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
      {/* Fill + line */}
      <path d={fill} fill={`url(#mlg-${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      {/* Last dot */}
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3" fill={color} />
      {/* Y labels */}
      {yLevels.map((v, i) => (
        <text key={i} x={PL - 4} y={yPos[i] + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">
          {new Intl.NumberFormat(lang, { maximumFractionDigits: v >= 1000 ? 0 : v < 1 ? 4 : 2, minimumFractionDigits: v >= 1000 ? 0 : v < 1 ? 4 : 2 }).format(v)}
        </text>
      ))}
      {/* X labels */}
      {xLabels.map((lbl, i) => (
        <text key={`${lbl}-${i}`} x={PL + i * xStep} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">{lbl}</text>
      ))}
    </svg>
  );
}

/* ── Detail popup ── */
function TickerDetail({ ticker, onClose }: { ticker: TickerData; onClose: () => void }) {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const [period, setPeriod] = useState<Period>('7D');
  const up = ticker.changePct >= 0;
  const color = up ? '#4ade80' : '#f87171';

  const chartData = period === '7D' ? ticker.spark7d : period === '1M' ? ticker.hist1m : ticker.hist1y;
  const high = Math.max(...chartData);
  const low  = Math.min(...chartData);
  const pctChange = ((chartData[chartData.length-1] - chartData[0]) / chartData[0] * 100);
  const periodUp = pctChange >= 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', width: '100%', maxWidth: '340px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'mDetailIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '800', color: '#fff' }}>{tickerTitle(ticker, st)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{tickerSub(ticker, st, lang)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff' }}>
              {ticker.currency !== undefined ? ticker.currency : ''}{fmtPrice(ticker, lang)}
            </div>
            <div style={{ fontSize: '12px', color, fontWeight: '600' }}>
              {up ? '▲' : '▼'} {fmtPct(ticker.changePct, lang)}
            </div>
          </div>
          <button onClick={onClose} aria-label={t.games.close} className="modal-close" style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: 'var(--text3)', fontSize: '13px' }}>✕</button>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {(['7D','1M','1Y'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '5px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: '700',
              background: p === period ? `${periodUp ? '#4ade80' : '#f87171'}22` : 'rgba(255,255,255,0.05)',
              color: p === period ? (periodUp ? '#4ade80' : '#f87171') : 'var(--text3)',
              outline: p === period ? `1px solid ${periodUp ? '#4ade80' : '#f87171'}44` : 'none',
            }}>{periodLabel(p, lang)}</button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '8px 4px 4px', marginBottom: '10px' }}>
          <LineChart data={chartData} up={periodUp} label={period} lang={lang} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
          {[
            { label: st.high,    value: fmtVal(high, ticker, lang), change: false },
            { label: st.low,     value: fmtVal(low, ticker, lang), change: false },
            { label: `${st.changeOver} · ${periodLabel(period, lang)}`, value: fmtPct(pctChange, lang, true), change: true },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: s.change ? (pctChange >= 0 ? '#4ade80' : '#f87171') : '#fff' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <style>{`@keyframes mDetailIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}

/* ── Main component ── */
const TAB_ICONS: Record<Tab, string> = { indices: '📈', forex: '💱', commodities: '🏗️' };

function getTabLabels(t: Translations): Record<Tab, string> {
  return { indices: t.markets.tab_indices, forex: t.markets.tab_forex, commodities: t.markets.tab_commodities };
}

const EMPTY: Record<Tab, TickerData[]> = { indices: [], forex: [], commodities: [] };
const MARKETS_WATCHLIST_KEY = 'markets_watchlist_v1';

function loadMarketsWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(MARKETS_WATCHLIST_KEY) ?? '[]'); } catch { return []; }
}

function tickerKey(tab: Tab, symbol: string): string { return `${tab}:${symbol}`; }

export default function Markets() {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const TAB_LABELS = getTabLabels(t);
  const { listLimit } = useDeviceDetect();
  const [tab,     setTab]     = useState<Tab>('indices');
  const [base,    setBase]    = useState<Record<Tab, TickerData[]>>(EMPTY);
  const [data,    setData]    = useState<Record<Tab, TickerData[]>>(EMPTY);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [detail,  setDetail]  = useState<TickerData | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => { setWatchlist(loadMarketsWatchlist()); }, []);

  function toggleWatch(key: string) {
    setWatchlist(prev => {
      const next = prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key];
      try { localStorage.setItem(MARKETS_WATCHLIST_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    fetch('/api/markets')
      .then(r => r.json())
      .then((d: Record<Tab, TickerData[]>) => { setBase(d); setData(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!base.indices.length) return;
    function tick() {
      setData(prev => {
        const next = { ...prev };
        (Object.keys(next) as Tab[]).forEach(tabId => {
          next[tabId] = next[tabId].map(ticker => {
            const seed = base[tabId].find(s => s.symbol === ticker.symbol);
            if (!seed) return ticker;
            const newPrice = Math.max(0.0001, jitter(ticker.price, 0.0008));
            const change    = newPrice - seed.price;
            const changePct = (change / seed.price) * 100;
            return { ...ticker, price: newPrice, change: +change.toFixed(4), changePct: +changePct.toFixed(2) };
          });
        });
        return next;
      });
      setUpdated(new Date());
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [base]);

  const tickers = isFinite(listLimit) ? data[tab].slice(0, listLimit) : data[tab];

  const allTickers = useMemo(() =>
    (Object.keys(data) as Tab[]).flatMap(tabId => data[tabId].map(tk => ({ tab: tabId, ticker: tk }))),
    [data]
  );
  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...allTickers].sort((a, b) => b.ticker.changePct - a.ticker.changePct);
    return { topGainers: sorted.slice(0, 3), topLosers: sorted.slice(-3).reverse() };
  }, [allTickers]);
  const watchedTickers = useMemo(() =>
    allTickers.filter(({ tab: tabId, ticker: tk }) => watchlist.includes(tickerKey(tabId, tk.symbol))),
    [allTickers, watchlist]
  );

  const hero = (detail && data[tab].find(x => x.symbol === detail.symbol)) || data[tab][0] || null;
  const heroUp = (hero?.changePct ?? 0) >= 0;

  return (
    <ToolFrame toolId="trhy" wide>
      <div className="tf-chips">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tabId => (
          <button key={tabId} type="button" className={`tf-chip${tab === tabId ? ' is-on' : ''}`} aria-pressed={tab === tabId} onClick={() => setTab(tabId)}>
            {TAB_ICONS[tabId]} {TAB_LABELS[tabId]}
          </button>
        ))}
      </div>

      {hero ? (
        <ToolHero
          label={<span className="tf-keep">{tickerTitle(hero, st)} · {tickerSub(hero, st, lang)}</span>}
          value={<span dir="ltr">{hero.currency ?? ''}{fmtPrice(hero, lang)}</span>}
          sub={<span style={{ color: heroUp ? '#4ADE80' : '#F87171' }} dir="ltr">{heroUp ? '▲' : '▼'} {fmtPct(hero.changePct, lang)}{updated && <span style={{ color: 'var(--tf-dim)' }}> · 🕐 {updated.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}</span>}
        />
      ) : <div className="mk-skel" />}

      <div className="tf-panel">
      {/* Watchlist */}
      {watchedTickers.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.markets.watchlist}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {watchedTickers.map(({ ticker: tk }) => {
              const up = tk.changePct >= 0;
              return (
                <div key={tickerKey(tab, tk.symbol)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', borderRadius: '10px', padding: '6px 10px' }}>
                  <span style={{ color: '#FFB300' }}>★</span>
                  <span style={{ flex: 1, fontSize: '12px', color: '#fff', fontWeight: '500' }}>{tickerTitle(tk, st)}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: up ? '#4ade80' : '#f87171' }}>
                    {up ? '▲' : '▼'} {fmtPct(tk.changePct, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Biggest movers (across all tabs) */}
      {allTickers.length >= 3 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.markets.biggestMovers}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#4ade80', marginBottom: '4px' }}>▲ {t.markets.topGainers}</div>
              {topGainers.map(({ ticker: tk }) => (
                <div key={tk.symbol} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                  <span style={{ color: '#fff' }}>{tickerTitle(tk, st)}</span>
                  <span style={{ color: '#4ade80', fontWeight: '600' }}>{fmtPct(tk.changePct, lang, true)}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#f87171', marginBottom: '4px' }}>▼ {t.markets.topLosers}</div>
              {topLosers.map(({ ticker: tk }) => (
                <div key={tk.symbol} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                  <span style={{ color: '#fff' }}>{tickerTitle(tk, st)}</span>
                  <span style={{ color: '#f87171', fontWeight: '600' }}>{fmtPct(tk.changePct, lang, true)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ticker list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tickers.map(ticker => {
          const up    = ticker.changePct >= 0;
          const color = up ? '#4ade80' : '#f87171';
          const wKey  = tickerKey(tab, ticker.symbol);
          const isWatched = watchlist.includes(wKey);
          return (
            <div key={ticker.symbol} onClick={() => setDetail(ticker)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              padding: '.45rem .75rem', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(93,76,255,0.08)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'}
            >
              {/* Watchlist star */}
              <button className="icon-btn"
                onClick={e => { e.stopPropagation(); toggleWatch(wKey); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: isWatched ? '#FFB300' : 'var(--text3)', padding: 0, flexShrink: 0 }}
              >{isWatched ? '★' : '☆'}</button>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', lineHeight: 1.2 }}>{tickerTitle(ticker, st)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>{tickerSub(ticker, st, lang)}</div>
              </div>

              {/* Sparkline */}
              {ticker.spark7d.length > 1 && <Sparkline data={ticker.spark7d} up={up} />}

              {/* Price + change */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  {ticker.currency !== undefined ? ticker.currency : ''}{fmtPrice(ticker, lang)}
                </div>
                <div style={{ fontSize: '12px', color, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                  <span>{up ? '▲' : '▼'}</span>
                  <span>{fmtPct(ticker.changePct, lang)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '.75rem', fontSize: '12px', color: 'var(--text3)', textAlign: 'center' }}>
        {t.markets.simulatedNote}
      </div>

      </div>
      {detail && <TickerDetail ticker={detail} onClose={() => setDetail(null)} />}
      <style>{`.mk-skel { height: 170px; border-radius: 22px; background: rgba(255,255,255,0.04); }`}</style>
    </ToolFrame>
  );
}
