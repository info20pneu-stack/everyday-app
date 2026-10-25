/* Copies flags from country-flag-icons (simplified 3:2 SVGs, MIT) into public/flags/<code>.svg:
   the codes in lib/flags.ts plus every flag emoji used in app/ and lib/. Run: npm run flags */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FLAG_CODES, FLAG_EMOJI_RE, flagEmojiToCode } from '../lib/flags';

const root = process.cwd();
const src = join(root, 'node_modules/country-flag-icons/3x2');
const out = join(root, 'public/flags');

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(p);
    else if (/\.(ts|tsx)$/.test(entry.name)) yield p;
  }
}

const codes = new Set(FLAG_CODES);
for (const dir of ['app', 'lib']) {
  for (const file of sourceFiles(join(root, dir))) {
    for (const m of readFileSync(file, 'utf8').matchAll(FLAG_EMOJI_RE)) {
      const code = flagEmojiToCode(m[0]);
      if (code) codes.add(code);
    }
  }
}

mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) {
  if (f.endsWith('.svg') && !codes.has(f.slice(0, -4))) rmSync(join(out, f));
}
let bytes = 0;
const missing: string[] = [];
for (const code of [...codes].sort()) {
  const from = join(src, `${code.toUpperCase()}.svg`);
  if (!existsSync(from)) { missing.push(code); continue; }
  const to = join(out, `${code}.svg`);
  copyFileSync(from, to);
  bytes += statSync(to).size;
}
console.log(`✓ ${codes.size - missing.length} flags → public/flags (${(bytes / 1024).toFixed(1)} kB)`);
if (missing.length) console.warn(`! not in country-flag-icons: ${missing.join(', ')}`);
