'use client';

import { useState, useEffect } from 'react';

type Tab = 'indices' | 'forex' | 'commodities';

type Ticker = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency?: string;
};

const SEED_DATA: Record<Tab, Ticker[]> = {
  indices: [
    { symbol: 'S&P 500',  name: 'United States', price: 5308.13, change: 22.48,  changePct: 0.43 },
    { symbol: 'NASDAQ',   name: 'United States', price: 16742.39, change: -38.10, changePct: -0.23 },
    { symbol: 'DOW JONES',name: 'United States', price: 39069.59, change: 176.57, changePct: 0.45 },
    { symbol: 'FTSE 100', name: 'United Kingdom',price: 8273.65,  change: 41.20,  changePct: 0.50 },
    { symbol: 'DAX',      name: 'Germany',       price: 18492.49, change: -54.13, changePct: -0.29 },
    { symbol: 'CAC 40',   name: 'France',        price: 8219.14,  change: 12.30,  changePct: 0.15 },
    { symbol: 'Nikkei',   name: 'Japan',         price: 38487.24, change: 117.90, changePct: 0.31 },
    { symbol: 'SSE',      name: 'China',         price: 3154.03,  change: -18.45, changePct: -0.58 },
  ],
  forex: [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar',          price: 1.0842, change: 0.0014,  changePct: 0.13, currency: '' },
    { symbol: 'GBP/USD', name: 'Pound / US Dollar',         price: 1.2714, change: -0.0022, changePct: -0.17, currency: '' },
    { symbol: 'USD/JPY', name: 'US Dollar / Yen',           price: 154.82, change: 0.34,    changePct: 0.22, currency: '' },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc',   price: 0.9038, change: -0.0011, changePct: -0.12, currency: '' },
    { symbol: 'AUD/USD', name: 'Australian / US Dollar',    price: 0.6518, change: 0.0008,  changePct: 0.12, currency: '' },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian',      price: 1.3642, change: -0.0019, changePct: -0.14, currency: '' },
    { symbol: 'EUR/GBP', name: 'Euro / Pound',              price: 0.8527, change: 0.0006,  changePct: 0.07, currency: '' },
    { symbol: 'USD/CZK', name: 'US Dollar / Czech Koruna',  price: 22.91,  change: 0.08,    changePct: 0.35, currency: '' },
  ],
  commodities: [
    { symbol: 'Gold',      name: 'XAU/USD',  price: 2328.40, change: 15.20,  changePct: 0.66, currency: '$' },
    { symbol: 'Silver',    name: 'XAG/USD',  price: 29.48,   change: 0.34,   changePct: 1.17, currency: '$' },
    { symbol: 'WTI Oil',   name: 'Crude Oil',price: 79.83,   change: -0.72,  changePct: -0.89, currency: '$' },
    { symbol: 'Brent Oil', name: 'Brent',    price: 84.22,   change: -0.58,  changePct: -0.68, currency: '$' },
    { symbol: 'Nat. Gas',  name: 'NYMEX',    price: 2.418,   change: 0.037,  changePct: 1.55, currency: '$' },
    { symbol: 'Copper',    name: 'LME',      price: 4.521,   change: 0.048,  changePct: 1.07, currency: '$' },
    { symbol: 'Wheat',     name: 'CBOT',     price: 548.25,  change: -3.75,  changePct: -0.68, currency: '' },
    { symbol: 'Corn',      name: 'CBOT',     price: 456.00,  change: 2.25,   changePct: 0.50, currency: '' },
  ],
};

const TAB_ICONS: Record<Tab, string> = {
  indices: '📈',
  forex: '💱',
  commodities: '🏗️',
};

const TAB_LABELS: Record<Tab, string> = {
  indices: 'Indexy',
  forex: 'Forex',
  commodities: 'Komodity',
};

function jitter(base: number, maxPct: number): number {
  return base * (1 + (Math.random() - 0.5) * 2 * maxPct);
}

function fmtPrice(t: Ticker): string {
  const p = t.price;
  if (t.symbol.includes('/') && !t.currency) {
    // forex
    return p < 10 ? p.toFixed(4) : p.toFixed(2);
  }
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return p.toFixed(p < 10 ? 4 : 2);
}

export default function Markets() {
  const [tab, setTab] = useState<Tab>('indices');
  const [data, setData] = useState<Record<Tab, Ticker[]>>(SEED_DATA);
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    function tick() {
      setData(prev => {
        const next = { ...prev };
        (Object.keys(next) as Tab[]).forEach(t => {
          next[t] = next[t].map(ticker => {
            const newPrice = Math.max(0.001, jitter(ticker.price, 0.0008));
            const change = newPrice - SEED_DATA[t].find(s => s.symbol === ticker.symbol)!.price;
            const changePct = (change / SEED_DATA[t].find(s => s.symbol === ticker.symbol)!.price) * 100;
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
  }, []);

  const tickers = data[tab];

  return (
    <div style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>
          📊 Markets
        </h2>
        {updated && (
          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
            {updated.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: tab === t
                ? 'linear-gradient(135deg, var(--purple), #7A3FFF)'
                : 'rgba(255,255,255,0.05)',
              border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: tab === t ? '#fff' : 'var(--text2)',
              padding: '5px 4px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span>{TAB_ICONS[t]}</span>
            <span>{TAB_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* Ticker list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tickers.map(ticker => {
          const up = ticker.changePct >= 0;
          const color = up ? '#4ade80' : '#f87171';
          return (
            <div
              key={ticker.symbol}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '.5rem .75rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', lineHeight: 1.2 }}>
                  {ticker.symbol}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>
                  {ticker.name}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  {ticker.currency !== undefined ? ticker.currency : ''}{fmtPrice(ticker)}
                </div>
                <div style={{
                  fontSize: '10px',
                  color,
                  marginTop: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '3px',
                }}>
                  <span>{up ? '▲' : '▼'}</span>
                  <span>{Math.abs(ticker.changePct).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '.75rem',
        fontSize: '10px',
        color: 'var(--text3)',
        textAlign: 'center',
      }}>
        Simulovaná data · aktualizace každých 15 s
      </div>
    </div>
  );
}
