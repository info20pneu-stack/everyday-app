'use client';

import { useEffect, useState } from 'react';

/* Fetches live JSON from the sports API. No stored fallback: on an error `error` is true and
   the caller shows a message. `url = null` skips the request (lazy tabs). */

export type Load<T> = { data: T | null; error: boolean; loading: boolean; reload: () => void };

export function useLive<T>(url: string | null): Load<T> {
  const [state, setState] = useState<{ url: string | null; data: T | null; error: boolean }>({ url: null, data: null, error: false });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<T>; })
      .then(data => { if (alive) setState({ url, data, error: false }); })
      .catch(() => { if (alive) setState({ url, data: null, error: true }); });
    return () => { alive = false; };
  }, [url, tick]);
  const current = state.url === url;
  return {
    data: current ? state.data : null,
    error: current && state.error,
    loading: !!url && (!current || (!state.data && !state.error)),
    reload: () => { setState(s => ({ ...s, url: null })); setTick(n => n + 1); },
  };
}
