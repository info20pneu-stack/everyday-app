/* Locale-aware number helpers (Intl) for the calculators: 17 972 / 17,972 / ١٧٬٩٧٢ by language. */

export function fmtNumber(n: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(n);
}

/** Two-digit clock part (05), in the language's digits. */
export function fmt2(n: number, lang: string): string {
  return new Intl.NumberFormat(lang, { minimumIntegerDigits: 2, useGrouping: false }).format(n);
}

/** "2 měs.", "14 d", "364 dní"… with the language's own unit names and plural forms. */
export function fmtUnit(
  n: number, unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute', lang: string, display: 'short' | 'long' | 'narrow' = 'short',
): string {
  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: display }).format(n);
}

/** Large numbers shortened in the language's own way ("25,9 mil.", "25.9M", "2590万"); smaller ones in full. */
export function fmtCompact(n: number, lang: string, from = 1_000_000): string {
  if (Math.abs(n) < from) return fmtNumber(n, lang);
  return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Number with a fixed count of decimals, in the language's format (36,6 / 36.6). */
export function fmtDecimal(n: number, lang: string, digits = 1): string {
  return new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}
