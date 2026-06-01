import { NextResponse } from 'next/server';

export const revalidate = 60;

export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency?: string;
  spark7d: number[];   // 7 daily points
  hist1m:  number[];   // 30 daily points
  hist1y:  number[];   // 52 weekly points
}

export type Tab = 'indices' | 'forex' | 'commodities';

/* ── Deterministic seeded random ── */
function makeRng(symbol: string): () => number {
  const day = Math.floor(Date.now() / 86400000);
  let s = symbol.split('').reduce((a, c, i) => (((a << 5) - a) + c.charCodeAt(0) * (i + 1)) | 0, 0);
  s = Math.abs(s) + day * 7919;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function genHistory(basePrice: number, symbol: string, points: number, volPerStep: number): number[] {
  const rng = makeRng(symbol + points);
  const data: number[] = [];
  let p = basePrice * (0.82 + rng() * 0.36);
  for (let i = 0; i < points; i++) {
    p = Math.max(0.0001, p * (1 + (rng() - 0.48) * volPerStep));
    data.push(p);
  }
  const scale = basePrice / p;
  return data.map(v => +((v * scale)).toPrecision(6));
}

const SEED_BASE: Record<Tab, Omit<TickerData, 'spark7d' | 'hist1m' | 'hist1y'>[]> = {
  indices: [
    { symbol: 'S&P 500',   name: 'United States',  price: 5308.13,  change: 22.48,   changePct: 0.43 },
    { symbol: 'NASDAQ',    name: 'United States',  price: 16742.39, change: -38.10,  changePct: -0.23 },
    { symbol: 'DOW JONES', name: 'United States',  price: 39069.59, change: 176.57,  changePct: 0.45 },
    { symbol: 'FTSE 100',  name: 'United Kingdom', price: 8273.65,  change: 41.20,   changePct: 0.50 },
    { symbol: 'DAX',       name: 'Germany',        price: 18492.49, change: -54.13,  changePct: -0.29 },
    { symbol: 'CAC 40',    name: 'France',         price: 8219.14,  change: 12.30,   changePct: 0.15 },
    { symbol: 'Nikkei',    name: 'Japan',          price: 38487.24, change: 117.90,  changePct: 0.31 },
    { symbol: 'SSE',       name: 'China',          price: 3154.03,  change: -18.45,  changePct: -0.58 },
  ],
  forex: [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar',        price: 1.0842, change: 0.0014,  changePct: 0.13,  currency: '' },
    { symbol: 'GBP/USD', name: 'Pound / US Dollar',       price: 1.2714, change: -0.0022, changePct: -0.17, currency: '' },
    { symbol: 'USD/JPY', name: 'US Dollar / Yen',         price: 154.82, change: 0.34,    changePct: 0.22,  currency: '' },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.9038, change: -0.0011, changePct: -0.12, currency: '' },
    { symbol: 'AUD/USD', name: 'Australian / US Dollar',  price: 0.6518, change: 0.0008,  changePct: 0.12,  currency: '' },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian',    price: 1.3642, change: -0.0019, changePct: -0.14, currency: '' },
    { symbol: 'EUR/GBP', name: 'Euro / Pound',            price: 0.8527, change: 0.0006,  changePct: 0.07,  currency: '' },
    { symbol: 'USD/CZK', name: 'US Dollar / Czech Koruna',price: 22.91,  change: 0.08,    changePct: 0.35,  currency: '' },
  ],
  commodities: [
    { symbol: 'Gold',      name: 'XAU/USD',   price: 2328.40, change: 15.20,  changePct: 0.66,  currency: '$' },
    { symbol: 'Silver',    name: 'XAG/USD',   price: 29.48,   change: 0.34,   changePct: 1.17,  currency: '$' },
    { symbol: 'WTI Oil',   name: 'Crude Oil', price: 79.83,   change: -0.72,  changePct: -0.89, currency: '$' },
    { symbol: 'Brent Oil', name: 'Brent',     price: 84.22,   change: -0.58,  changePct: -0.68, currency: '$' },
    { symbol: 'Nat. Gas',  name: 'NYMEX',     price: 2.418,   change: 0.037,  changePct: 1.55,  currency: '$' },
    { symbol: 'Copper',    name: 'LME',       price: 4.521,   change: 0.048,  changePct: 1.07,  currency: '$' },
    { symbol: 'Wheat',     name: 'CBOT',      price: 548.25,  change: -3.75,  changePct: -0.68, currency: '' },
    { symbol: 'Corn',      name: 'CBOT',      price: 456.00,  change: 2.25,   changePct: 0.50,  currency: '' },
  ],
};

function buildTab(tab: Tab): TickerData[] {
  return SEED_BASE[tab].map(t => ({
    ...t,
    spark7d: genHistory(t.price, t.symbol + '7', 7,  0.009),
    hist1m:  genHistory(t.price, t.symbol + '30', 30, 0.012),
    hist1y:  genHistory(t.price, t.symbol + '52', 52, 0.022),
  }));
}

export async function GET() {
  return NextResponse.json({
    indices:     buildTab('indices'),
    forex:       buildTab('forex'),
    commodities: buildTab('commodities'),
  });
}
