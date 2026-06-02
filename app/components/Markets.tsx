'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';
import type { TickerData, Tab } from '../api/markets/route';

/* ── Price helpers ── */
function fmtPrice(t: TickerData): string {
  const p = t.price;
  if (t.symbol.includes('/') && !t.currency) return p < 10 ? p.toFixed(4) : p.toFixed(2);
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return p.toFixed(p < 10 ? 4 : 2);
}

function fmtVal(v: number, t: TickerData): string {
  if (t.symbol.includes('/') && !t.currency) return v < 10 ? v.toFixed(4) : v.toFixed(2);
  if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v.toFixed(v < 10 ? 4 : 2);
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
function LineChart({ data, up, label }: { data: number[]; up: boolean; label: string }) {
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
  const xLabels = label === '7D'
    ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].slice(0, data.length)
    : label === '1M'
    ? ['W1','W2','W3','W4']
    : ['Jan','Apr','Jul','Oct'];
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
          {v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v < 1 ? v.toFixed(4) : v.toFixed(2)}
        </text>
      ))}
      {/* X labels */}
      {xLabels.map((lbl, i) => (
        <text key={lbl} x={PL + i * xStep} y={H - 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">{lbl}</text>
      ))}
    </svg>
  );
}

/* ── Detail popup ── */
function TickerDetail({ ticker, onClose }: { ticker: TickerData; onClose: () => void }) {
  const [period, setPeriod] = useState<'7D' | '1M' | '1Y'>('7D');
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
      <div style={{ background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', width: '100%', maxWidth: '340px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'mDetailIn 0.2s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '800', color: '#fff' }}>{ticker.symbol}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{ticker.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'Poppins', color: '#fff' }}>
              {ticker.currency !== undefined ? ticker.currency : ''}{fmtPrice(ticker)}
            </div>
            <div style={{ fontSize: '12px', color, fontWeight: '600' }}>
              {up ? '▲' : '▼'} {Math.abs(ticker.changePct).toFixed(2)}%
            </div>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', color: 'var(--text3)', fontSize: '13px' }}>✕</button>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {(['7D','1M','1Y'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '5px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: '700',
              background: p === period ? `${periodUp ? '#4ade80' : '#f87171'}22` : 'rgba(255,255,255,0.05)',
              color: p === period ? (periodUp ? '#4ade80' : '#f87171') : 'var(--text3)',
              outline: p === period ? `1px solid ${periodUp ? '#4ade80' : '#f87171'}44` : 'none',
            }}>{p}</button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '8px 4px 4px', marginBottom: '10px' }}>
          <LineChart data={chartData} up={periodUp} label={period} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
          {[
            { label: 'High',    value: fmtVal(high, ticker) },
            { label: 'Low',     value: fmtVal(low, ticker) },
            { label: `${period} Change`, value: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%` },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: s.label.includes('Change') ? (pctChange >= 0 ? '#4ade80' : '#f87171') : '#fff' }}>{s.value}</div>
              <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <style>{`@keyframes mDetailIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}

/* ── Main component ── */
const TAB_ICONS:  Record<Tab, string> = { indices: '📈', forex: '💱', commodities: '🏗️' };
const TAB_LABELS: Record<Tab, string> = { indices: 'INDICES', forex: 'FOREX', commodities: 'COMMODITIES' };

const EMPTY: Record<Tab, TickerData[]> = { indices: [], forex: [], commodities: [] };

export default function Markets() {
  const { listLimit } = useDeviceDetect();
  const [tab,     setTab]     = useState<Tab>('indices');
  const [base,    setBase]    = useState<Record<Tab, TickerData[]>>(EMPTY);
  const [data,    setData]    = useState<Record<Tab, TickerData[]>>(EMPTY);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [detail,  setDetail]  = useState<TickerData | null>(null);

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
        (Object.keys(next) as Tab[]).forEach(t => {
          next[t] = next[t].map(ticker => {
            const seed = base[t].find(s => s.symbol === ticker.symbol);
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

  return (
    <div className="card" style={{ background: 'rgba(15,20,40,0.92)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--card-radius)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>📊 Markets</h2>
        {updated && (
          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>
            {updated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: tab === t ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.05)',
            border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
            color: tab === t ? '#fff' : 'var(--text2)', padding: '5px 4px', fontSize: '10px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}>
            <span>{TAB_ICONS[t]}</span><span>{TAB_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* Ticker list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tickers.map(ticker => {
          const up    = ticker.changePct >= 0;
          const color = up ? '#4ade80' : '#f87171';
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
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', lineHeight: 1.2 }}>{ticker.symbol}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{ticker.name}</div>
              </div>

              {/* Sparkline */}
              {ticker.spark7d.length > 1 && <Sparkline data={ticker.spark7d} up={up} />}

              {/* Price + change */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  {ticker.currency !== undefined ? ticker.currency : ''}{fmtPrice(ticker)}
                </div>
                <div style={{ fontSize: '10px', color, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                  <span>{up ? '▲' : '▼'}</span>
                  <span>{Math.abs(ticker.changePct).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '.75rem', fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
        Simulated data · updates every 15 s · click for detail
      </div>

      {detail && <TickerDetail ticker={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
