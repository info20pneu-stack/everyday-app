import type { MahjongTexts } from './mahjongI18n';
import { mulberry, shuffle } from './mahjong';

/* Faces of the Mahjong tiles (ported from games-reference/mahjong): six sets + a custom mix.
   `html` is static SVG / text markup built here (no user input), `label` is for screen readers.
   A symbol with `group` (flowers, seasons) is one tile type whose tiles show different members. */

export interface Face { html: string; label: (t: MahjongTexts, lang: string) => string }
export interface Sym extends Face { key: string; group?: Face[] }

export type SetId = 'mahjong' | 'karty' | 'vlajky' | 'cisla' | 'auta' | 'tvary';
export const SET_IDS: SetId[] = ['mahjong', 'karty', 'vlajky', 'cisla', 'auta', 'tvary'];

const C = { R: '#C0271D', G: '#18774A', B: '#1F4E9C', K: '#1F2A44', O: '#D08A0E', P: '#6B3FA0' } as const;

function han(ch: string, sub: string, col: string, top = false): string {
  return `<span class="han${top ? ' top' : ''}" style="color:${col}">${ch}${sub ? `<small>${sub}</small>` : ''}</span>`;
}
const mjSvg = (inner: string) => `<svg class="mjs" viewBox="0 0 24 32" aria-hidden="true">${inner}</svg>`;
function dot(x: number, y: number, r: number, c: string) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${(r * 0.62).toFixed(2)}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${(r * 0.32).toFixed(2)}" fill="${c}"/>`;
}
const DOT_POS: Record<number, number[][]> = {
  2: [[12, 9], [12, 23]], 3: [[6, 7], [12, 16], [18, 25]], 4: [[7, 9], [17, 9], [7, 23], [17, 23]],
  5: [[7, 8], [17, 8], [12, 16], [7, 24], [17, 24]], 6: [[7, 7], [17, 7], [7, 16], [17, 16], [7, 25], [17, 25]],
  7: [[5, 5], [12, 8.5], [19, 12], [7, 20], [17, 20], [7, 27.5], [17, 27.5]],
  8: [[7, 5], [17, 5], [7, 12.3], [17, 12.3], [7, 19.7], [17, 19.7], [7, 27], [17, 27]],
  9: [[5, 6], [12, 6], [19, 6], [5, 16], [12, 16], [19, 16], [5, 26], [12, 26], [19, 26]],
};
const DOT_R: Record<number, number> = { 2: 4.6, 3: 4.4, 4: 4.3, 5: 4, 6: 3.9, 7: 3.3, 8: 3.3, 9: 3.3 };
const DOT_C: Record<number, string> = { 2: 'GB', 3: 'BRG', 4: 'BGGB', 5: 'BGRGB', 6: 'GGRRRR', 7: 'GGGRRRR', 8: 'BBBBBBBB', 9: 'BBBRRRGGG' };
const col = (k: string) => C[k as keyof typeof C];
function dotsSvg(n: number) {
  if (n === 1) return mjSvg(`<circle cx="12" cy="16" r="9.5" fill="${C.G}"/><circle cx="12" cy="16" r="7.6" fill="#fff"/><circle cx="12" cy="16" r="6" fill="${C.R}"/><circle cx="12" cy="16" r="3.4" fill="#fff"/><circle cx="12" cy="16" r="1.8" fill="${C.B}"/>`);
  return mjSvg(DOT_POS[n].map((p, i) => dot(p[0], p[1], DOT_R[n], col(DOT_C[n].charAt(i)))).join(''));
}
function stick(x: number, y: number, h: number, c: string, w = 3.4) {
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${c}"/>`
    + `<rect x="${x - w / 2 - 0.5}" y="${y - 0.55}" width="${w + 1}" height="1.1" rx=".5" fill="${c}"/>`
    + `<rect x="${x - 0.35}" y="${y - h / 2 + 1.3}" width=".7" height="${h - 2.6}" fill="#fff" opacity=".55"/>`;
}
const BAM: Record<number, [number, number, number, string][]> = {
  2: [[12, 9.5, 12, 'G'], [12, 22.5, 12, 'B']],
  3: [[12, 9, 11, 'B'], [7, 23, 11, 'G'], [17, 23, 11, 'G']],
  4: [[8, 9, 11, 'B'], [16, 9, 11, 'G'], [8, 23, 11, 'G'], [16, 23, 11, 'B']],
  5: [[6, 9, 11, 'G'], [18, 9, 11, 'B'], [12, 16, 11, 'R'], [6, 23, 11, 'B'], [18, 23, 11, 'G']],
  6: [[6, 9, 11, 'G'], [12, 9, 11, 'G'], [18, 9, 11, 'G'], [6, 23, 11, 'B'], [12, 23, 11, 'B'], [18, 23, 11, 'B']],
  7: [[12, 5.5, 8, 'R'], [6, 16, 8, 'G'], [12, 16, 8, 'G'], [18, 16, 8, 'G'], [6, 26.5, 8, 'B'], [12, 26.5, 8, 'B'], [18, 26.5, 8, 'B']],
  8: [[4.5, 9, 11, 'G'], [9.5, 9, 11, 'B'], [14.5, 9, 11, 'B'], [19.5, 9, 11, 'G'], [4.5, 23, 11, 'G'], [9.5, 23, 11, 'B'], [14.5, 23, 11, 'B'], [19.5, 23, 11, 'G']],
  9: [[6, 6, 8, 'G'], [12, 6, 8, 'R'], [18, 6, 8, 'B'], [6, 16, 8, 'G'], [12, 16, 8, 'R'], [18, 16, 8, 'B'], [6, 26, 8, 'G'], [12, 26, 8, 'R'], [18, 26, 8, 'B']],
};
function bambooSvg(n: number) {
  if (n === 1) return mjSvg(`<path d="M5 21c1.5-6.5 7.5-10 13-9-2 2-2.6 4.2-2.6 7 0 4.5-4.6 7.2-9.4 6l-3.2 3 1.2-5z" fill="${C.G}"/><path d="M8 19c2-3 5-4.5 8-4.4" stroke="#fff" stroke-width=".8" fill="none" opacity=".7"/><circle cx="18" cy="10" r="3.2" fill="${C.R}"/><path d="M20.8 9.4l3 1.1-3 1z" fill="${C.O}"/><circle cx="18.7" cy="9.3" r=".8" fill="#fff"/><path d="M9 27l-1.5 3M12 26.5l.5 3.5" stroke="${C.B}" stroke-width="1.4" stroke-linecap="round"/>`);
  const w = n === 8 ? 3 : 3.4;
  return mjSvg(BAM[n].map(s => stick(s[0], s[1], s[2], col(s[3]), w)).join(''));
}

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

