import type { LeaderboardConfig } from '../gamesCatalog';
import { buildPairs } from '../games/higherLowerData';
import { wordleTarget } from '../games/wordleWords';

/* The coloured squares of a shared daily game, computed on the server from the moves it has
   already verified (lib/antiCheat/verify.ts), never taken from the client.
   A grid is a list of rows; each cell is one letter:
   g = green, y = yellow, b = blue, p = purple, r = red, x = grey. */

export type GridCell = 'g' | 'y' | 'b' | 'p' | 'r' | 'x';

export const GRID_EMOJI: Record<GridCell, string> = { g: '🟩', y: '🟨', b: '🟦', p: '🟪', r: '🟥', x: '⬛' };
export const GRID_COLOR: Record<GridCell, string> = {
  g: '#22C55E', y: '#FACC15', b: '#3B82F6', p: '#A855F7', r: '#EF4444', x: '#3A3F5C',
};

/** Rows of emoji squares, e.g. for the text share. */
export function gridToEmoji(grid: string[] | undefined): string {
  return (grid ?? []).map(row => [...row].map(c => GRID_EMOJI[c as GridCell] ?? '').join('')).join('\n');
}

/** Wordle colouring of one guess (greens first, then yellows by remaining letter counts). */
function wordleRow(guess: string, target: string): string {
  const out: GridCell[] = Array(guess.length).fill('x');
  const left: Record<string, number> = {};
  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) out[i] = 'g';
    else left[target[i]] = (left[target[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (out[i] === 'g') continue;
    if (left[guess[i]]) { out[i] = 'y'; left[guess[i]]--; }
  }
  return out.join('');
}

/** Connect Four group colours, in the game's order (yellow, green, blue, purple). */
const CF_COLORS: GridCell[] = ['y', 'g', 'b', 'p'];

/** Grid of a verified daily game, or undefined for games without one. Call only after the proof passed. */
export function gridFromProof(cfg: LeaderboardConfig, board: string, proof: unknown): string[] | undefined {
  const p = (proof && typeof proof === 'object' ? proof : {}) as Record<string, unknown>;
  try {
    if (cfg.verified === 'wordle' && Array.isArray(p.guesses)) {
      const target = wordleTarget(board.replace(/^wordle_/, ''), Number(p.day));
      return (p.guesses as string[]).map(g => wordleRow(g, target));
    }
    if (cfg.verified === 'connectfour' && Array.isArray(p.guesses)) {
      return (p.guesses as number[][]).map(g => g.map(id => CF_COLORS[id >> 2] ?? 'x').join(''));
    }
    if (cfg.verified === 'higherlower' && Array.isArray(p.answers)) {
      const m = /_(\d{4})(\d{2})(\d{2})$/.exec(board);
      if (!m) return undefined;
      const pairs = buildPairs(`${m[1]}-${m[2]}-${m[3]}`);
      return [(p.answers as boolean[]).map((a, i) => (a === (pairs[i].b.value > pairs[i].a.value) ? 'g' : 'r')).join('')];
    }
  } catch {
    return undefined;
  }
  return undefined;
}
