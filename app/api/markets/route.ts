import { NextResponse } from 'next/server';

export const revalidate = 60;

const SEED = {
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

export async function GET() {
  return NextResponse.json(SEED);
}
