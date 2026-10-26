'use client';

import { useState } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmtNumber } from '../../lib/formatNumber';
import { useIsClient } from '../../lib/games/useIsClient';
import { toolStrings, type ToolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolField, ToolHero, ToolTiles, useShare } from './tools/ToolFrame';

/** `intl`: Intl unit id for a localized name; `name`: key in toolsI18n for units Intl doesn't know. */
type Unit = { label: string; factor: number; offset?: number; intl?: string; name?: 'unitTsp' | 'unitTbsp' | 'unitCup' | 'unitPint' | 'unitKnot' };
type Category = { id: string; name: string; units: Unit[] };

function getCategories(t: Translations): Category[] {
  return [
    {
      id: 'length', name: t.unitConverter.cat_length,
      units: [
        { label: 'mm', factor: 0.001 },
        { label: 'cm', factor: 0.01 },
        { label: 'm', factor: 1 },
        { label: 'km', factor: 1000 },
        { label: 'in', factor: 0.0254, intl: 'inch' },
        { label: 'ft', factor: 0.3048, intl: 'foot' },
        { label: 'yd', factor: 0.9144, intl: 'yard' },
        { label: 'mi', factor: 1609.344, intl: 'mile' },
      ],
    },
    {
      id: 'weight', name: t.unitConverter.cat_weight,
      units: [
        { label: 'mg', factor: 0.000001 },
        { label: 'g', factor: 0.001 },
        { label: 'kg', factor: 1 },
        { label: 't', factor: 1000 },
        { label: 'oz', factor: 0.028349523, intl: 'ounce' },
        { label: 'lb', factor: 0.45359237, intl: 'pound' },
        { label: 'st', factor: 6.35029318, intl: 'stone' },
      ],
    },
    {
      id: 'temperature', name: t.unitConverter.cat_temperature,
      units: [
        { label: '°C', factor: 1 },
        { label: '°F', factor: 1 },
        { label: 'K', factor: 1 },
      ],
    },
    {
      id: 'volume', name: t.unitConverter.cat_volume,
      units: [
        { label: 'ml', factor: 0.001 },
        { label: 'cl', factor: 0.01 },
        { label: 'dl', factor: 0.1 },
        { label: 'l', factor: 1 },
        { label: 'm³', factor: 1000 },
        { label: 'tsp', factor: 0.00492892, name: 'unitTsp' },
        { label: 'tbsp', factor: 0.01478676, name: 'unitTbsp' },
        { label: 'fl oz', factor: 0.02957353, intl: 'fluid-ounce' },
        { label: 'cup', factor: 0.23658824, name: 'unitCup' },
        { label: 'pt', factor: 0.47317647, name: 'unitPint' },
        { label: 'gal', factor: 3.78541178, intl: 'gallon' },
      ],
    },
    {
      id: 'speed', name: t.unitConverter.cat_speed,
      units: [
        { label: 'm/s', factor: 1 },
        { label: 'km/h', factor: 0.27777778 },
        { label: 'mph', factor: 0.44704, intl: 'mile-per-hour' },
        { label: 'kn', factor: 0.51444444, name: 'unitKnot' },
        { label: 'ft/s', factor: 0.3048, intl: 'foot-per-second' },
      ],
    },
    {
      id: 'area', name: t.unitConverter.cat_area,
      units: [
        { label: 'mm²', factor: 0.000001 },
        { label: 'cm²', factor: 0.0001 },
        { label: 'm²', factor: 1 },
        { label: 'km²', factor: 1_000_000 },
        { label: 'ha', factor: 10_000 },
        { label: 'in²', factor: 0.00064516 },
        { label: 'ft²', factor: 0.09290304 },
        { label: 'ac', factor: 4046.8564, intl: 'acre' },
        { label: 'mi²', factor: 2_589_988.11 },
      ],
    },
  ];
}

function toBase(value: number, unit: Unit, catId: string): number {
  if (catId === 'temperature') {
    if (unit.label === '°C') return value;
    if (unit.label === '°F') return (value - 32) * 5 / 9;
    return value - 273.15;
  }
  return value * unit.factor;
}

function fromBase(base: number, unit: Unit, catId: string): number {
  if (catId === 'temperature') {
    if (unit.label === '°C') return base;
    if (unit.label === '°F') return base * 9 / 5 + 32;
    return base + 273.15;
  }
  return base / unit.factor;
}

/** Converted value in the language's number format; huge values shortened ("25,9 mil."). */
function fmt(n: number, lang: string): string {
  if (!isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs === 0) return fmtNumber(0, lang);
  if (abs >= 1e6) return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  if (abs >= 1) return new Intl.NumberFormat(lang, { maximumFractionDigits: 4 }).format(n);
  if (abs < 1e-6) return new Intl.NumberFormat(lang, { notation: 'scientific', maximumFractionDigits: 3 }).format(n);
  return new Intl.NumberFormat(lang, { maximumSignificantDigits: 4 }).format(n);
}