/* ── sets ── */

const MAHJONG: Sym[] = [];
for (let d = 1; d <= 9; d++) MAHJONG.push({ key: `m-d${d}`, html: dotsSvg(d), label: t => fill(t.sym.dots, { n: d }) });
for (let b = 1; b <= 9; b++) MAHJONG.push({ key: `m-b${b}`, html: bambooSvg(b), label: t => fill(t.sym.bamboo, { n: b }) });
'一二三四五六七八九'.split('').forEach((c, i) => MAHJONG.push({ key: `m-c${i}`, html: han(c, '萬', C.R), label: t => fill(t.sym.characters, { n: i + 1 }) }));
['東', '南', '西', '北'].forEach((w, i) => MAHJONG.push({ key: `m-w${i}`, html: han(w, '', C.B), label: t => t.sym.winds[i] }));
MAHJONG.push({ key: 'm-dr', html: han('中', '', C.R), label: t => t.sym.dragons[0] });
MAHJONG.push({ key: 'm-dg', html: han('發', '', C.G), label: t => t.sym.dragons[1] });
MAHJONG.push({ key: 'm-dw', html: mjSvg(`<rect x="3.5" y="4.5" width="17" height="23" rx="1.5" fill="none" stroke="${C.B}" stroke-width="2.2"/><rect x="7" y="8" width="10" height="16" rx="1" fill="none" stroke="${C.B}" stroke-width="1"/><path d="M3.5 9h3M3.5 23h3M17.5 9h3M17.5 23h3" stroke="${C.B}" stroke-width="1"/>`), label: t => t.sym.dragons[2] });
const FLOWERS: Face[] = [['梅', C.R], ['蘭', C.P], ['菊', C.O], ['竹', C.G]].map(([ch, c], i) => ({ html: han(ch, String(i + 1), c, true), label: t => fill(t.sym.flower, { name: t.sym.flowers[i] }) }));
const SEASONS: Face[] = [['春', C.G], ['夏', C.R], ['秋', C.O], ['冬', C.B]].map(([ch, c], i) => ({ html: han(ch, String(i + 1), c, true), label: t => fill(t.sym.season, { name: t.sym.seasons[i] }) }));
MAHJONG.push({ key: 'g-flower', html: FLOWERS[0].html, label: FLOWERS[0].label, group: FLOWERS });
MAHJONG.push({ key: 'g-season', html: SEASONS[0].html, label: SEASONS[0].label, group: SEASONS });

