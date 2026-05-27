'use client';

import { useState, useEffect } from 'react';

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
  { name: 'Llama 3 70B',       provider: 'Meta',       providerColor: '#0064E0', score: 82, mmlu: 82.0, priceIn: 0,    priceOut: 0,    context: '8K',   contextK: 8,    released: 'Apr 2024', releasedTs: 2024.30, badge: 'Open Source' },
  { name: 'Mistral Large',     provider: 'Mistral AI', providerColor: '#FF7000', score: 81, mmlu: 81.2, priceIn: 8,    priceOut: 24,   context: '32K',  contextK: 32,   released: 'Feb 2024', releasedTs: 2024.12 },
  { name: 'Claude 3 Haiku',    provider: 'Anthropic',  providerColor: '#D97757', score: 78, mmlu: 75.2, priceIn: 0.25, priceOut: 1.25, context: '200K', contextK: 200,  released: 'Mar 2024', releasedTs: 2024.25, badge: '⚡ Rychlý' },
  { name: 'Gemini 1.5 Flash',  provider: 'Google',     providerColor: '#4285F4', score: 77, mmlu: 78.9, priceIn: 0.35, priceOut: 1.05, context: '1M',   contextK: 1000, released: 'May 2024', releasedTs: 2024.42, badge: '⚡ Rychlý' },
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

function fmtUSD(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return n.toLocaleString();
}
function shortName(raw: string) {
  return raw.replace(/, Inc\.?$| Inc$| Corp\.?$| Corporation$/i, '').trim();
}

const CARD: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  padding: '1.25rem',
  boxShadow: 'var(--card-shadow)',
};

const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'score',    label: 'Skóre'   },
  { key: 'price_in', label: 'Cena'    },
  { key: 'context',  label: 'Kontext' },
  { key: 'date',     label: 'Datum'   },
];

/* ═══════════════════════ AI TAB ═══════════════════════ */

function AIModelsTab() {
  const [sort, setSort] = useState<SortKey>('score');

  const sorted = [...AI_MODELS].sort((a, b) => {
    if (sort === 'score')    return b.score - a.score;
    if (sort === 'price_in') return a.priceIn - b.priceIn;
    if (sort === 'context')  return b.contextK - a.contextK;
    return b.releasedTs - a.releasedTs;
  });

  return (
    <div>
      {/* Sort bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '2px' }}>Řadit:</span>
        {SORT_OPTS.map(o => (
          <button key={o.key} onClick={() => setSort(o.key)} style={{
            background: sort === o.key ? 'rgba(93,76,255,0.2)' : 'rgba(255,255,255,0.04)',
            border: sort === o.key ? '1px solid rgba(93,76,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px', fontSize: '11px', padding: '3px 10px', cursor: 'pointer',
            color: sort === o.key ? 'var(--purple3)' : 'var(--text3)',
          }}>{o.label}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 52px 80px 54px', gap: '6px', padding: '0 10px 6px', fontSize: '10px', color: 'var(--text3)' }}>
        <span>#</span><span>Model</span>
        <span style={{ textAlign: 'center' }}>Skóre</span>
        <span style={{ textAlign: 'center' }}>Cena /1M</span>
        <span style={{ textAlign: 'center' }}>Kontext</span>
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
                  <span style={{ fontSize: '9px', color: 'var(--amber)', background: 'rgba(255,179,0,0.12)', borderRadius: '4px', padding: '1px 5px' }}>{m.badge}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: m.providerColor, background: m.providerColor + '22', borderRadius: '4px', padding: '1px 5px' }}>{m.provider}</span>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>MMLU {m.mmlu}%</span>
                <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{m.released}</span>
              </div>
              {/* Score bar */}
              <div style={{ marginTop: '5px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)' }}>
                <div style={{ height: '100%', width: `${m.score}%`, borderRadius: '2px', background: 'linear-gradient(90deg, var(--purple), var(--blue2))' }} />
              </div>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: '600', fontFamily: 'Poppins', color: '#fff' }}>{m.score}</div>

            {/* Price */}
            <div style={{ textAlign: 'center' }}>
              {m.priceIn === 0 ? (
                <span style={{ fontSize: '11px', color: 'var(--green2)', fontWeight: '600' }}>Zdarma</span>
              ) : (
                <>
                  <div style={{ fontSize: '11px', color: 'var(--green2)' }}>${m.priceIn} in</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>${m.priceOut} out</div>
                </>
              )}
            </div>

            {/* Context */}
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--blue2)' }}>{m.context}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
        Statická data · Composite score (MMLU, HumanEval, Chatbot Arena ELO)
      </div>
    </div>
  );
}

/* ═══════════════════════ STOCKS TAB ═══════════════════════ */

