'use client';

import { useSyncExternalStore } from 'react';

/* What the My Day widgets on the dashboard read, shared with the tool pages
   ("⭐ Save to My Day"). Values are JSON in localStorage. */

export const MYDAY_COIN_KEY = 'myday_coin_v1';
export const MYDAY_WEATHER_KEY = 'myday_weather_city_v1';

/** Coins the My Day crypto widget can show (CoinGecko ids). */
export const MYDAY_COINS: { id: string; symbol: string; name: string }[] = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin' },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum' },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB' },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana' },
  { id: 'ripple',      symbol: 'XRP',  name: 'XRP' },
  { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'cardano',     symbol: 'ADA',  name: 'Cardano' },
  { id: 'tron',        symbol: 'TRX',  name: 'TRON' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot',    symbol: 'DOT',  name: 'Polkadot' },
];

export type MyDayPlace = { name: string; lat: number; lon: number; source: 'saved' | 'gps' | 'ip' };

const EVENT = 'everyday-myday-change';

export function myDayGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw) as T;
  } catch { return fallback; }
}

export function myDaySet(key: string, val: unknown) {
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(val));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb); };
}

/** Raw stored JSON of a My Day key (null on the server and when empty); re-renders on change. */
export function useMyDayRaw(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => { try { return localStorage.getItem(key); } catch { return null; } },
    () => null,
  );
}

/** Let other code that writes a My Day key (e.g. a favourites list) refresh the pills. */
export function notifyMyDay() {
  window.dispatchEvent(new Event(EVENT));
}
