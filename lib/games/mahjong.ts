/* Mahjong solitaire — game logic shared by the client and the server (anti-cheat replay).
   Ported from games-reference/mahjong.
   Coordinates are in half-tiles: a tile covers x..x+2, y..y+2 on its layer z.
   Every deal is solvable: tiles are paired in an order in which both are free at the time
   (pairOrder), and each pair then gets one tile type.
   The daily challenge is the same for everybody: seed = UTC date, so the server can rebuild
   the deal and replay the moves a player sends (replayDaily). */

export interface Pos { x: number; y: number; z: number }
export interface MjTile extends Pos { id: number; type: number; alive: boolean }

/* ── layouts ── */

function Build() {
  const p: Pos[] = [];
  const api = {
    r(z: number, x: number, y: number, cols: number, rows: number) { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) p.push({ x: x + i * 2, y: y + j * 2, z }); return api; },
    row(z: number, cx: number, y: number, w: number) { for (let i = 0; i < w; i++) p.push({ x: cx - w + i * 2, y, z }); return api; },
    t(z: number, x: number, y: number) { p.push({ x, y, z }); return api; },
    done(): Pos[] {
      let mx = Infinity, my = Infinity;
      p.forEach(q => { mx = Math.min(mx, q.x); my = Math.min(my, q.y); });
      p.forEach(q => { q.x -= mx; q.y -= my; });
      if (p.length % 2) p.pop();
      return p;
    },
  };
  return api;
}

function fromRows(layers: { o: [number, number]; r: string[] }[]): Pos[] {
  const B = Build();
  layers.forEach((L, z) => L.r.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row.charAt(c) === '#') B.t(z, L.o[0] + c * 2, L.o[1] + r * 2); }));
  return B.done();
}

export type LayoutId = 'listek' | 'hvezda' | 'konvice' | 'pevnost' | 'most' | 'pyramida' | 'drak' | 'zelva' | 'diamant' | 'motyl' | 'brana' | 'velka';

export const LAYOUTS: Record<LayoutId, () => Pos[]> = {
  listek: () => Build().r(0, 0, 0, 6, 4).r(1, 2, 2, 4, 2).done(),
  hvezda: () => fromRows([{ o: [0, 0], r: ['...##...', '.######.', '########', '.######.', '...##...'] }, { o: [2, 2], r: ['..##..', '######', '..##..'] }, { o: [6, 4], r: ['##'] }]),
  konvice: () => fromRows([{ o: [0, 0], r: ['.####.', '######', '######', '######', '.####.'] }, { o: [2, 2], r: ['####', '####', '####'] }, { o: [4, 4], r: ['##', '##'] }]),
  pevnost: () => fromRows([{ o: [0, 0], r: ['###.###', '#######', '#######', '#######', '###.###'] }, { o: [2, 2], r: ['#####', '#####', '#####'] }, { o: [4, 4], r: ['###'] }]),
  most: () => fromRows([{ o: [0, 0], r: ['##....##', '###..###', '########', '########', '###..###', '##....##'] }, { o: [2, 4], r: ['######', '######'] }, { o: [4, 4], r: ['####', '####'] }]),
  pyramida: () => Build().r(0, 0, 0, 8, 5).r(1, 2, 2, 6, 3).r(2, 4, 4, 4, 1).r(3, 6, 4, 2, 1).done(),
  drak: () => Build().r(0, 0, 0, 9, 4).r(1, 1, 2, 8, 2).r(2, 4, 2, 5, 2).r(3, 7, 3, 2, 1).done(),
  zelva: () => fromRows([{ o: [0, 0], r: ['..####..', '.######.', '########', '########', '.######.', '..####..'] }, { o: [2, 2], r: ['.####.', '######', '######', '.####.'] }, { o: [4, 4], r: ['####', '####'] }, { o: [6, 5], r: ['##'] }]),
  diamant: () => {
    const B = Build(), L = [[2, 4, 6, 8, 10, 8, 6, 4, 2], [2, 4, 6, 8, 6, 4, 2], [2, 4, 6, 4, 2], [2, 4, 2], [2]];
    L.forEach((ws, z) => ws.forEach((w, i) => B.row(z, 10, (z + i) * 2, w)));
    return B.done();
  },
  motyl: () => {
    const B = Build();
    ([[0, [2, 3, 4, 3, 2], 0], [1, [2, 3, 2], 2], [2, [1], 4]] as [number, number[], number][]).forEach(([z, ws, y0]) => ws.forEach((w, i) => { B.row(z, 5, y0 + i * 2, w); B.row(z, 21, y0 + i * 2, w); }));
    [[0, -4, 9], [1, -2, 7], [2, 0, 5], [3, 2, 3], [4, 4, 1]].forEach(([z, y0, n]) => { for (let i = 0; i < n; i++) B.t(z, 12, y0 + i * 2); });
    B.t(0, 6, -4); B.t(0, 18, -4);
    return B.done();
  },
  brana: () => Build().r(0, 0, 0, 10, 1).r(0, 0, 10, 10, 1).r(0, 0, 2, 1, 4).r(0, 18, 2, 1, 4).r(0, 8, 2, 2, 4)
    .r(1, 2, 0, 8, 1).r(1, 2, 10, 8, 1).r(1, 8, 2, 2, 4).r(1, 0, 3, 1, 3).r(1, 18, 3, 1, 3)
    .r(2, 4, 0, 6, 1).r(2, 9, 3, 1, 3).t(3, 9, 5).done(),
  velka: () => Build().r(0, 2, 0, 12, 1).r(0, 6, 2, 8, 1).r(0, 4, 4, 10, 1).r(0, 2, 6, 12, 1).r(0, 2, 8, 12, 1).r(0, 4, 10, 10, 1).r(0, 6, 12, 8, 1).r(0, 2, 14, 12, 1)
    .t(0, 0, 7).t(0, 26, 7).t(0, 28, 7)
    .r(1, 8, 2, 6, 6).r(2, 10, 4, 4, 4).r(3, 12, 6, 2, 2).t(4, 13, 7).done(),
};

