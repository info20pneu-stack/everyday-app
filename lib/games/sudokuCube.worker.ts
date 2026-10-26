/* Builds a Sudoku Cube puzzle off the main thread (the hard level can take a few seconds on a slow phone). */
import { generateCube, isCubeLevel } from './sudokuCube';

export interface CubeWorkerRequest { id: number; level: string; seed: string }

self.onmessage = (e: MessageEvent<CubeWorkerRequest>) => {
  const { id, level, seed } = e.data;
  if (!isCubeLevel(level)) return;
  self.postMessage({ id, puzzle: generateCube(level, seed) });
};
