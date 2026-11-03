'use client';

import { useSyncExternalStore } from 'react';
import type { PublicShare } from './store';
import { baseBoard, boardVariant } from './games';

/* Result sharing in the browser:
   - createShareLink(): asks the server for a /s/<id> link to the finished round
   - useIncomingChallenge(): the challenge a friend sent (?ch=<id> in the URL), loaded once
   - prepareChallenge(): before opening a game from a challenge, picks the same region / level */

export const SITE_URL = 'https://www.everyday1234567.com';

export function shareUrl(id: string): string {
  const origin = typeof window !== 'undefined' && /^(localhost|127\.|192\.168\.)/.test(window.location.hostname)
    ? window.location.origin
    : SITE_URL;
  return `${origin}/s/${id}`;
}

export interface ShareRequest {
  board: string;
  name: string;
  token: string | null;
  lang: string;
  timeMs: number;
  score?: number;
  moves?: number;
  diff?: string;
  proof?: unknown;
  seed?: number;
  vs?: string;
}

export type ShareAnswer = { ok: true; id: string; share: PublicShare } | { ok: false; code: string };

export async function createShareLink(req: ShareRequest): Promise<ShareAnswer> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req),
    });
    const data = await res.json() as { id?: string; share?: PublicShare; code?: string };
    if (res.ok && data.id && data.share) return { ok: true, id: data.id, share: data.share };
    return { ok: false, code: data.code ?? 'server' };
  } catch {
    return { ok: false, code: 'connection' };
  }
}

/* ── incoming challenge (?ch=) ── */

type ChallengeState = { id: string | null; share: PublicShare | null };
let state: ChallengeState = { id: null, share: null };
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

/** Follows the ?ch= of the current URL (also after client-side navigation). */
function sync() {
  if (typeof window === 'undefined') return;
  const raw = new URLSearchParams(window.location.search).get('ch');
  const id = raw && /^[a-z2-9]{6,10}$/.test(raw) ? raw : null;
  if (id === state.id) return;
  state = { id, share: null };
  if (!id) { notify(); return; }
  fetch(`/api/share/${id}`)
    .then(r => (r.ok ? r.json() as Promise<{ share?: PublicShare }> : null))
    .then(d => {
      if (d?.share && state.id === id) { state = { id, share: d.share }; notify(); }
    })
    .catch(() => {});
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  sync();
  return () => { listeners.delete(cb); };
}

/** The friend's challenge from the URL, once loaded; with `board`, only a challenge of the same game. */
export function useIncomingChallenge(board?: string | null): PublicShare | null {
  const share = useSyncExternalStore(subscribe, () => state.share, () => null);
  if (!share) return null;
  if (board && baseBoard(share.board) !== baseBoard(board)) return null;
  return share;
}

/* ── opening a game from a challenge ── */

/** Selects the challenge's region / level in the game's stored settings (read when the game opens). */
export function prepareChallenge(share: PublicShare) {
  const base = baseBoard(share.board);
  const variant = boardVariant(share.board);
  if (!variant) return;
  const key = base === 'connectfour' ? 'cf-region' : base === 'sudokucube' ? 'sc-level' : null;
  if (key) try { localStorage.setItem(key, JSON.stringify(variant)); } catch {}
}

/** Plain text share (the coloured squares without a challenge link): share sheet on phones, clipboard elsewhere. */
export async function shareTextOnly(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (prefersNativeShare()) {
    try { await navigator.share({ text }); return 'shared'; } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'shared';
    }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

/** Phones and tablets get the system share sheet; computers get the share window. */
export function prefersNativeShare(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}
