/* Team badge colours: a filled square in the team's primary colour with its abbreviation.
   The text is white unless the colour is so light that dark text reads better (WCAG contrast). */

const DARK_TEXT = '#0B1020';

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance (0 = black, 1 = white) of #rrggbb; mid-grey for anything else. */
export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 0.2;
  const [r, g, b] = m.slice(1).map(x => channel(parseInt(x, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** White or dark text, whichever contrasts more with the badge colour. */
export function badgeTextColor(bg: string): string {
  const l = luminance(bg);
  return contrast(1, l) >= contrast(luminance(DARK_TEXT), l) ? '#FFFFFF' : DARK_TEXT;
}
