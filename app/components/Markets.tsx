'use client';

import { useState, useEffect } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';

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
  indices: [], forex: [], commodities: [],
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
  const { listLimit } = useDeviceDetect();
  const [tab, setTab] = useState<Tab>('indices');
  const [base, setBase] = useState<Record<Tab, Ticker[]>>(SEED_DATA);
  const [data, setData] = useState<Record<Tab, Ticker[]>>(SEED_DATA);
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetch('/api/markets')
      .then(r => r.json())
      .then((d: Record<Tab, Ticker[]>) => { setBase(d); setData(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!base.indices.length) return;
    function tick() {
      setData(prev => {
        const next = { ...prev };
        (Object.keys(next) as Tab[]).forEach(t => {
          next[t] = next[t].map(ticker => {
            const seed = base[t].find(s => s.symbol === ticker.symbol);
            if (!seed) return ticker;
            const newPrice = Math.max(0.001, jitter(ticker.price, 0.0008));
            const change = newPrice - seed.price;
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

  return (
    <div className="card" style={{
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