const CARDS: Sym[] = [];
['A', 'K', 'Q', 'J', '10', '9', '8', '7'].forEach(v => (['♠', '♥', '♦', '♣'] as const).forEach((s, si) => {
  const c = si === 1 || si === 2 ? C.R : C.K;
  CARDS.push({ key: `c-${v}${si}`, html: `<span class="card" style="color:${c}">${v}<i>${s}︎</i></span>`, label: t => `${v} ${t.sym.suits[si]}` });
}));

const flagSvg = (inner: string) => `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${inner}</svg>`;
const fv = (a: string, b: string, c: string) => `<rect width="10" height="20" fill="${a}"/><rect x="10" width="10" height="20" fill="${b}"/><rect x="20" width="10" height="20" fill="${c}"/>`;
const fh = (a: string, b: string, c: string) => `<rect width="30" height="6.67" fill="${a}"/><rect y="6.67" width="30" height="6.67" fill="${b}"/><rect y="13.33" width="30" height="6.67" fill="${c}"/>`;
const f2 = (a: string, b: string) => `<rect width="30" height="10" fill="${a}"/><rect y="10" width="30" height="10" fill="${b}"/>`;
const fx = (bg: string, cr: string) => `<rect width="30" height="20" fill="${bg}"/><rect x="9" width="4" height="20" fill="${cr}"/><rect y="8" width="30" height="4" fill="${cr}"/>`;
function regionName(code: string, lang: string): string {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code; } catch { return code; }
}
const FLAGS: Sym[] = ([
  ['CZ', f2('#FFFFFF', '#D7141A') + '<path d="M0 0L15 10L0 20Z" fill="#11457E"/>'],
  ['FR', fv('#0055A4', '#FFFFFF', '#EF4135')], ['IT', fv('#009246', '#FFFFFF', '#CE2B37')],
  ['DE', fh('#000000', '#DD0000', '#FFCE00')], ['NL', fh('#AE1C28', '#FFFFFF', '#21468B')],
  ['AT', fh('#ED2939', '#FFFFFF', '#ED2939')], ['BE', fv('#000000', '#FDDA24', '#EF3340')],
  ['IE', fv('#169B62', '#FFFFFF', '#FF883E')], ['HU', fh('#CD2A3E', '#FFFFFF', '#436F4D')],
  ['PL', f2('#FFFFFF', '#DC143C')], ['UA', f2('#0057B7', '#FFD700')],
  ['JP', '<rect width="30" height="20" fill="#FFFFFF"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>'],
  ['EE', fh('#0072CE', '#000000', '#FFFFFF')], ['LT', fh('#FDB913', '#006A44', '#C1272D')],
  ['BG', fh('#FFFFFF', '#00966E', '#D62612')], ['RO', fv('#002B7F', '#FCD116', '#CE1126')],
  ['SE', fx('#006AA7', '#FECC00')], ['FI', fx('#FFFFFF', '#002F6C')], ['DK', fx('#C8102E', '#FFFFFF')],
  ['CH', '<rect width="30" height="20" fill="#DA291C"/><rect x="13" y="4" width="4" height="12" fill="#FFFFFF"/><rect x="9" y="8" width="12" height="4" fill="#FFFFFF"/>'],
] as [string, string][]).map(([code, svg]) => ({ key: `f-${code}`, html: flagSvg(svg), label: (t, lang) => fill(t.sym.flag, { name: regionName(code, lang) }) }));

const NUMBERS: Sym[] = [];
for (let n = 1; n <= 30; n++) {
  const c = [C.R, C.B, C.G, C.K, C.O][(n - 1) % 5];
  NUMBERS.push({ key: `n-${n}`, html: `<span class="num" style="color:${c}">${n}</span>`, label: t => fill(t.sym.number, { n }) });
}

