/* Sudoku Cube — puzzle engine (pure functions, no DOM), ported from games-reference/sudoku-cube.

   Faces 0–5 = A–F: front, right, back, left, top, bottom (same order as the CSS faces).
   - easy: six independent 4×4 sudoku (rows, columns and 2×2 boxes of one face, numbers 1–4)
   - mid:  2×2 cells per face; every "band" (a ring of cells around the cube across 4 faces)
           holds 1–8 once
   - hard: 4×4 cells per face; every band holds 1–16 once
   The same seed always gives the same puzzle, so everyone plays the same cube each UTC day. */

export type CubeLevel = 'easy' | 'mid' | 'hard';
export const CUBE_LEVELS: CubeLevel[] = ['easy', 'mid', 'hard'];
export const FACE_LETTERS = 'ABCDEF';

export function isCubeLevel(v: unknown): v is CubeLevel {
  return v === 'easy' || v === 'mid' || v === 'hard';
}

export interface CubeCell {
  face: number;
  r: number;
  c: number;
  /** Indexes of the groups (row / column / box or band) the cell belongs to. */
  groups: number[];
}

export interface CubeLayout {
  level: CubeLevel;
  /** Cells per face side (4, 2 or 4). */
  n: number;
  /** Numbers used: 1..K. */
  K: number;
  cells: CubeCell[];
  groupCount: number;
  /** For each cell, the other cells that share a group with it. */
  peers: number[][];
}

export interface CubePuzzle {
  level: CubeLevel;
  seed: string;
  /** Full solution, one number (1..K) per cell. */
  solution: number[];
  /** Given numbers; 0 = empty cell for the player. */
  givens: number[];
}

/** Seeded PRNG: FNV-1a hash of the seed into a mulberry32 stream (same numbers as the demo). */
export function cubeRng(seed: string): () => number {
  let s = 2166136261;
  for (const ch of seed) { s ^= ch.charCodeAt(0); s = Math.imul(s, 16777619) >>> 0; }
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Face rotations [rotateX, rotateY] in degrees, matching the CSS transforms of faces A–F. */
const FACE_ROT: [number, number][] = [[0, 0], [0, 90], [0, 180], [0, -90], [90, 0], [-90, 0]];

/** A point on the front face rotated onto face `f` (CSS: rotateY first, then rotateX). */
function rotPoint([x, y, z]: [number, number, number], [ax, ay]: [number, number]): [number, number, number] {
  let c = Math.cos(ay * Math.PI / 180), s = Math.sin(ay * Math.PI / 180);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(ax * Math.PI / 180); s = Math.sin(ax * Math.PI / 180);
  [y, z] = [y * c - z * s, y * s + z * c];
  return [x, y, z].map(v => Math.round(v * 1e6) / 1e6) as [number, number, number];
}

const layoutCache = new Map<CubeLevel, CubeLayout>();

/** Cells and groups of a level (cached; the layout never changes). */
export function cubeLayout(level: CubeLevel): CubeLayout {
  const cached = layoutCache.get(level);
  if (cached) return cached;
  const named: { face: number; r: number; c: number; groups: string[] }[] = [];
  let n: number, K: number;
  if (level === 'easy') {
    n = 4; K = 4;
    for (let f = 0; f < 6; f++) for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      named.push({ face: f, r, c, groups: [`f${f}r${r}`, `f${f}c${c}`, `f${f}b${(r >> 1) * 2 + (c >> 1)}`] });
    }
  } else {
    n = level === 'mid' ? 2 : 4; K = 4 * n;
    for (let f = 0; f < 6; f++) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const p = rotPoint([(c + 0.5) / n - 0.5, (r + 0.5) / n - 0.5, 0.5], FACE_ROT[f]);
      const groups: string[] = [];
      // A band is a slice of the cube along one axis; the face's own normal axis is skipped
      for (let a = 0; a < 3; a++) {
        if (Math.abs(Math.abs(p[a]) - 0.5) < 1e-6) continue;
        groups.push(`ring${a}_${Math.floor((p[a] + 0.5) * n)}`);
      }
      named.push({ face: f, r, c, groups });
    }
  }
  const ids = new Map<string, number>();
  const cells: CubeCell[] = named.map(c => ({
    face: c.face, r: c.r, c: c.c,
    groups: c.groups.map(g => { let id = ids.get(g); if (id == null) { id = ids.size; ids.set(g, id); } return id; }),
  }));
  const peers = cells.map((c, i) => cells
    .map((d, j) => (j !== i && d.groups.some(g => c.groups.includes(g)) ? j : -1))
    .filter(j => j >= 0));
  const layout: CubeLayout = { level, n, K, cells, groupCount: ids.size, peers };
  layoutCache.set(level, layout);
  return layout;
}

