'use client';

import { useState } from 'react';

type Unit = { label: string; factor: number; offset?: number };
type Category = { icon: string; name: string; units: Unit[] };

const CATEGORIES: Category[] = [
  {
    icon: '📏', name: 'Length',
    units: [
      { label: 'mm', factor: 0.001 },
      { label: 'cm', factor: 0.01 },
      { label: 'm', factor: 1 },
      { label: 'km', factor: 1000 },
      { label: 'in', factor: 0.0254 },
      { label: 'ft', factor: 0.3048 },
      { label: 'yd', factor: 0.9144 },
      { label: 'mi', factor: 1609.344 },
    ],
  },
  {
    icon: '⚖️', name: 'Weight',
    units: [
      { label: 'mg', factor: 0.000001 },
      { label: 'g', factor: 0.001 },
      { label: 'kg', factor: 1 },
      { label: 't', factor: 1000 },
      { label: 'oz', factor: 0.028349523 },
      { label: 'lb', factor: 0.45359237 },
      { label: 'st', factor: 6.35029318 },
    ],
  },
  {
    icon: '🌡️', name: 'Temperature',
    units: [
      { label: '°C', factor: 1 },
      { label: '°F', factor: 1 },
      { label: 'K', factor: 1 },
    ],
  },
  {
    icon: '🧴', name: 'Volume',
    units: [
      { label: 'ml', factor: 0.001 },
      { label: 'cl', factor: 0.01 },
      { label: 'dl', factor: 0.1 },
      { label: 'l', factor: 1 },
      { label: 'm³', factor: 1000 },
      { label: 'tsp', factor: 0.00492892 },
      { label: 'tbsp', factor: 0.01478676 },
      { label: 'fl oz', factor: 0.02957353 },
      { label: 'cup', factor: 0.23658824 },
      { label: 'pt', factor: 0.47317647 },
      { label: 'gal', factor: 3.78541178 },
    ],
  },
  {
    icon: '🚀', name: 'Speed',
    units: [
      { label: 'm/s', factor: 1 },
      { label: 'km/h', factor: 0.27777778 },
      { label: 'mph', factor: 0.44704 },
      { label: 'kn', factor: 0.51444444 },
      { label: 'ft/s', factor: 0.3048 },
    ],
  },
  {
    icon: '⬛', name: 'Area',
    units: [
      { label: 'mm²', factor: 0.000001 },
      { label: 'cm²', factor: 0.0001 },
      { label: 'm²', factor: 1 },
      { label: 'km²', factor: 1_000_000 },
      { label: 'ha', factor: 10_000 },
      { label: 'in²', factor: 0.00064516 },
      { label: 'ft²', factor: 0.09290304 },
      { label: 'ac', factor: 4046.8564 },
      { label: 'mi²', factor: 2_589_988.11 },
    ],
  },
];

function toBase(value: number, unit: Unit, catName: string): number {
  if (catName === 'Temperature') {
    if (unit.label === '°C') return value;
    if (unit.label === '°F') return (value - 32) * 5 / 9;
    return value - 273.15;
  }
  return value * unit.factor;
}

function fromBase(base: number, unit: Unit, catName: string): number {
  if (catName === 'Temperature') {
    if (unit.label === '°C') return base;
    if (unit.label === '°F') return base * 9 / 5 + 32;
    return base + 273.15;
  }
  return base / unit.factor;
}

function fmt(n: number): string {
  if (!isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 1e9) return n.toExponential(3);
  if (abs >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  if (abs >= 1) return +n.toPrecision(7) + '';
  return +n.toPrecision(4) + '';
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  padding: '1.25rem',
  boxShadow: 'var(--card-shadow)',
};

const inputStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  fontSize: '28px',
  fontWeight: '300',
  width: '100%',
  outline: 'none',
  minWidth: 0,
};

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#fff',
  padding: '4px 8px',
  fontSize: '12px',
  outline: 'none',
  flexShrink: 0,
};

const rowStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px',
  padding: '1rem',
};

export default function UnitConverter() {
  const [catIdx, setCatIdx] = useState(0);
  const cat = CATEGORIES[catIdx];

  const [fromIdx, setFromIdx] = useState(2);
  const [toIdx, setToIdx] = useState(3);
  const [input, setInput] = useState('1');

  const safeFrom = Math.min(fromIdx, cat.units.length - 1);
  const safeTo = Math.min(toIdx, cat.units.length - 1);

  const fromUnit = cat.units[safeFrom];
  const toUnit = cat.units[safeTo];

  const base = toBase(parseFloat(input) || 0, fromUnit, cat.name);
  const result = fromBase(base, toUnit, cat.name);

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

  return (
    <div className="card" style={cardStyle}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        📐 Unit Converter
      </h2>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginBottom: '1rem',
      }}>
        {CATEGORIES.map((c, i) => (
          <button
            key={c.name}
            onClick={() => switchCategory(i)}
            style={{
              background: i === catIdx
                ? 'linear-gradient(135deg, var(--purple), #7A3FFF)'
                : 'rgba(255,255,255,0.05)',
              border: i === catIdx
                ? 'none'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: i === catIdx ? '#fff' : 'var(--text2)',
              padding: '5px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{c.icon}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* From */}
      <div style={rowStyle}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>From</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={inputStyle}
          />
          <select
            value={safeFrom}
            onChange={e => setFromIdx(Number(e.target.value))}
            style={selectStyle}
          >
            {cat.units.map((u, i) => (
              <option key={u.label} value={i}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap */}
      <div style={{ textAlign: 'center', margin: '-.25rem 0', position: 'relative', zIndex: 1 }}>
        <button
          onClick={swap}
          style={{
            background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >⇅</button>
      </div>

      {/* To */}
      <div style={{ ...rowStyle, marginTop: '.75rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>To</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ ...inputStyle, color: 'var(--blue2)', fontSize: '28px', display: 'flex', alignItems: 'center' }}>
            {fmt(result)}
          </div>
          <select
            value={safeTo}
            onChange={e => setToIdx(Number(e.target.value))}
            style={selectStyle}
          >
            {cat.units.map((u, i) => (
              <option key={u.label} value={i}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rate hint */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        padding: '.5rem 1rem',
        fontSize: '12px',
        color: 'var(--text3)',
        textAlign: 'center',
        marginTop: '.75rem',
      }}>
        1 {fromUnit.label} = {fmt(fromBase(toBase(1, fromUnit, cat.name), toUnit, cat.name))} {toUnit.label}
      </div>

      {/* Quick reference grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '.5rem',
        marginTop: '.75rem',
      }}>
        {cat.units.filter((_, i) => i !== safeFrom).slice(0, 6).map(u => {
          const v = fromBase(base, u, cat.name);
          return (
            <div
              key={u.label}
              onClick={() => setToIdx(cat.units.indexOf(u))}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '.625rem .875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{u.label}</span>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>{fmt(v)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