const CAR_SHAPES = ['M2 14v-3l4-1 4-5h10l5 5 4 1v3z', 'M2 14v-4l3-1 4-5h11l3 5h5v5z', 'M1 14v-2l7-3 6-3h7l7 4 3 1v3z', 'M2 14V3h18l6 6 4 1v4z'];
const PALETTE = [C.R, C.B, C.G, C.O, C.P];
const CARS: Sym[] = [];
PALETTE.forEach((c, ci) => CAR_SHAPES.forEach((d, si) => CARS.push({
  key: `a-${si}-${ci}`,
  html: `<svg viewBox="0 0 32 20" aria-hidden="true"><path d="${d}" fill="${c}"/><path d="${d}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".8"/><circle cx="8" cy="15" r="2.8" fill="#1F2A44"/><circle cx="24" cy="15" r="2.8" fill="#1F2A44"/><circle cx="8" cy="15" r="1" fill="#E2D5B5"/><circle cx="24" cy="15" r="1" fill="#E2D5B5"/></svg>`,
  label: t => fill(t.sym.colored, { thing: t.sym.cars[si], color: t.sym.colors[ci] }),
})));

const SHAPE_PATHS = ['<circle cx="12" cy="12" r="9"/>', '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/>', '<path d="M12 3l9.5 17h-19z"/>', '<path d="M12 2l9 10-9 10-9-10z"/>', '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z"/>'];
const SHAPES: Sym[] = [];
PALETTE.slice(0, 4).forEach((c, ci) => SHAPE_PATHS.forEach((p, si) => SHAPES.push({
  key: `s-${si}-${ci}`, html: `<svg class="shape" viewBox="0 0 24 24" aria-hidden="true" fill="${c}">${p}</svg>`,
  label: t => fill(t.sym.colored, { thing: t.sym.shapes[si], color: t.sym.colors[ci] }),
})));

export interface SymbolSet { id: SetId; lvl: 1 | 2 | 3; mult: number; list: Sym[]; prev: Sym[] }
export const SETS: SymbolSet[] = [
  { id: 'mahjong', lvl: 2, mult: 1.0, list: MAHJONG, prev: [MAHJONG[4], MAHJONG[27 + 4], MAHJONG[9]] },
  { id: 'karty', lvl: 1, mult: 1.0, list: CARDS, prev: [CARDS[0], CARDS[5], CARDS[10]] },
  { id: 'vlajky', lvl: 3, mult: 1.5, list: FLAGS, prev: [FLAGS[0], FLAGS[1], FLAGS[11]] },
  { id: 'cisla', lvl: 1, mult: 0.8, list: NUMBERS, prev: [NUMBERS[0], NUMBERS[1], NUMBERS[2]] },
  { id: 'auta', lvl: 2, mult: 1.2, list: CARS, prev: [CARS[0], CARS[5], CARS[10]] },
  { id: 'tvary', lvl: 1, mult: 0.8, list: SHAPES, prev: [SHAPES[0], SHAPES[6], SHAPES[12]] },
];
export const setById = (id: string) => SETS.find(s => s.id === id) ?? SETS[0];

export interface Pool { mix: boolean; setId: SetId | 'mix'; list: Sym[]; mult: number; prev: Sym[] }

/** The symbols in play: one set, or the custom mix (alternating, higher multiplier). */
export function poolFor(set: SetId | 'mix', mix: SetId[]): Pool {
  if (set === 'mix') {
    let ids = mix.filter(id => SET_IDS.includes(id));
    if (ids.length < 2) ids = ['mahjong', 'karty'];
    const lists = ids.map(id => shuffle(setById(id).list.slice(), mulberry(7)));
    const out: Sym[] = [];
    for (let i = 0; i < 42; i++) lists.forEach(l => { if (l[i]) out.push(l[i]); });
    const mult = ids.reduce((a, id) => a + setById(id).mult, 0) / ids.length + 0.3;
    return { mix: true, setId: 'mix', list: out, mult: Math.round(mult * 10) / 10, prev: out.slice(0, 3) };
  }
  const s = setById(set);
  return { mix: false, setId: s.id, list: s.list, mult: s.mult, prev: s.prev };
}

/** First face of a symbol (the one shown in previews). */
export const faceOf = (s: Sym): Face => s.group?.[0] ?? s;
