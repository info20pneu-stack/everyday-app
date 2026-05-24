'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';

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

/* ═══════════════════════ HELPERS ═══════════════════════ */

function fmtPrice(n: number): string {
  if (n >= 10000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1)     return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01)  return '$' + n.toFixed(4);
  return '$' + n.toFixed(6);
}

function fmtBig(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + n.toLocaleString('en-US');
}

function fmtPct(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
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

function CoinRow({ coin, expanded, onToggle, showCharts }: {
  coin: Coin;
  expanded: boolean;
  onToggle: () => void;
  showCharts: boolean;
}) {
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
            ? '24px 1fr 80px 60px 70px 76px'
            : '24px 1fr 80px 60px',
          gap: '6px',
          alignItems: 'center',
          background: expanded ? 'rgba(93,76,255,0.07)' : 'rgba(255,255,255,0.02)',
          border: expanded ? '1px solid rgba(93,76,255,0.22)' : '1px solid rgba(255,255,255,0.04)',
          borderRadius: expanded ? '10px 10px 0 0' : '10px',
          padding: '9px 10px',
          cursor: 'pointer',
        }}
      >
        {/* Rank */}
        <div style={{ fontSize: '11px', color: coin.market_cap_rank <= 3 ? 'var(--purple3)' : 'var(--text3)', fontWeight: '600', textAlign: 'center' }}>
          {coin.market_cap_rank}
        </div>

        {/* Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <img
            src={coin.image}
            alt={coin.name}
            width={26}
            height={26}
            style={{ borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {coin.name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>
              {coin.symbol}
            </div>
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: '600', fontFamily: 'Poppins', color: '#fff' }}>
          {fmtPrice(coin.current_price)}
        </div>

        {/* 24h % */}
        <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: '600', color: cc }}>
          {fmtPct(coin.price_change_percentage_24h)}
        </div>

        {/* Market cap — hidden on mobile */}
        {showCharts && (
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text2)' }}>
            {fmtBig(coin.market_cap)}
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
              { label: '24h Vysoká',  val: fmtPrice(coin.high_24h) },
              { label: '24h Nízká',   val: fmtPrice(coin.low_24h) },
              { label: '24h Změna',   val: fmtPrice(Math.abs(coin.price_change_24h)), color: cc },
              { label: 'Objem 24h',   val: fmtBig(coin.total_volume) },
              { label: 'Market Cap',  val: fmtBig(coin.market_cap) },
              { label: 'V oběhu',     val: coin.circulating_supply >= 1e6
                ? (coin.circulating_supply / 1e6).toFixed(2) + 'M ' + coin.symbol.toUpperCase()
                : coin.circulating_supply.toLocaleString('en-US') + ' ' + coin.symbol.toUpperCase() },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '7px 9px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: color ?? '#fff' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Full 7d sparkline */}
          {sp.length > 0 && (
            <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px' }}>7denní průběh ceny</div>
              <SparklineLarge prices={sp} positive={positive} id={coin.id + '-lg'} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ LARGE SPARKLINE ═══════════════════════ */

function SparklineLarge({ prices, positive, id }: { prices: number[]; positive: boolean; id: string }) {
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
  const dayLabels = ['7d', '6d', '5d', '4d', '3d', '2d', '1d', 'Dnes'];

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
          <span key={d} style={{ fontSize: '9px', color: 'var(--text3)' }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Min: {fmtPrice(min)}</span>
        <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Max: {fmtPrice(max)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

const API_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=24h';

export default function Crypto() {
  const { listLimit, showCharts, isMobile } = useDeviceDetect();
  const [coins, setCoins]       = useState<Coin[]>([]);
  const [state, setState]       = useState<FetchState>('loading');
  const [search, setSearch]     = useState('');
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    setState('loading');
    try {
      const res = await fetch(API_URL);
      if (res.status === 429) { setState('rate-limit'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Coin[] = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
      setState('ok');
    } catch {
      setState('error');
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    search.trim()
      ? coins.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.symbol.toLowerCase().includes(search.toLowerCase())
        )
      : coins,
    [coins, search]
  );

  const cardStyle: React.CSSProperties = {
    background: 'rgba(15,20,40,0.92)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 'var(--card-radius)',
    padding: '1.25rem',
    boxShadow: 'var(--card-shadow)',
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>₿ Kryptoměny</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
              {lastUpdated.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={load}
            title="Obnovit"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text3)', fontSize: '13px', padding: '3px 8px', cursor: 'pointer' }}
          >↺</button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Hledat kryptoměnu…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '8px 14px', color: '#fff', fontSize: '13px',
          marginBottom: '1rem', outline: 'none',
        }}
      />

      {/* Column headers */}
      {state === 'ok' && (
        <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px 70px 76px', gap: '6px', padding: '0 10px 6px', fontSize: '10px', color: 'var(--text3)' }}>
          <span style={{ textAlign: 'center' }}>#</span>
          <span>Název</span>
          <span style={{ textAlign: 'right' }}>Cena</span>
          <span style={{ textAlign: 'right' }}>24h %</span>
          <span style={{ textAlign: 'right' }}>Mkt Cap</span>
          <span style={{ textAlign: 'right' }}>7d graf</span>
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
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '4px' }}>CoinGecko rate limit (10 req/min)</div>
          <div style={{ color: 'var(--text3)', fontSize: '11px', marginBottom: '1rem' }}>Zkus to znovu za chvíli.</div>
          <button onClick={load} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '7px 16px', cursor: 'pointer' }}>
            Zkusit znovu
          </button>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '1rem' }}>Nepodařilo se načíst data.</div>
          <button onClick={load} style={{ background: 'linear-gradient(135deg, var(--purple), #7A3FFF)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '7px 16px', cursor: 'pointer' }}>
            Zkusit znovu
          </button>
        </div>
      )}

      {/* Coin list */}
      {state === 'ok' && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text3)', fontSize: '13px' }}>
              Žádná kryptoměna nenalezena
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(isMobile && !search ? filtered.slice(0, listLimit) : filtered).map(coin => (
                <CoinRow
                  key={coin.id}
                  coin={coin}
                  expanded={expandedId === coin.id}
                  onToggle={() => setExpanded(prev => prev === coin.id ? null : coin.id)}
                  showCharts={showCharts}
                />
              ))}
              {isMobile && !search && filtered.length > listLimit && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)', paddingTop: '4px' }}>
                  + {filtered.length - listLimit} dalších · hledáním zobrazíš více
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '.75rem' }}>
            Zdroj: CoinGecko API · Klikni na minci pro detail a 7d graf
          </div>
        </>
      )}

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