/* ── chapters and levels ── */

export const CHAPTERS: { levels: [LayoutId, number][] }[] = [
  { levels: [['listek', 8], ['hvezda', 10], ['konvice', 10], ['pevnost', 12], ['most', 12]] },
  { levels: [['pyramida', 14], ['motyl', 14], ['drak', 16], ['zelva', 16], ['brana', 16]] },
  { levels: [['diamant', 18], ['motyl', 20], ['brana', 22], ['pyramida', 22], ['diamant', 26]] },
  { levels: [['velka', 30], ['diamant', 34], ['brana', 34], ['velka', 36], ['velka', 42]] },
];

export interface Level { n: number; ch: number; layout: LayoutId; types: number }
export const ALL_LEVELS: Level[] = [];
CHAPTERS.forEach((ch, ci) => ch.levels.forEach(([layout, types]) => ALL_LEVELS.push({ n: ALL_LEVELS.length + 1, ch: ci, layout, types })));

export const DAILY_LAYOUTS: LayoutId[] = ['konvice', 'most', 'pevnost', 'hvezda', 'pyramida', 'motyl', 'drak', 'diamant', 'brana', 'zelva'];
export const DAILY_TYPES = 16;
/** Chapter used for the daily par time. */
export const DAILY_CHAPTER = 1;

/* ── random ── */

