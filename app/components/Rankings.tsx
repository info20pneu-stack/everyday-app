'use client';

import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useLang } from '../../lib/LanguageContext';
import { fmtNumber } from '../../lib/formatNumber';
import { toolStrings, type ToolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolHero } from './tools/ToolFrame';

/* ═══════════════════════ TYPES ═══════════════════════ */

type TabId = 'ai' | 'stocks' | 'music';
type FetchState = 'loading' | 'ok' | 'error';
type SortKey = 'score' | 'price_in' | 'context' | 'date';

type AIModel = {
  name: string;
  provider: string;
  providerColor: string;
  score: number;
  mmlu: number;
  priceIn: number;
  priceOut: number;
  context: string;
  contextK: number;
  released: string;
  releasedTs: number;
  badge?: string;
};

type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  weekHigh: number;
  weekLow: number;
  volume: number;
};

type StockEntry = { data: Stock | null; state: FetchState };

type Track = {
  rank: number;
  name: string;
  artist: string;
  artwork: string;
  genre: string;
  explicit: boolean;
  url: string;
};

/* ═══════════════════════ AI MODELS (static) ═══════════════════════ */

const AI_MODELS: AIModel[] = [
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic',  providerColor: '#D97757', score: 92, mmlu: 88.7, priceIn: 3,    priceOut: 15,   context: '200K', contextK: 200,  released: 'Apr 2024', releasedTs: 2024.30, badge: '🏆' },
  { name: 'GPT-4o',            provider: 'OpenAI',     providerColor: '#10A37F', score: 90, mmlu: 88.7, priceIn: 5,    priceOut: 15,   context: '128K', contextK: 128,  released: 'May 2024', releasedTs: 2024.42 },
  { name: 'Gemini 1.5 Pro',    provider: 'Google',     providerColor: '#4285F4', score: 86, mmlu: 85.9, priceIn: 3.5,  priceOut: 10.5, context: '1M',   contextK: 1000, released: 'Feb 2024', releasedTs: 2024.12 },
  { name: 'GPT-4 Turbo',       provider: 'OpenAI',     providerColor: '#10A37F', score: 84, mmlu: 86.4, priceIn: 10,   priceOut: 30,   context: '128K', contextK: 128,  released: 'Nov 2023', releasedTs: 2023.83 },
  { name: 'Llama 3 70B',       provider: 'Meta',       providerColor: '#0064E0', score: 82, mmlu: 82.0, priceIn: 0,    priceOut: 0,    context: '8K',   contextK: 8,    released: 'Apr 2024', releasedTs: 2024.30, badge: 'open' },
  { name: 'Mistral Large',     provider: 'Mistral AI', providerColor: '#FF7000', score: 81, mmlu: 81.2, priceIn: 8,    priceOut: 24,   context: '32K',  contextK: 32,   released: 'Feb 2024', releasedTs: 2024.12 },
  { name: 'Claude 3 Haiku',    provider: 'Anthropic',  providerColor: '#D97757', score: 78, mmlu: 75.2, priceIn: 0.25, priceOut: 1.25, context: '200K', contextK: 200,  released: 'Mar 2024', releasedTs: 2024.25, badge: 'fast' },
  { name: 'Gemini 1.5 Flash',  provider: 'Google',     providerColor: '#4285F4', score: 77, mmlu: 78.9, priceIn: 0.35, priceOut: 1.05, context: '1M',   contextK: 1000, released: 'May 2024', releasedTs: 2024.42, badge: 'fast' },
];

/* ═══════════════════════ STOCK CONFIG ═══════════════════════ */

const STOCK_SYMBOLS = [
  { symbol: 'AAPL',  name: 'Apple',     color: '#A2AAAD' },
  { symbol: 'NVDA',  name: 'Nvidia',    color: '#76B900' },
  { symbol: 'MSFT',  name: 'Microsoft', color: '#0078D4' },
  { symbol: 'GOOGL', name: 'Alphabet',  color: '#EA4335' },
  { symbol: 'AMZN',  name: 'Amazon',    color: '#FF9900' },
  { symbol: 'META',  name: 'Meta',      color: '#0668E1' },
  { symbol: 'TSLA',  name: 'Tesla',     color: '#E31937' },
  { symbol: 'NFLX',  name: 'Netflix',   color: '#E50914' },
  { symbol: 'AMD',   name: 'AMD',       color: '#ED1C24' },
  { symbol: 'BRK-B', name: 'Berkshire', color: '#888888' },
];

