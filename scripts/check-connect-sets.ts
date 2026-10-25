/* Consistency check for lib/games/connectSets.ts — run: npx tsx scripts/check-connect-sets.ts
   Fails on: fewer than 14 sets per region, a set without
   4 × 4 words, a group named like one of the words, a WORLD row without one translation per language, or a word repeated within a set. */
import { RAW_SETS } from '../lib/games/connectSets';

const errors: string[] = [];
const MIN_SETS = 14;

function checkSet(label: string, groups: { name: string; words: string[] }[]) {
  if (groups.length !== 4) errors.push(`${label}: ${groups.length} groups`);
  const seen = new Map<string, string>();
  for (const g of groups) {
    if (!g.name.trim()) errors.push(`${label}: empty group name`);
    if (g.words.length !== 4) errors.push(`${label} / ${g.name}: ${g.words.length} words`);
    for (const w of g.words) {
      const key = w.trim().toLocaleLowerCase();
      if (!key) errors.push(`${label} / ${g.name}: empty word`);
      if (w !== w.trim()) errors.push(`${label} / ${g.name}: spaces around "${w}"`);
      if (seen.has(key)) errors.push(`${label}: "${w}" in both ${seen.get(key)} and ${g.name}`);
      seen.set(key, g.name);
    }
  }
  const names = new Set(groups.map(g => g.name.trim().toLocaleLowerCase()));
  for (const key of seen.keys()) if (names.has(key)) errors.push(`${label}: "${key}" is both a group name and a word`);
}

for (const [region, sets] of Object.entries(RAW_SETS.local)) {
  if (sets.length < MIN_SETS) errors.push(`${region}: only ${sets.length} sets`);
  sets.forEach((s, i) => checkSet(`${region}#${i + 1}`, s.map(([name, words]) => ({ name, words: [...words] }))));
}

const langs = RAW_SETS.worldLangs;
if (RAW_SETS.world.length < MIN_SETS) errors.push(`world: only ${RAW_SETS.world.length} sets`);
RAW_SETS.world.forEach((s, i) => {
  for (const [name, words] of s) {
    for (const row of [name, ...words]) {
      const n = row.split('|').length;
      if (n !== langs.length) errors.push(`world#${i + 1}: ${n} translations in "${row.slice(0, 40)}…"`);
    }
  }
  langs.forEach((lang, li) => {
    checkSet(`world#${i + 1} [${lang}]`, s.map(([name, words]) => ({
      name: name.split('|')[li] ?? '', words: words.map(w => w.split('|')[li] ?? ''),
    })));
  });
});

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.join('\n'));
  process.exit(1);
}
const counts = Object.entries(RAW_SETS.local).map(([r, sets]) => `${r} ${sets.length}`).join(', ');
console.log(`✓ connect sets OK — ${counts}, world ${RAW_SETS.world.length} × ${langs.length} languages`);