export function mulberry(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/** Daily seed from a UTC `yyyy-mm-dd`. */
export const dailySeed = (dayKey: string) => Number(dayKey.replace(/-/g, ''));
export const dailyLayout = (dayKey: string): LayoutId => DAILY_LAYOUTS[dailySeed(dayKey) % DAILY_LAYOUTS.length];
/** Random generator of the n-th reshuffle in the daily challenge. */
export const dailyShuffleRng = (dayKey: string, n: number) => mulberry(dailySeed(dayKey) + 7919 * n);

/* ── rules ── */

/** Free = nothing on top and at least one long side (left or right) open. */
export function isFree(t: Pos, list: Pos[]): boolean {
  let left = false, right = false;
  for (const o of list) {
    if (o === t) continue;
    if (o.z > t.z && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2) return false;
    if (o.z === t.z && Math.abs(o.y - t.y) < 2) {
      if (o.x < t.x && o.x > t.x - 3) left = true;
      else if (o.x > t.x && o.x < t.x + 3) right = true;
    }
  }
  return !(left && right);
}

/** An order of removing the tiles in pairs where both tiles are always free — makes deals solvable. */
export function pairOrder<T extends Pos>(list: T[], rng: () => number): [T, T][] | null {
  for (let attempt = 0; attempt < 300; attempt++) {
    let rem = list.slice();
    const pairs: [T, T][] = [];
    let ok = true;
    while (rem.length) {
      const fr = rem.filter(t => isFree(t, rem));
      if (fr.length < 2) { ok = false; break; }
      const i = Math.floor(rng() * fr.length);
      let j = Math.floor(rng() * (fr.length - 1)); if (j >= i) j++;
      const A = fr[i], B = fr[j];
      pairs.push([A, B]);
      rem = rem.filter(t => t !== A && t !== B);
    }
    if (ok) return pairs;
  }
  return null;
}

/** Tiles of a layout with types 0..types-1 assigned along a solvable pair order. */
export function deal(layout: LayoutId, types: number, rng: () => number): MjTile[] {
  const tiles: MjTile[] = LAYOUTS[layout]().map((p, i) => ({ id: i, ...p, type: -1, alive: true }));
  const pairs = pairOrder(tiles, rng) ?? [];
  const ids = pairs.map((_, k) => k % types);
  shuffle(ids, rng);
  pairs.forEach((p, k) => { p[0].type = ids[k]; p[1].type = ids[k]; });
  return tiles;
}

export const aliveOf = (tiles: MjTile[]) => tiles.filter(t => t.alive);

export function freeTiles(tiles: MjTile[]): MjTile[] {
  const a = aliveOf(tiles);
  return a.filter(t => isFree(t, a));
}

export function findPair(tiles: MjTile[]): [MjTile, MjTile] | null {
  const seen = new Map<number, MjTile>();
  for (const t of freeTiles(tiles)) {
    const o = seen.get(t.type);
    if (o) return [o, t];
    seen.set(t.type, t);
  }
  return null;
}

export function countMoves(tiles: MjTile[]): number {
  const c = new Map<number, number>();
  freeTiles(tiles).forEach(t => c.set(t.type, (c.get(t.type) ?? 0) + 1));
  let m = 0;
  c.forEach(n => { m += n * (n - 1) / 2; });
  return m;
}

/** Deals the remaining tiles again (types kept in pairs) in a solvable order. False when impossible. */
export function reshuffle(tiles: MjTile[], rng: () => number): boolean {
  const a = aliveOf(tiles).sort((p, q) => p.id - q.id);
  const groups = new Map<number, number>();
  a.forEach(t => groups.set(t.type, (groups.get(t.type) ?? 0) + 1));
  const typePairs: number[] = [];
  groups.forEach((n, type) => { for (let i = 0; i + 1 < n; i += 2) typePairs.push(type); });
  const pairs = pairOrder(a, rng);
  if (!pairs) return false;
  shuffle(typePairs, rng);
  pairs.forEach((p, i) => { p[0].type = typePairs[i]; p[1].type = typePairs[i]; });
  return true;
}

/* ── daily challenge: deal and server replay ── */

export function dailyDeal(dayKey: string): MjTile[] {
  return deal(dailyLayout(dayKey), DAILY_TYPES, mulberry(dailySeed(dayKey)));
}

/** Proof steps: [tileA, tileB] for a pair, 'S' for a reshuffle (undone pairs are removed by the client). */
export type ProofStep = [number, number] | 'S';

/** Fastest believable time per pair (two taps). */
export const MIN_MS_PER_PAIR = 500;

/** Replays a daily game; ok when every pair was free and matching and the table ends empty. */
export function replayDaily(dayKey: string, proof: unknown): { ok: true; pairs: number } | { ok: false; why: string } {
  if (!Array.isArray(proof) || proof.length > 400) return { ok: false, why: 'no moves' };
  const tiles = dailyDeal(dayKey);
  const byId = new Map(tiles.map(t => [t.id, t]));
  let shuffles = 0, pairs = 0;
  for (let i = 0; i < proof.length; i++) {
    const s = proof[i];
    if (s === 'S') {
      if (++shuffles > 30) return { ok: false, why: 'too many shuffles' };
      if (!reshuffle(tiles, dailyShuffleRng(dayKey, shuffles))) return { ok: false, why: 'shuffle failed' };
      continue;
    }
    if (!Array.isArray(s) || s.length !== 2) return { ok: false, why: `step ${i + 1}` };
    const A = byId.get(s[0]), B = byId.get(s[1]);
    if (!A || !B || A === B || !A.alive || !B.alive) return { ok: false, why: `step ${i + 1}: tiles` };
    const alive = aliveOf(tiles);
    if (!isFree(A, alive) || !isFree(B, alive)) return { ok: false, why: `step ${i + 1}: blocked` };
    if (A.type !== B.type) return { ok: false, why: `step ${i + 1}: no match` };
    A.alive = false; B.alive = false; pairs++;
  }
  if (tiles.some(t => t.alive)) return { ok: false, why: 'table not cleared' };
  return { ok: true, pairs };
}

/* ── scoring (client) ── */

export const COMBO_WINDOW = 5000;
export const MAX_COMBO = 8;
export const PENALTY = { undo: 10, hint: 30, shuffle: 50 };
export const HINTS = 3;

/** Par time in seconds and the 3-star target score of a game. */
export function parAndTarget(pairs: number, chapter: number, mult: number) {
  const par = Math.round(pairs * (6.5 - chapter * 0.6));
  return { par, target: Math.round(pairs * 10 * mult * 2.6 + par * 2.5) };
}