async function fetchStock(symbol: string): Promise<Stock> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const meta = result.meta;
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const valid = closes.filter((c): c is number => c !== null);
  const prevClose = valid.length >= 2 ? valid[valid.length - 2] : meta.regularMarketPrice;
  const price: number = meta.regularMarketPrice;
  const change = price - prevClose;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
  return {
    symbol: meta.symbol,
    name: meta.shortName || meta.longName || symbol,
    price, change, changePct,
    dayHigh:  meta.regularMarketDayHigh ?? price,
    dayLow:   meta.regularMarketDayLow  ?? price,
    weekHigh: meta.fiftyTwoWeekHigh     ?? price,
    weekLow:  meta.fiftyTwoWeekLow      ?? price,
    volume:   meta.regularMarketVolume  ?? 0,
  };
}

async function fetchStockAlphaVantage(symbol: string): Promise<Stock> {
  const key = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('no-key');
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const q = json['Global Quote'];
  if (!q?.['05. price']) throw new Error('No data');
  const price      = parseFloat(q['05. price']);
  const change     = parseFloat(q['09. change']);
  const changePct  = parseFloat((q['10. change percent'] ?? '0').replace('%', ''));
  const dayHigh    = parseFloat(q['03. high']);
  const dayLow     = parseFloat(q['04. low']);
  const volume     = parseInt(q['06. volume']);
  const prevClose  = parseFloat(q['08. previous close']);
  return {
    symbol: q['01. symbol'] ?? symbol,
    name: STOCK_SYMBOLS.find(s => s.symbol === symbol)?.name ?? symbol,
    price, change, changePct,
    dayHigh, dayLow,
    weekHigh: Math.max(price, prevClose) * 1.05,
    weekLow:  Math.min(price, prevClose) * 0.95,
    volume,
  };
}

async function fetchTracks(): Promise<Track[]> {
  const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.feed?.results ?? []).map((r: any, i: number): Track => ({
    rank: i + 1,
    name: r.name ?? '—',
    artist: r.artistName ?? '—',
    artwork: (r.artworkUrl100 ?? '').replace('100x100bb', '60x60bb'),
    genre: r.genres?.[0]?.name ?? '',
    explicit: r.contentAdvisoryRating === 'Explicit',
    url: r.url ?? '#',
  }));
}

/* ═══════════════════════ HELPERS ═══════════════════════ */

