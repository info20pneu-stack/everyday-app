/* Game session tokens on the client (anti-cheat, see app/api/game/start).
   - ensureGameSession(board) when a game opens: fetches a token unless an unused one is stored
     (so a daily game resumed after a reload keeps its original start time).
   - takeGameSession(board) when a result is saved: hands out the stored token, forgets it and
     already fetches the next one for the next round.
   Tokens live in localStorage under `gs:<board>` and are single use on the server. */

const PREFIX = 'gs:';
/** A little under the server's 48 h. */
const TTL_MS = 46 * 60 * 60 * 1000;

type Stored = { token: string; at: number };
const pending = new Map<string, Promise<void>>();

function read(board: string): Stored | null {
  try {
    const v = JSON.parse(localStorage.getItem(PREFIX + board) ?? 'null') as Stored | null;
    return v && typeof v.token === 'string' && Date.now() - v.at < TTL_MS ? v : null;
  } catch { return null; }
}

function prune() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const v = JSON.parse(localStorage.getItem(k) ?? 'null') as Stored | null;
      if (!v || Date.now() - v.at >= TTL_MS) localStorage.removeItem(k);
    }
  } catch {}
}

function request(board: string): Promise<void> {
  const running = pending.get(board);
  if (running) return running;
  const p = fetch('/api/game/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId: board }),
  })
    .then(r => (r.ok ? r.json() as Promise<{ token?: string }> : null))
    .then(d => {
      if (d?.token) try { localStorage.setItem(PREFIX + board, JSON.stringify({ token: d.token, at: Date.now() } satisfies Stored)); } catch {}
    })
    .catch(() => {})
    .finally(() => pending.delete(board));
  pending.set(board, p);
  return p;
}

export function ensureGameSession(board: string | null | undefined): void {
  if (!board || typeof window === 'undefined') return;
  if (read(board)) return;
  prune();
  void request(board);
}

export async function takeGameSession(board: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  let s = read(board);
  if (!s) {
    await (pending.get(board) ?? request(board));
    s = read(board);
  }
  try { localStorage.removeItem(PREFIX + board); } catch {}
  void request(board); // the next round's token
  return s?.token ?? null;
}
