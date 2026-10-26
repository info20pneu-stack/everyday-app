import { WORLD_COUNTRIES } from './games/countries';
import { LANGUAGES } from './i18n';

/* Flags are SVG files in public/flags/<code>.svg (lower-case ISO 3166 codes, plus subdivisions like
   gb-eng and the EU flag), copied from the country-flag-icons package by `npm run flags`.
   The script copies FLAG_CODES below plus every flag emoji it finds in app/ and lib/, so a flag
   emoji written anywhere in the code (rendered through <FlagText>) always has its SVG.
   Nothing of this lands in the JS bundle. */
export const FLAG_CODES: readonly string[] = [...new Set([
  ...WORLD_COUNTRIES,
  ...LANGUAGES.map(l => l.country),
  // Flag Quiz and flag memory (components/DailyGames) use a few more
  'IS', 'MD', 'MM', 'SN',
])].map(c => c.toLowerCase()).sort();

/** A flag emoji: two regional indicator letters (🇨🇿) or a subdivision tag sequence (🏴󠁧󠁢󠁥󠁮󠁧󠁿). */
export const FLAG_EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2,}\u{E007F}/gu;

/** 🇨🇿 → 'cz', 🏴󠁧󠁢󠁥󠁮󠁧󠁿 → 'gb-eng'. Null for anything else. */
export function flagEmojiToCode(emoji: string): string | null {
  const cps = [...emoji].map(c => c.codePointAt(0)!);
  if (cps.length === 2 && cps.every(cp => cp >= 0x1F1E6 && cp <= 0x1F1FF)) {
    return cps.map(cp => String.fromCharCode(cp - 0x1F1E6 + 97)).join('');
  }
  if (cps[0] === 0x1F3F4 && cps[cps.length - 1] === 0xE007F) {
    const tag = cps.slice(1, -1).map(cp => String.fromCharCode(cp - 0xE0000)).join('');
    return tag.length > 2 ? `${tag.slice(0, 2)}-${tag.slice(2)}` : tag;
  }
  return null;
}

/** Country name in the UI language from a flag emoji (🇨🇿 → "Česko"); `fallback` for anything else. */
export function countryNameFromFlag(flag: string | undefined, fallback: string | undefined, lang: string): string {
  const code = flag ? flagEmojiToCode(flag) : null;
  if (code && code.length === 2) {
    try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) ?? fallback ?? ''; } catch {}
  }
  return fallback ?? '';
}