function fmtUSD(n: number, lang: string, dec = 2) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
}
function fmtNum(n: number, lang: string, dec = 2) {
  return new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec, signDisplay: 'exceptZero' }).format(n);
}
function fmtVol(n: number, lang: string) {
  return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
/** "Apr 2024" → "dub 2024" in the UI language. */
function fmtReleased(released: string, lang: string) {
  const d = new Date(`1 ${released}`);
  return isNaN(d.getTime()) ? released : d.toLocaleDateString(lang, { month: 'short', year: 'numeric' });
}
function badgeText(badge: string, st: ToolStrings) {
  return badge === 'open' ? st.rkOpenSource : badge === 'fast' ? st.rkFast : badge;
}
function shortName(raw: string) {
  return raw.replace(/, Inc\.?$| Inc$| Corp\.?$| Corporation$/i, '').trim();
}

function sortOpts(st: ToolStrings): { key: SortKey; label: string }[] {
  return [
    { key: 'score',    label: st.rkScore },
    { key: 'price_in', label: st.rkPrice },
    { key: 'context',  label: st.rkContext },
    { key: 'date',     label: st.rkDate },
  ];
}

/* ═══════════════════════ AI TAB ═══════════════════════ */

const AIModelsTab = memo(function AIModelsTab() {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const [sort, setSort] = useState<SortKey>('score');
  const top = AI_MODELS.reduce((a, b) => (b.score > a.score ? b : a));

  const sorted = [...AI_MODELS].sort((a, b) => {
    if (sort === 'score')    return b.score - a.score;
    if (sort === 'price_in') return a.priceIn - b.priceIn;
    if (sort === 'context')  return b.contextK - a.contextK;
    return b.releasedTs - a.releasedTs;
  });

  return (
    <>
      <ToolHero label={`🏆 ${st.rkTop} · ${top.provider}`} value={fmtNumber(top.score, lang)} sub={top.name} />
      <div className="tf-panel">
      {/* Sort bar */}
      <div className="tf-chips" style={{ alignItems: 'center' }}>
        <span className="tf-label">{t.worldTime.sort}</span>
        {sortOpts(st).map(o => (
          <button key={o.key} type="button" className={`tf-chip${sort === o.key ? ' is-on' : ''}`} aria-pressed={sort === o.key} onClick={() => setSort(o.key)}>{o.label}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 52px 80px 54px', gap: '6px', padding: '0 10px 6px', fontSize: '12px', color: 'var(--text3)' }}>
        <span>#</span><span>{st.rkModel}</span>
        <span style={{ textAlign: 'center' }}>{st.rkScore}</span>
        <span style={{ textAlign: 'center' }}>{st.rkPrice1M}</span>
        <span style={{ textAlign: 'center' }}>{st.rkContext}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sorted.map((m, i) => (
          <div key={m.name} style={{
            display: 'grid', gridTemplateColumns: '22px 1fr 52px 80px 54px',
            gap: '6px', alignItems: 'center',
            background: i === 0 ? 'rgba(93,76,255,0.08)' : 'rgba(255,255,255,0.02)',
            border: i === 0 ? '1px solid rgba(93,76,255,0.22)' : '1px solid rgba(255,255,255,0.04)',
            borderRadius: '10px', padding: '10px',
          }}>
            {/* Rank */}
            <div style={{ fontSize: '12px', fontWeight: '700', color: i < 3 ? 'var(--purple3)' : 'var(--text3)' }}>{i + 1}</div>

            {/* Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{m.name}</span>
                {m.badge && (
                  <span style={{ fontSize: '12px', color: 'var(--amber)', background: 'rgba(255,179,0,0.12)', borderRadius: '4px', padding: '1px 5px' }}>{badgeText(m.badge, st)}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: m.providerColor, background: m.providerColor + '22', borderRadius: '4px', padding: '1px 5px' }}>{m.provider}</span>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>MMLU {new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 }).format(m.mmlu / 100)}</span>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtReleased(m.released, lang)}</span>
              </div>
              {/* Score bar */}
              <div style={{ marginTop: '5px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)' }}>
                <div style={{ height: '100%', width: `${m.score}%`, borderRadius: '2px', background: 'linear-gradient(90deg, var(--purple), var(--blue2))' }} />
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: '600', fontFamily: 'Poppins', color: '#fff' }}>{fmtNumber(m.score, lang)}</div>

            {/* Price */}
            <div style={{ textAlign: 'center' }}>
              {m.priceIn === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--green2)', fontWeight: '600' }}>{st.rkFree}</span>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--green2)' }}>{fmtUSD(m.priceIn, lang, m.priceIn % 1 ? 2 : 0)} {st.rkIn}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtUSD(m.priceOut, lang, m.priceOut % 1 ? 2 : 0)} {st.rkOut}</div>
                </>
              )}
            </div>

            {/* Context */}
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--blue2)' }}>{m.context}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
        {st.rkAiNote}
      </div>
      </div>
    </>
  );
});

/* ═══════════════════════ STOCKS TAB ═══════════════════════ */

