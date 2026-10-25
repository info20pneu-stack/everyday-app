import { readdirSync } from 'node:fs';
import path from 'node:path';

/** Server only: ids of cards that have public/images/cards/<id>.webp. */
export function getCardImageIds(): string[] {
  try {
    return readdirSync(path.join(process.cwd(), 'public/images/cards'))
      .filter(f => f.toLowerCase().endsWith('.webp'))
      .map(f => f.slice(0, -5));
  } catch {
    return [];
  }
}
