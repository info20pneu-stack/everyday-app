/* Leaderboard nicknames: display form, comparison form and the rude-word filter.
   - Display: trimmed, inner spaces collapsed, 3–16 characters (letters, digits, space, _ - .).
   - Comparison ("norm"): lower case, no diacritics, no separators — "Pepa_Novák" ≡ "pepanovak".
     A nick belongs to the first device that used it (lib/antiCheat/store.ts).
   - Filter: rude words, slurs and impersonation in the site's languages (cs, sk, en, de, pl, es,
     fr, it, pt, ru). Leetspeak (0→o, 1→i, 3→e, @→a…) and stretched letters ("fuuuck") are undone first.
     Short or ambiguous words only match as a whole word, so "Picasso" or "computer" stay allowed. */

export const NICK_MIN = 3;
export const NICK_MAX = 16;

const ALLOWED = /^[\p{L}\p{N}][\p{L}\p{N} _.\-]*$/u;
const SEPARATORS = /[\s_.\-]+/g;

export function displayNick(raw: string): string {
  return raw.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** Lower case without diacritics and separators. */
export function normalizeNick(raw: string): string {
  return displayNick(raw).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(SEPARATORS, '')
    .replace(/ł/g, 'l').replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/đ/g, 'd');
}

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i' };
const unleet = (s: string) => s.replace(/[01345789@$!]/g, c => LEET[c] ?? c);
/** "fuuuuck" → "fuck" (letters repeated 3+ times become one; doubles stay, e.g. "scheisse"). */
const squeeze = (s: string) => s.replace(/(.)\1{2,}/g, '$1');

/* Stems that are rude anywhere inside a nick. */
const CONTAINS = [
  // en
  'fuck', 'shit', 'bitch', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'fagot', 'retard', 'rapist',
  'pedophil', 'paedophil', 'pedofil', 'dickhead', 'asshole', 'motherf', 'wanker', 'bollock', 'jerkoff', 'cocksuck',
  'pussy', 'porn', 'penis', 'vagina', 'dildo', 'blowjob', 'hitler', 'siegheil',
  // cs, sk
  'kurv', 'kurev', 'hovno', 'hovad', 'sracka', 'sracky', 'mrdat', 'mrdka', 'mrdk', 'jebat', 'jebni', 'jeban', 'jebem',
  'zajeb', 'vyjeb', 'dojeb', 'pojeb', 'rozjeb', 'najeb', 'kokot', 'curak', 'zmrd', 'kreten', 'buzerant', 'buzna',
  'picovin', 'picus', 'negr', 'cigos', 'debil',
  // pl
  'kurw', 'pierdol', 'pierdal', 'jebac', 'pizd', 'dziwk', 'chuj',
  // de
  'scheis', 'ficken', 'ficker', 'arschl', 'wichser', 'hurensohn', 'fotze', 'schlampe', 'missgeburt', 'nutte', 'schwuchtel',
  // es
  'hijodeputa', 'putita', 'mierda', 'cabron', 'pendejo', 'gilipollas', 'maricon',
  // fr
  'putain', 'connard', 'salope', 'encule', 'niquetamere', 'fdp',
  // it
  'cazzo', 'vaffancul', 'stronz', 'puttan', 'minchia', 'coglion', 'frocio',
  // pt
  'caralho', 'buceta', 'fodase', 'viado', 'merda',
  // ru (latin and cyrillic)
  'blyat', 'blyad', 'pizdec', 'mudak', 'pidor', 'pidar', 'yeban', 'бля', 'хуй', 'хуи', 'хуе', 'пизд', 'ебат', 'ебан', 'пидор', 'мудак',
];

/* Words that are only rude on their own (they occur inside innocent names). */
const EXACT = new Set([
  'ass', 'fag', 'cum', 'dick', 'cock', 'tits', 'kkk', 'heil', 'nazi',
  'pica', 'pico', 'picu', 'prdel', 'srac', 'cikan', 'kunda', 'huj', 'cipa', 'pedal',
  'hure', 'fick', 'spast', 'mongo',
  'puta', 'puto', 'cono', 'polla', 'culo', 'joder',
  'pute', 'merde', 'batard', 'bite',
  'troia',
  'porra', 'foda', 'foder',
  'suka', 'hui', 'сука',
  // impersonation
  'admin', 'administrator', 'moderator', 'everyday', 'system', 'official',
]);

export type NickCheck = { ok: true; display: string; norm: string } | { ok: false; reason: 'nick_invalid' | 'nick_rude' };

export function checkNick(raw: unknown): NickCheck {
  if (typeof raw !== 'string') return { ok: false, reason: 'nick_invalid' };
  const display = displayNick(raw);
  const len = [...display].length;
  if (len < NICK_MIN || len > NICK_MAX || !ALLOWED.test(display)) return { ok: false, reason: 'nick_invalid' };
  const norm = normalizeNick(display);
  if (norm.length < 2) return { ok: false, reason: 'nick_invalid' };
  if (isRude(display)) return { ok: false, reason: 'nick_rude' };
  return { ok: true, display, norm };
}

export function isRude(display: string): boolean {
  const base = display.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const words = base.split(/[\s_.\-]+/).filter(Boolean);
  const joined = words.join('');
  const forms = new Set<string>();
  for (const f of [joined, unleet(joined)]) { forms.add(f); forms.add(squeeze(f)); }
  for (const f of forms) if (CONTAINS.some(w => f.includes(w))) return true;
  for (const w of words) {
    for (const f of [w, unleet(w), squeeze(unleet(w))]) {
      if (EXACT.has(f)) return true;
      // "puta123", "ass_" — a rude word followed or preceded only by digits
      const letters = f.replace(/\d+/g, '');
      if (letters !== f && EXACT.has(letters)) return true;
    }
  }
  return EXACT.has(joined) || EXACT.has(unleet(joined));
}