/** "in · palec": symbol plus the unit's name in the UI language (imperial units only). */
function unitLabel(u: Unit, lang: string, s: ToolStrings): string {
  let name = u.name ? s[u.name] : '';
  if (u.intl) {
    try {
      name = new Intl.NumberFormat(lang, { style: 'unit', unit: u.intl, unitDisplay: 'long' })
        .formatToParts(1).filter(p => p.type === 'unit').map(p => p.value).join('').trim();
    } catch {}
  }
  return name ? `${u.label} · ${name}` : u.label;
}

export default function UnitConverter() {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
  const CATEGORIES = getCategories(t);
  const [catIdx, setCatIdx] = useState(0);
  const cat = CATEGORIES[catIdx];

  const [fromIdx, setFromIdx] = useState(2);
  const [toIdx, setToIdx] = useState(3);
  const [input, setInput] = useState('1');
  const { share, done } = useShare();
  // Intl unit names differ between Node's and the browser's ICU, so they appear after hydration
  const isClient = useIsClient();
  const label = (u: Unit) => isClient ? unitLabel(u, lang, s) : u.label;

  const safeFrom = Math.min(fromIdx, cat.units.length - 1);
  const safeTo = Math.min(toIdx, cat.units.length - 1);

  const fromUnit = cat.units[safeFrom];
  const toUnit = cat.units[safeTo];

  const amount = parseFloat(input.replace(',', '.')) || 0;
  const base = toBase(amount, fromUnit, cat.id);
  const result = fromBase(base, toUnit, cat.id);

  function switchCategory(idx: number) {
    setCatIdx(idx);
    setFromIdx(0);
    setToIdx(1);
    setInput('1');
  }

  function swap() {
    setFromIdx(safeTo);
    setToIdx(safeFrom);
  }

  const resultText = `${fmt(amount, lang)} ${fromUnit.label} = ${fmt(result, lang)} ${toUnit.label}`;

  return (
    <ToolFrame toolId="prevodnik">
      <div className="tf-chips" role="group" aria-label={t.unitConverter.title}>
        {CATEGORIES.map((c, i) => (
          <button key={c.id} type="button" className={`tf-chip${i === catIdx ? ' is-on' : ''}`} aria-pressed={i === catIdx} onClick={() => switchCategory(i)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="tf-panel">
        <ToolField label={t.unitConverter.from} htmlFor="uc-amount">
          <div className="tf-row">
            <input id="uc-amount" type="text" inputMode="decimal" className="tf-input" style={{ flex: 1.2 }}
              value={input} onChange={e => setInput(e.target.value)} />
            <select className="tf-input" style={{ flex: 1 }} value={safeFrom} onChange={e => setFromIdx(Number(e.target.value))} aria-label={t.unitConverter.from}>
              {cat.units.map((u, i) => <option key={u.label} value={i}>{label(u)}</option>)}
            </select>
          </div>
        </ToolField>
        <button type="button" className="uc-swap" onClick={swap} aria-label={t.unitConverter.swap}>⇅</button>
        <ToolField label={t.unitConverter.to} htmlFor="uc-to">
          <select id="uc-to" className="tf-input" value={safeTo} onChange={e => setToIdx(Number(e.target.value))}>
            {cat.units.map((u, i) => <option key={u.label} value={i}>{label(u)}</option>)}
          </select>
        </ToolField>
      </div>

      <ToolHero
        label={<span className="tf-keep" dir="ltr">{fmt(amount, lang)} {fromUnit.label} =</span>}
        value={fmt(result, lang)}
        unit={toUnit.label}
        sub={<span dir="ltr">1 {fromUnit.label} = {fmt(fromBase(toBase(1, fromUnit, cat.id), toUnit, cat.id), lang)} {toUnit.label}</span>}
      />

      <ToolTiles items={cat.units.filter((_, i) => i !== safeFrom).slice(0, 6).map(u => ({
        label: <span className="tf-keep">{u.label}</span>, value: fmt(fromBase(base, u, cat.id), lang), accent: u === toUnit,
      }))} />

      <ToolButton onClick={() => share(resultText)}>{done ? s.copied : <>📋 {s.copyResult}</>}</ToolButton>

      <style>{`
        .uc-swap {
          align-self: center; width: 42px; height: 42px; border-radius: 50%; cursor: pointer; margin: -4px 0;
          font-size: 18px; color: #fff; border: 1px solid color-mix(in srgb, var(--tc) 70%, #fff);
          background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 75%, #fff), color-mix(in srgb, var(--tc) 75%, #000));
          box-shadow: 0 0 16px color-mix(in srgb, var(--tc) 45%, transparent);
        }
      `}</style>
    </ToolFrame>
  );
}
