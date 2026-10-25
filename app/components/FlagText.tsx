'use client';

import { Fragment } from 'react';
import { FLAG_EMOJI_RE, flagEmojiToCode } from '../../lib/flags';
import Flag from './Flag';

/* Renders text with any flag emoji in it (🇨🇿, 🇪🇺, 🏴󠁧󠁢󠁥󠁮󠁧󠁿…) swapped for SVG flags — Windows doesn't draw
   flag emoji. Use it where data carries emoji flags, e.g. `<FlagText text={city.flag} />`. */
export default function FlagText({ text, size = 18 }: { text: string | null | undefined; size?: number }) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FLAG_EMOJI_RE)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const code = flagEmojiToCode(m[0]);
    parts.push(code ? <Flag key={at} code={code} size={size} /> : m[0]);
    last = at + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