function StocksTab() {
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
          {source === 'alphavantage' ? 'Alpha Vantage (záloha)' : source === 'yahoo' ? 'Yahoo Finance · denní data' : 'Yahoo Finance · denní data'}
        </span>
        <button onClick={loadAll} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'var(--text3)', fontSize: '12px', padding: '3px 8px', cursor: 'pointer' }}>↺</button>
      </div>

      {allError && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px', fontSize: '12px', color: 'var(--text2)' }}>
          ⚠️ Yahoo Finance blokuje přímé požadavky (CORS).
          {!hasAlphaKey
            ? <> Nastav <code style={{ color: 'var(--purple3)' }}>NEXT_PUBLIC_ALPHA_VANTAGE_KEY</code> pro záložní data z Alpha Vantage.</>
            : <> Zkouším Alpha Vantage zálohu…</>}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 72px 68px 52px', gap: '6px', padding: '0 10px 6px', fontSize: '10px', color: 'var(--text3)' }}>
        <span>#</span><span>Akcie</span>
        <span style={{ textAlign: 'right' }}>Cena</span>
        <span style={{ textAlign: 'right' }}>Změna</span>
        <span style={{ textAlign: 'right' }}>Objem</span>
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
              <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>{idx + 1}</div>

              {/* Name + bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: '700', color, background: color + '22', borderRadius: '4px', padding: '1px 5px', flexShrink: 0 }}>{symbol}</span>
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
                    <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '3px' }}>
                      52T ${fmtUSD(data.weekLow)} – ${fmtUSD(data.weekHigh)}
                    </div>
                  </>
                )}
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right' }}>
                {state === 'loading' && <div style={{ height: '14px', width: '52px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginLeft: 'auto', animation: 'shimmer 1.5s infinite' }} />}
                {state === 'error'   && <span style={{ color: '#EF4444', fontSize: '11px' }}>–</span>}
                {state === 'ok' && data && <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff' }}>${fmtUSD(data.price)}</span>}
              </div>

              {/* Change */}
              <div style={{ textAlign: 'right' }}>
                {state === 'loading' && <div style={{ height: '12px', width: '40px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', marginLeft: 'auto', marginTop: '3px', animation: 'shimmer 1.5s infinite' }} />}
                {state === 'ok' && data && (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: cc }}>{up ? '+' : ''}{fmtUSD(data.changePct)}%</div>
                    <div style={{ fontSize: '10px', color: cc, opacity: 0.8 }}>{up ? '+' : ''}{fmtUSD(data.change)}</div>
                  </>
                )}
              </div>

              {/* Volume */}
              <div style={{ textAlign: 'right' }}>
                {state === 'loading' && <div style={{ height: '10px', width: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginLeft: 'auto', animation: 'shimmer 1.5s infinite' }} />}
                {state === 'ok' && data && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{fmtVol(data.volume)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ MUSIC TAB ═══════════════════════ */

function MusicTab() {
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Apple iTunes · Most Played US</span>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'var(--text3)', fontSize: '12px', padding: '3px 8px', cursor: 'pointer' }}>↺</button>
      </div>

      {state === 'loading' && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text3)', fontSize: '13px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎵</div>Načítám žebříček…
        </div>
      )}

      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>Nepodařilo se načíst žebříček.</div>
          <button onClick={load} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '7px 16px', cursor: 'pointer' }}>Zkusit znovu</button>
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
                  {t.rank <= 3 ? MEDALS[t.rank - 1] : t.rank}
                </div>

                {/* Artwork */}
                {t.artwork ? (
                  <img src={t.artwork} alt="" width={42} height={42} style={{ borderRadius: '7px', flexShrink: 0, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: '7px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎵</div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                    {t.explicit && <span style={{ fontSize: '8px', color: 'var(--text3)', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0 }}>E</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{t.artist}</div>
                  {t.genre && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{t.genre}</div>}
                </div>

                <span style={{ color: 'var(--text3)', fontSize: '12px', flexShrink: 0 }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
        Zdroj: Apple iTunes RSS · Last.fm: vyžaduje API klíč (registrace zdarma na last.fm/api)
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN ═══════════════════════ */

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'ai',     label: 'AI Modely', emoji: '🤖' },
  { id: 'stocks', label: 'Akcie',     emoji: '📈' },
  { id: 'music',  label: 'Hudba',     emoji: '🎵' },
];

export default function Rankings() {
  const [tab, setTab] = useState<TabId>('ai');

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, cursor: 'pointer', fontWeight: '500', fontSize: '12px',
    padding: '7px 4px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    background: active ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.05)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
    color: active ? '#fff' : 'var(--text2)',
  });

  return (
    <div style={CARD}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        🏅 Žebříčky
      </h2>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tabBtn(tab === t.id)}>
            <span>{t.emoji}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'ai'     && <AIModelsTab />}
      {tab === 'stocks' && <StocksTab />}
      {tab === 'music'  && <MusicTab />}
    </div>
  );
}
