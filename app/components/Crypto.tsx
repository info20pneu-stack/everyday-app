'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';
import { useLang } from '../../lib/LanguageContext';
import { fmtCompact, fmtNumber, fmtUnit } from '../../lib/formatNumber';
import { MYDAY_COIN_KEY, MYDAY_COINS, myDaySet, useMyDayRaw } from '../../lib/myDay';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolCard, ToolCards, ToolHero } from './tools/ToolFrame';

/* ═══════════════════════ TYPES ═══════════════════════ */

type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  sparkline_in_7d: { price: number[] } | null;
};

type FetchState = 'loading' | 'ok' | 'error' | 'rate-limit';
type DataSource = 'coingecko' | 'coincap';

/* ═══════════════════════ HELPERS ═══════════════════════ */

/** USD price in the UI language ("80 370 US$", "$80,370"), more decimals for cheap coins. */
function fmtPrice(n: number, lang: string): string {
  const digits = n >= 10000 ? 0 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** The price without the currency sign, for the big display (the unit is shown next to it). */
function fmtPriceNumber(n: number, lang: string): string {
  const digits = n >= 10000 ? 0 : n >= 1 ? 2 : n >= 0.01 ? 4 : 6;
  return new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** Large USD amounts shortened the language's way ("25,9 mld. US$", "$25.9B"). */
function fmtBig(n: number, lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function fmtPct(n: number, lang: string): string {
  return new Intl.NumberFormat(lang, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' }).format(n / 100);
}

/* ═══════════════════════ SPARKLINE ═══════════════════════ */

function Sparkline({ prices, positive, id }: { prices: number[]; positive: boolean; id: string }) {
  if (!prices || prices.length < 2) return <div style={{ width: 72, height: 28 }} />;

  // Sample down to ~50 points for clean rendering
  const step = Math.max(1, Math.floor(prices.length / 50));
  const pts = prices.filter((_, i) => i % step === 0);

  const W = 72, H = 28;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const coords = pts.map((p, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - ((p - min) / range) * (H - 2) - 1,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `M 0,${H} ${linePath.slice(1)} L ${W},${H} Z`;

  const color = positive ? '#22C55E' : '#EF4444';
  const gid = `cg-${id.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════ COIN ROW ═══════════════════════ */

const CoinRow = memo(function CoinRow({ coin, expanded, onToggle, showCharts, watched, onToggleWatch }: {
  coin: Coin;
  expanded: boolean;
  onToggle: () => void;
  showCharts: boolean;
  watched: boolean;
  onToggleWatch: () => void;
}) {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const positive = coin.price_change_percentage_24h >= 0;
  const cc = positive ? 'var(--green2)' : '#EF4444';
  const sp = coin.sparkline_in_7d?.price ?? [];

  return (
    <div>
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: showCharts
            ? '44px 24px 1fr 80px 60px 70px 76px'
            : '44px 1fr 80px 60px',
          gap: '6px',
          alignItems: 'center',
          background: expanded ? 'rgba(93,76,255,0.07)' : 'rgba(255,255,255,0.02)',
          border: expanded ? '1px solid rgba(93,76,255,0.22)' : '1px solid rgba(255,255,255,0.04)',
          borderRadius: expanded ? '10px 10px 0 0' : '10px',
          padding: '9px 10px',
          cursor: 'pointer',
        }}
      >
        {/* Watchlist star */}
        <button
          onClick={e => { e.stopPropagation(); onToggleWatch(); }}
          title={watched ? t.crypto.watchlist : t.crypto.watchlist}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: watched ? '#FFB300' : 'var(--text3)', padding: 0, width: '100%', height: '36px', margin: '-8px 0' }}
        >{watched ? '★' : '☆'}</button>

        {/* Rank — dropped on phones to keep the star a full touch target */}
        {showCharts && (
          <div style={{ fontSize: '12px', color: coin.market_cap_rank <= 3 ? 'var(--purple3)' : 'var(--text3)', fontWeight: '600', textAlign: 'center' }}>
            {coin.market_cap_rank}
          </div>
        )}

        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <Image
            src={coin.image}
            alt={coin.name}
            width={26}
            height={26}
            style={{ borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            loading="lazy"
            unoptimized={coin.image.includes('coincap')}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {coin.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase' }}>
              {coin.symbol}
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: '600', fontFamily: 'Poppins', color: '#fff' }}>
          {fmtPrice(coin.current_price, lang)}
        </div>

        {/* 24h % */}
        <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: '600', color: cc }}>
          {fmtPct(coin.price_change_percentage_24h, lang)}
        </div>

        {/* Market cap — hidden on mobile */}
        {showCharts && (
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text2)' }}>
            {fmtBig(coin.market_cap, lang)}
          </div>
        )}

        {/* Sparkline — hidden on mobile */}
        {showCharts && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Sparkline prices={sp} positive={positive} id={coin.id} />
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          background: 'rgba(93,76,255,0.04)',
          border: '1px solid rgba(93,76,255,0.22)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '10px 12px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { label: t.crypto.detail_high24h,    val: fmtPrice(coin.high_24h, lang) },
              { label: t.crypto.detail_low24h,     val: fmtPrice(coin.low_24h, lang) },
              { label: t.crypto.detail_change24h,  val: fmtPrice(Math.abs(coin.price_change_24h), lang), color: cc },
              { label: t.crypto.detail_volume24h,  val: fmtBig(coin.total_volume, lang) },
              { label: st.marketCap,  val: fmtBig(coin.market_cap, lang) },
              { label: t.crypto.detail_circulating, val: `${fmtCompact(coin.circulating_supply, lang)} ${coin.symbol.toUpperCase()}` },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '7px 9px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: color ?? '#fff' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Full 7d sparkline */}
          {sp.length > 0 && (
            <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>{t.crypto.detail_priceHistory}</div>
              <SparklineLarge prices={sp} positive={positive} id={coin.id + '-lg'} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════ LARGE SPARKLINE ═══════════════════════ */

const SparklineLarge = memo(function SparklineLarge({ prices, positive, id }: { prices: number[]; positive: boolean; id: string }) {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const step = Math.max(1, Math.floor(prices.length / 80));
  const pts = prices.filter((_, i) => i % step === 0);

  const W = 100, H = 48;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const coords = pts.map((p, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - ((p - min) / range) * (H - 4) - 2,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `M 0,${H} ${linePath.slice(1)} L ${W},${H} Z`;
  const color = positive ? '#22C55E' : '#EF4444';
  const gid = `cg-lg-${id.replace(/[^a-z0-9]/gi, '')}`;

  // X-axis labels (7 days)
  const dayLabels = [...[7, 6, 5, 4, 3, 2, 1].map(n => `−${fmtUnit(n, 'day', lang, 'narrow')}`), st.today];

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0"   />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        {dayLabels.map(d => (
          <span key={d} style={{ fontSize: '12px', color: 'var(--text3)' }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.crypto.detail_min} {fmtPrice(min, lang)}</span>
        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.crypto.detail_max} {fmtPrice(max, lang)}</span>
      </div>
    </div>
  );
});

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h';
const COINCAP_URL = 'https://api.coincap.io/v2/assets?limit=20';

function mapCoinCapToCoins(assets: any[]): Coin[] {
  return assets.map((a: any) => ({
    id: a.id,
    symbol: a.symbol.toLowerCase(),
    name: a.name,
    image: `https://assets.coincap.io/assets/icons/${a.symbol.toLowerCase()}@2x.png`,
    current_price: parseFloat(a.priceUsd) || 0,
    price_change_24h: 0,
    price_change_percentage_24h: parseFloat(a.changePercent24Hr) || 0,
    market_cap: parseFloat(a.marketCapUsd) || 0,
    market_cap_rank: parseInt(a.rank) || 0,
    total_volume: parseFloat(a.volumeUsd24Hr) || 0,
    high_24h: 0,
    low_24h: 0,
    circulating_supply: parseFloat(a.supply) || 0,
    sparkline_in_7d: null,
  }));
}

const WATCHLIST_KEY = 'crypto_watchlist_v1';

function loadWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]'); } catch { return []; }
}

export default function Crypto() {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const savedCoinRaw = useMyDayRaw(MYDAY_COIN_KEY);
  const savedCoin = (() => { try { return savedCoinRaw ? JSON.parse(savedCoinRaw) as string : null; } catch { return null; } })();
  const [heroId, setHeroId] = useState<string | null>(null);
  const { listLimit, showCharts, isMobile } = useDeviceDetect();
  const [coins, setCoins]       = useState<Coin[]>([]);
  const [state, setState]       = useState<FetchState>('loading');
  const [source, setSource]     = useState<DataSource>('coingecko');
  const [search, setSearch]     = useState('');
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => { setWatchlist(loadWatchlist()); }, []);

  const toggleWatch = useCallback((id: string) => {
    setWatchlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(COINGECKO_URL);
      if (res.status === 429) throw new Error('rate-limit');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Coin[] = await res.json();
      setCoins(data);
      setSource('coingecko');
      setLastUpdated(new Date());
      setState('ok');
    } catch (e: any) {
      // Fallback: CoinCap API
      try {
        const res2 = await fetch(COINCAP_URL);
        if (!res2.ok) throw new Error(`CoinCap HTTP ${res2.status}`);
        const data2 = await res2.json();
        setCoins(mapCoinCapToCoins(data2.data ?? []));
        setSource('coincap');
        setLastUpdated(new Date());
        setState('ok');
      } catch {
        setState(e.message === 'rate-limit' ? 'rate-limit' : 'error');
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    search.trim()
      ? coins.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.symbol.toLowerCase().includes(search.toLowerCase())
        )
      : coins,
    [coins, search]
  );

  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    return { topGainers: sorted.slice(0, 3), topLosers: sorted.slice(-3).reverse() };
  }, [coins]);

  const hero = coins.find(c => c.id === (heroId ?? savedCoin)) ?? coins[0] ?? null;
  const heroUp = (hero?.price_change_percentage_24h ?? 0) >= 0;

  return (
    <ToolFrame toolId="krypto" wide
      myDay={hero && MYDAY_COINS.some(c => c.id === hero.id) ? { saved: savedCoin === hero.id, onSave: () => myDaySet(MYDAY_COIN_KEY, hero.id) } : undefined}>
      {hero && state === 'ok' ? (
        <>
          <ToolHero
            label={<span className="cr-hero-label"><Image src={hero.image} alt="" width={20} height={20} unoptimized={hero.image.includes('coincap')} style={{ borderRadius: '50%' }} /> {hero.name} · <span className="tf-keep">{hero.symbol.toUpperCase()}</span></span>}
            value={<span dir="ltr">{fmtPriceNumber(hero.current_price, lang)}</span>}
            unit="USD"
            sub={<span style={{ color: heroUp ? '#4ADE80' : '#F87171' }} dir="ltr">{heroUp ? '▲' : '▼'} {fmtPct(hero.price_change_percentage_24h, lang)} · {st.change24h}</span>}
          />
          <ToolCards>
            <ToolCard icon="🏦" color="#F7931A" label={st.marketCap} value={fmtBig(hero.market_cap, lang)} />
            <ToolCard icon="🔄" color="#38BDF8" label={t.crypto.detail_volume24h} value={fmtBig(hero.total_volume, lang)} />
            <ToolCard icon="⬆️" color="#4ADE80" label={t.crypto.detail_high24h} value={fmtPrice(hero.high_24h, lang)} />
            <ToolCard icon="⬇️" color="#F87171" label={t.crypto.detail_low24h} value={fmtPrice(hero.low_24h, lang)} />
          </ToolCards>
        </>
      ) : state === 'loading' ? <div className="cr-skel" style={{ height: 170, borderRadius: 22 }} /> : null}

      <div className="tf-panel">
      {/* Search */}
      <div className="tf-row" style={{ alignItems: 'center' }}>
        <input type="search" className="tf-input" placeholder={t.crypto.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
        <button type="button" className="tf-chip" style={{ flex: '0 0 auto' }} onClick={load} aria-label={st.refresh} title={st.refresh}>↺</button>
      </div>
      {lastUpdated && <div className="tf-note" style={{ textAlign: 'start' }}>🕐 {lastUpdated.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}</div>}

      {/* Column headers */}
      {state === 'ok' && (
        <div style={{ display: 'grid', gridTemplateColumns: showCharts ? '44px 24px 1fr 80px 60px 70px 76px' : '44px 1fr 80px 60px', gap: '6px', padding: '0 10px 6px', fontSize: '12px', color: 'var(--text3)' }}>
          <span />
          {showCharts && <span style={{ textAlign: 'center' }}>#</span>}
          <span>{t.crypto.col_name}</span>
          <span style={{ textAlign: 'right' }}>{t.crypto.col_price}</span>
          <span style={{ textAlign: 'right' }}>{t.crypto.col_change24h}</span>
          {showCharts && <span style={{ textAlign: 'right' }}>{t.crypto.col_marketCap}</span>}
          {showCharts && <span style={{ textAlign: 'right' }}>{t.crypto.col_chart}</span>}
        </div>
      )}

      {/* Loading */}
      {state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: '44px', borderRadius: '10px',
              background: `rgba(255,255,255,${0.015 + (7 - i) * 0.003})`,
              animation: 'shimmer 1.5s infinite',
              animationDelay: `${i * 0.08}s`,
            }} />
          ))}
        </div>
      )}

      {/* Rate limit */}
      {state === 'rate-limit' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '4px' }}>{t.crypto.rateLimit}</div>
          <div style={{ color: 'var(--text3)', fontSize: '12px', marginBottom: '1rem' }}>{t.crypto.tryAgainMoment}</div>
          <ToolButton onClick={load}>{t.crypto.tryAgain}</ToolButton>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>{t.crypto.failedToLoad}</div>
          <ToolButton onClick={load}>{t.crypto.tryAgain}</ToolButton>
        </div>
      )}

      {/* Watchlist */}
      {state === 'ok' && watchlist.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.crypto.watchlist}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {coins.filter(c => watchlist.includes(c.id)).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', borderRadius: '10px', padding: '6px 10px' }}>
                <span style={{ color: '#FFB300' }}>★</span>
                <span style={{ flex: 1, fontSize: '12px', color: '#fff', fontWeight: '500' }}>{c.name}</span>
                <span style={{ fontSize: '12px', fontFamily: 'Poppins', color: '#fff' }}>{fmtPrice(c.current_price, lang)}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: c.price_change_percentage_24h >= 0 ? 'var(--green2)' : '#EF4444' }}>
                  {fmtPct(c.price_change_percentage_24h, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biggest movers */}
      {state === 'ok' && coins.length >= 3 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
            {t.crypto.biggestMovers}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--green2)', marginBottom: '4px' }}>▲ {t.crypto.topGainers}</div>
              {topGainers.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                  <span style={{ color: '#fff' }}>{c.symbol.toUpperCase()}</span>
                  <span style={{ color: 'var(--green2)', fontWeight: '600' }}>{fmtPct(c.price_change_percentage_24h, lang)}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '4px' }}>▼ {t.crypto.topLosers}</div>
              {topLosers.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                  <span style={{ color: '#fff' }}>{c.symbol.toUpperCase()}</span>
                  <span style={{ color: '#EF4444', fontWeight: '600' }}>{fmtPct(c.price_change_percentage_24h, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coin list */}
      {state === 'ok' && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text3)', fontSize: '13px' }}>
              {t.crypto.noCoinFound}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(isMobile && !search ? filtered.slice(0, listLimit) : filtered).map(coin => (
                <CoinRow
                  key={coin.id}
                  coin={coin}
                  expanded={expandedId === coin.id}
                  onToggle={() => { setExpanded(prev => prev === coin.id ? null : coin.id); setHeroId(coin.id); }}
                  showCharts={showCharts}
                  watched={watchlist.includes(coin.id)}
                  onToggleWatch={() => toggleWatch(coin.id)}
                />
              ))}
              {isMobile && !search && filtered.length > listLimit && (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text3)', paddingTop: '4px' }}>
                  {t.crypto.moreCoins.replace('{count}', fmtNumber(filtered.length - listLimit, lang))}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
            {st.source} {source === 'coingecko' ? t.crypto.source_coingecko : t.crypto.source_coincap} · {st.coinHint}
          </div>
        </>
      )}

      </div>
      <style>{`
        .cr-hero-label { display: inline-flex; align-items: center; gap: 8px; }
        .cr-skel { background: rgba(255,255,255,0.04); animation: shimmer 1.5s infinite; }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>
    </ToolFrame>
  );
}
