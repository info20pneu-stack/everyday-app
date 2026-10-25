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
  n: number, unit: 'year' | 'month' | 'week' | 'day', lang: string, display: 'short' | 'long' | 'narrow' = 'short',
): string {
  return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: display }).format(n);
}