const StocksTab = memo(function StocksTab() {
  const { lang } = useLang();
  const st = toolStrings(lang);
  const initial = Object.fromEntries(
    STOCK_SYMBOLS.map(s => [s.symbol, { data: null, state: 'loading' as FetchState }])
  ) as Record<string, StockEntry>;

  const [stocks, setStocks] = useState<Record<string, StockEntry>>(initial);
  const [source, setSource] = useState<'yahoo' | 'alphavantage' | 'none'>('none');

  async function loadAll() {
    setStocks(Object.fromEntries(
      STOCK_SYMBOLS.map(s => [s.symbol, { data: null, state: 'loading' }])
    ));
    const hasAlphaKey = !!process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;
    let usedSource: 'yahoo' | 'alphavantage' | 'none' = 'none';

    await Promise.allSettled(
      STOCK_SYMBOLS.map(async ({ symbol }, idx) => {
        try {
          const data = await fetchStock(symbol);
          usedSource = 'yahoo';
          setStocks(prev => ({ ...prev, [symbol]: { data, state: 'ok' } }));
        } catch {
          if (!hasAlphaKey) {
            setStocks(prev => ({ ...prev, [symbol]: { data: null, state: 'error' } }));
            return;
          }
          // Alpha Vantage fallback — stagger requests to stay under 5 req/min
          await new Promise(r => setTimeout(r, idx * 250));
          try {
            const data = await fetchStockAlphaVantage(symbol);
            usedSource = 'alphavantage';
            setStocks(prev => ({ ...prev, [symbol]: { data, state: 'ok' } }));
          } catch {
            setStocks(prev => ({ ...prev, [symbol]: { data: null, state: 'error' } }));
          }
        }
      })
    );
    setSource(usedSource);
  }

  useEffect(() => { loadAll(); }, []);

  const allError = STOCK_SYMBOLS.every(s => stocks[s.symbol]?.state === 'error');
  const hasAlphaKey = !!process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY;

  const loaded = STOCK_SYMBOLS.map(s => stocks[s.symbol]?.data).filter((d): d is Stock => !!d);
  const best = loaded.length ? loaded.reduce((a, b) => (b.changePct > a.changePct ? b : a)) : null;

  return (
    <>
      {best && (
        <ToolHero label={`📈 ${st.rkTop} · ${best.symbol}`} value={<span dir="ltr">{fmtNum(best.changePct, lang)} %</span>}
          sub={<>{shortName(best.name)} · <span dir="ltr">{fmtUSD(best.price, lang)}</span></>} />
      )}
      <div className="tf-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tf-label">{source === 'alphavantage' ? st.rkAlpha : st.rkYahoo}</span>
        <button type="button" className="tf-chip" onClick={loadAll} aria-label={st.refresh} title={st.refresh}>↺</button>
      </div>

      {allError && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--text2)' }}>
          ⚠️ {st.rkCors} {!hasAlphaKey ? st.rkCorsKey : st.rkCorsTrying}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 72px 68px 52px', gap: '6px', padding: '0 10px 6px', fontSize: '12px', color: 'var(--text3)' }}>
        <span>#</span><span>{st.rkStock}</span>
        <span style={{ textAlign: 'end' }}>{st.rkPrice}</span>
        <span style={{ textAlign: 'end' }}>{st.rkChange}</span>
        <span style={{ textAlign: 'end' }}>{st.rkVolume}</span>
      </div>

      <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {STOCK_SYMBOLS.map(({ symbol, name, color }, idx) => {
          const { data, state } = stocks[symbol] ?? { data: null, state: 'loading' };
          const up = data ? data.change >= 0 : null;
          const cc = up === null ? 'var(--text3)' : up ? 'var(--green2)' : '#EF4444';

          return (
            <div key={symbol} style={{
              display: 'grid', gridTemplateColumns: '22px 1fr 72px 68px 52px',
              gap: '6px', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '10px', padding: '9px 10px',
            }}>
              {/* Rank */}
              <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>{idx + 1}</div>

              {/* Name + bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color, background: color + '22', borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>{symbol}</span>
                  <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {data ? shortName(data.name) : name}
                  </span>
                </div>
                {data && data.weekHigh > data.weekLow && (
                  <>
                    <div style={{ marginTop: '5px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', position: 'relative', overflow: 'visible' }}>
                      <div style={{ position: 'absolute', top: '-1px', left: `${((data.price - data.weekLow) / (data.weekHigh - data.weekLow)) * 100}%`, transform: 'translateX(-50%)', width: '5px', height: '5px', borderRadius: '50%', background: cc }} />
                      <div style={{ height: '100%', width: `${((data.price - data.weekLow) / (data.weekHigh - data.weekLow)) * 100}%`, background: 'rgba(255,255,255,0.12)', borderRadius: '2px' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>
                      {st.rk52w} <span dir="ltr">{fmtUSD(data.weekLow, lang)} – {fmtUSD(data.weekHigh, lang)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right' }}>
                {state === 'loading' && <div style={{ height: '14px', width: '52px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginLeft: 'auto', animation: 'shimmer 1.5s infinite' }} />}
                {state === 'error'   && <span style={{ color: '#EF4444', fontSize: '12px' }}>–</span>}
                {state === 'ok' && data && <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff' }} dir="ltr">{fmtUSD(data.price, lang)}</span>}
              </div>

              {/* Change */}
              <div style={{ textAlign: 'right' }}>
                {state === 'loading' && <div style={{ height: '12px', width: '40px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', marginLeft: 'auto', marginTop: '3px', animation: 'shimmer 1.5s infinite' }} />}
                {state === 'ok' && data && (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: cc }} dir="ltr">{fmtNum(data.changePct, lang)} %</div>
                    <div style={{ fontSize: '12px', color: cc, opacity: 0.8 }} dir="ltr">{fmtNum(data.change, lang)}</div>
                  </>
                )}
              </div>

              {/* Volume */}
              <div style={{ textAlign: 'right' }}>
                {state === 'loading' && <div style={{ height: '10px', width: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginLeft: 'auto', animation: 'shimmer 1.5s infinite' }} />}
                {state === 'ok' && data && <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{fmtVol(data.volume, lang)}</span>}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
});

/* ═══════════════════════ MUSIC TAB ═══════════════════════ */

const MusicTab = memo(function MusicTab() {
  const { lang } = useLang();
  const st = toolStrings(lang);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [state, setState] = useState<FetchState>('loading');

  async function load() {
    setState('loading');
    try {
      setTracks(await fetchTracks());
      setState('ok');
    } catch {
      setState('error');
    }
  }

  useEffect(() => { load(); }, []);

  const MEDALS = ['🥇', '🥈', '🥉'];

  const first = tracks[0];

  return (
    <>
      {state === 'ok' && first && (
        <ToolHero label={`🥇 ${st.rkTop} · ${st.rkMusic}`} value={<span className="rk-song">{first.name}</span>} sub={first.artist} />
      )}
      <div className="tf-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tf-label">{st.rkMusicSource}</span>
        <button type="button" className="tf-chip" onClick={load} aria-label={st.refresh} title={st.refresh}>↺</button>
      </div>

      {state === 'loading' && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text3)', fontSize: '13px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎵</div>{st.rkLoadingChart}
        </div>
      )}

      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>{st.rkChartFailed}</div>
          <ToolButton onClick={load}>{st.rkRetry}</ToolButton>
        </div>
      )}

      {state === 'ok' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tracks.map(t => (
            <a key={t.rank} href={t.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              >
                {/* Rank */}
                <div style={{ fontSize: t.rank <= 3 ? '18px' : '12px', fontWeight: '700', color: 'var(--text3)', minWidth: '22px', textAlign: 'center', fontFamily: 'Poppins' }}>
                  {t.rank <= 3 ? MEDALS[t.rank - 1] : fmtNumber(t.rank, lang)}
                </div>

                {/* Artwork */}
                {t.artwork ? (
                  <Image src={t.artwork} alt="" width={42} height={42} unoptimized loading="lazy" style={{ borderRadius: '7px', flexShrink: 0, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: '7px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎵</div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    {t.explicit && <span style={{ fontSize: '12px', color: 'var(--text3)', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0 }}>E</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{t.artist}</div>
                  {t.genre && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '1px' }}>{t.genre}</div>}
                </div>

                <span style={{ color: 'var(--text3)', fontSize: '12px', flexShrink: 0 }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
        {st.rkMusicNote}
      </div>
      </div>
    </>
  );
});

/* ═══════════════════════ MAIN ═══════════════════════ */

export default function Rankings() {
  const { lang } = useLang();
  const st = toolStrings(lang);
  const [tab, setTab] = useState<TabId>('ai');
  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: 'ai',     label: st.rkAI,     emoji: '🤖' },
    { id: 'stocks', label: st.rkStocks, emoji: '📈' },
    { id: 'music',  label: st.rkMusic,  emoji: '🎵' },
  ];

  return (
    <ToolFrame toolId="zebricky" wide>
      <div className="tf-chips">
        {tabs.map(tb => (
          <button key={tb.id} type="button" className={`tf-chip${tab === tb.id ? ' is-on' : ''}`} aria-pressed={tab === tb.id} onClick={() => setTab(tb.id)}>
            {tb.emoji} {tb.label}
          </button>
        ))}
      </div>

      {tab === 'ai'     && <AIModelsTab />}
      {tab === 'stocks' && <StocksTab />}
      {tab === 'music'  && <MusicTab />}

      <style>{`.rk-song { display: block; font: 800 clamp(22px, 6vw, 30px)/1.2 'Poppins', system-ui, sans-serif; text-wrap: balance; }`}</style>
    </ToolFrame>
  );
}