const STEP_BUDGET = 400_000;
class BudgetError extends Error {}

/** Counts solutions up to `limit`. With `rnd`, digits are tried in random order and the first
 *  solution is written back into `vals` (used to fill an empty grid). Throws BudgetError when
 *  the search takes too long. */
function solveInto(L: CubeLayout, vals: number[], limit: number, rnd?: () => number): number {
  const N = L.cells.length, full = (1 << L.K) - 1;
  const masks = new Array<number>(L.groupCount).fill(0);
  for (let i = 0; i < N; i++) {
    if (!vals[i]) continue;
    const bit = 1 << (vals[i] - 1);
    for (const g of L.cells[i].groups) {
      if (masks[g] & bit) return 0;
      masks[g] |= bit;
    }
  }
  const v = vals.slice();
  let count = 0, steps = 0;
  const rec = (): boolean => {
    if (++steps > STEP_BUDGET) throw new BudgetError();
    // Most constrained empty cell first
    let best = -1, bestMask = 0, bestCount = 99;
    for (let i = 0; i < N; i++) {
      if (v[i]) continue;
      let m = 0;
      for (const g of L.cells[i].groups) m |= masks[g];
      m = full & ~m;
      let k = 0, x = m;
      while (x) { x &= x - 1; k++; }
      if (k < bestCount) { bestCount = k; best = i; bestMask = m; if (k <= 1) break; }
    }
    if (best < 0) {
      count++;
      if (rnd) for (let i = 0; i < N; i++) vals[i] = v[i];
      return count >= limit;
    }
    if (!bestCount) return false;
    const digits: number[] = [];
    for (let d = 0; d < L.K; d++) if (bestMask & (1 << d)) digits.push(d);
    if (rnd) shuffle(digits, rnd);
    const gs = L.cells[best].groups;
    for (const d of digits) {
      v[best] = d + 1;
      for (const g of gs) masks[g] |= 1 << d;
      if (rec()) return true;
      for (const g of gs) masks[g] &= ~(1 << d);
      v[best] = 0;
    }
    return false;
  };
  rec();
  return count;
}

/** Number of solutions of a grid (0 = empty), capped at `limit`; null when the search ran out of budget. */
export function countSolutions(level: CubeLevel, vals: number[], limit = 2): number | null {
  try { return solveInto(cubeLayout(level), vals.slice(), limit); } catch (e) {
    if (e instanceof BudgetError) return null;
    throw e;
  }
}

/** How many numbers stay given after digging holes. */
const KEEP: Record<CubeLevel, number> = { easy: 40, mid: 9, hard: 50 };

/** The puzzle for a level and seed: a random full solution, then holes are dug in random order
 *  as long as the solution stays unique. Deterministic for the same (level, seed). */
export function generateCube(level: CubeLevel, seed: string): CubePuzzle {
  const L = cubeLayout(level), N = L.cells.length;
  const rnd = cubeRng(seed + level);
  let solution: number[];
  for (;;) {
    solution = new Array<number>(N).fill(0);
    try { if (solveInto(L, solution, 1, rnd)) break; } catch (e) { if (!(e instanceof BudgetError)) throw e; }
  }
  const givens = solution.slice();
  let left = N;
  for (const i of shuffle([...Array(N).keys()], rnd)) {
    if (left <= KEEP[level]) break;
    const x = givens[i];
    givens[i] = 0;
    let c: number;
    try { c = solveInto(L, givens, 2); } catch (e) { if (!(e instanceof BudgetError)) throw e; c = 2; }
    if (c !== 1) givens[i] = x; else left--;
  }
  return { level, seed, solution, givens };
}

/** True when cell `i` holds a number that another cell in one of its groups also holds. */
export function hasConflict(L: CubeLayout, vals: number[], i: number): boolean {
  const v = vals[i];
  if (!v) return false;
  for (const j of L.peers[i]) if (vals[j] === v) return true;
  return false;
}

/** A face is done when all its cells are filled and none is in conflict. */
export function isFaceDone(L: CubeLayout, vals: number[], face: number): boolean {
  return L.cells.every((c, i) => c.face !== face || (vals[i] > 0 && !hasConflict(L, vals, i)));
}

/** The whole cube is solved: every cell filled, no conflicts. */
export function isCubeSolved(L: CubeLayout, vals: number[]): boolean {
  return vals.every((v, i) => v > 0 && !hasConflict(L, vals, i));
}

/* localStorage keys (shared by the game and the games page). */
/** Saved daily attempt of one level: { givens, vals, splits, started, over, elapsed, savedAt }. */
export const cubeStateKey = (level: CubeLevel, day: string) => `sc-state-${level}-${day}`;
/** All-time personal record of one level: { timeMs } of the best first daily attempt. */
export const cubeBestKey = (level: CubeLevel) => `sc-best-${level}`;
