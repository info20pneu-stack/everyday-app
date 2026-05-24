'use client';

import { useState } from 'react';

type System = 'metric' | 'imperial';
type Gender = 'male' | 'female';

type Category = {
  label: string;
  color: string;
  bg: string;
  min: number;
  max: number;
};

const CATEGORIES: Category[] = [
  { label: 'Těžká podváha', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', min: 0, max: 16 },
  { label: 'Podváha', color: '#93c5fd', bg: 'rgba(147,197,253,0.12)', min: 16, max: 18.5 },
  { label: 'Normální váha', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', min: 18.5, max: 25 },
  { label: 'Nadváha', color: '#facc15', bg: 'rgba(250,204,21,0.15)', min: 25, max: 30 },
  { label: 'Obezita I.', color: '#fb923c', bg: 'rgba(251,146,60,0.15)', min: 30, max: 35 },
  { label: 'Obezita II.', color: '#f87171', bg: 'rgba(248,113,113,0.15)', min: 35, max: 40 },
  { label: 'Obezita III.', color: '#dc2626', bg: 'rgba(220,38,38,0.15)', min: 40, max: 999 },
];

function getCategory(bmi: number): Category {
  return CATEGORIES.find(c => bmi >= c.min && bmi < c.max) ?? CATEGORIES[CATEGORIES.length - 1];
}

function getRecommendations(bmi: number, age: number, gender: Gender): string[] {
  const recs: string[] = [];
  if (bmi < 16) {
    recs.push('Okamžitě vyhledej odbornou lékařskou pomoc.');
    recs.push('Zvyš příjem kalorií o 500–1000 kcal/den.');
    recs.push('Zaměř se na bílkoviny a zdravé tuky.');
  } else if (bmi < 18.5) {
    recs.push('Postupně zvyš kalorický příjem (300–500 kcal/den).');
    recs.push('Zařaď silový trénink pro nárůst svalové hmoty.');
    recs.push('Konzultuj jídelníček s nutričním specialistou.');
  } else if (bmi < 25) {
    recs.push('Výborně! Udržuj současný životní styl.');
    recs.push('Pravidelná pohybová aktivita 150 min/týden.');
    recs.push('Vyvážená strava bohatá na zeleninu a ovoce.');
  } else if (bmi < 30) {
    recs.push('Sniž příjem kalorií o 300–500 kcal/den.');
    recs.push('Zařaď kardio cvičení min. 30 min denně.');
    recs.push('Omez cukry, alkohol a průmyslově zpracované potraviny.');
  } else if (bmi < 35) {
    recs.push('Konzultuj redukční plán s lékařem nebo nutričním poradcem.');
    recs.push('Pohybová aktivita přizpůsobená fyzickému stavu.');
    recs.push('Sleduj krevní tlak a hladinu cukru v krvi pravidelně.');
  } else {
    recs.push('Vyhledej odbornou lékařskou pomoc co nejdříve.');
    recs.push('Zvažuj multidisciplinární program léčby obezity.');
    recs.push('Pravidelné lékařské kontroly a monitoring zdravotních rizik.');
  }

  if (age >= 65 && bmi < 22) {
    recs.push('Ve vyšším věku je mírně vyšší BMI (22–27) příznivější.');
  }
  if (gender === 'female' && bmi >= 18.5 && bmi < 25) {
    recs.push('Dbej na dostatečný příjem vápníku a vitaminu D.');
  }
  if (gender === 'male' && bmi >= 25) {
    recs.push('U mužů s vyšším BMI je zvýšené riziko kardiovaskulárních onemocnění.');
  }

  return recs;
}

// BMI scale range for the bar: 10 to 45
const SCALE_MIN = 10;
const SCALE_MAX = 45;

function bmiToPercent(bmi: number): number {
  return Math.min(100, Math.max(0, ((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));
}

const SCALE_STOPS = [
  { bmi: 16, color: '#60a5fa' },
  { bmi: 18.5, color: '#93c5fd' },
  { bmi: 25, color: '#4ade80' },
  { bmi: 30, color: '#facc15' },
  { bmi: 35, color: '#fb923c' },
  { bmi: 40, color: '#f87171' },
];

function scaleGradient(): string {
  const stops = [
    `#60a5fa ${bmiToPercent(SCALE_MIN)}%`,
    `#60a5fa ${bmiToPercent(16)}%`,
    `#93c5fd ${bmiToPercent(16)}%`,
    `#93c5fd ${bmiToPercent(18.5)}%`,
    `#4ade80 ${bmiToPercent(18.5)}%`,
    `#4ade80 ${bmiToPercent(25)}%`,
    `#facc15 ${bmiToPercent(25)}%`,
    `#facc15 ${bmiToPercent(30)}%`,
    `#fb923c ${bmiToPercent(30)}%`,
    `#fb923c ${bmiToPercent(35)}%`,
    `#f87171 ${bmiToPercent(35)}%`,
    `#f87171 ${bmiToPercent(40)}%`,
    `#dc2626 ${bmiToPercent(40)}%`,
    `#dc2626 100%`,
  ];
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  padding: '1.25rem',
  boxShadow: 'var(--card-shadow)',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#fff',
  padding: '6px 10px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text3)',
  marginBottom: '4px',
};

export default function BMI() {
  const [system, setSystem] = useState<System>('metric');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('25');
  // metric
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('70');
  // imperial
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('9');
  const [weightLb, setWeightLb] = useState('154');

  function calcBMI(): number | null {
    const ageN = parseInt(age);
    if (!ageN || ageN < 2 || ageN > 120) return null;

    if (system === 'metric') {
      const h = parseFloat(heightCm) / 100;
      const w = parseFloat(weightKg);
      if (!h || !w || h <= 0 || w <= 0) return null;
      return w / (h * h);
    } else {
      const totalIn = parseFloat(heightFt) * 12 + parseFloat(heightIn);
      const w = parseFloat(weightLb);
      if (!totalIn || !w || totalIn <= 0 || w <= 0) return null;
      return (703 * w) / (totalIn * totalIn);
    }
  }

  function idealWeightRange(): [number, number] | null {
    let heightM: number;
    if (system === 'metric') {
      heightM = parseFloat(heightCm) / 100;
    } else {
      const totalIn = parseFloat(heightFt) * 12 + parseFloat(heightIn);
      heightM = totalIn * 0.0254;
    }
    if (!heightM || heightM <= 0) return null;
    const lo = 18.5 * heightM * heightM;
    const hi = 24.9 * heightM * heightM;
    if (system === 'metric') return [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10];
    return [Math.round(lo * 2.20462 * 10) / 10, Math.round(hi * 2.20462 * 10) / 10];
  }

  const bmi = calcBMI();
  const cat = bmi !== null ? getCategory(bmi) : null;
  const ageN = parseInt(age) || 0;
  const recs = bmi !== null && ageN >= 2 ? getRecommendations(bmi, ageN, gender) : [];
  const idealRange = idealWeightRange();
  const markerPct = bmi !== null ? bmiToPercent(bmi) : null;
  const weightUnit = system === 'metric' ? 'kg' : 'lb';

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>
          ⚖️ BMI Kalkulačka
        </h2>
        {/* System toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '2px',
          gap: '2px',
        }}>
          {(['metric', 'imperial'] as System[]).map(s => (
            <button
              key={s}
              onClick={() => setSystem(s)}
              style={{
                background: system === s
                  ? 'linear-gradient(135deg, var(--purple), #7A3FFF)'
                  : 'none',
                border: 'none',
                borderRadius: '6px',
                color: system === s ? '#fff' : 'var(--text2)',
                padding: '3px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: system === s ? '600' : '400',
              }}
            >
              {s === 'metric' ? 'Metrický' : 'Imperiální'}
            </button>
          ))}
        </div>
      </div>

      {/* Gender toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={labelStyle}>Pohlaví</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {([['male', '♂ Muž'], ['female', '♀ Žena']] as [Gender, string][]).map(([g, label]) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              style={{
                flex: 1,
                background: gender === g
                  ? g === 'male'
                    ? 'rgba(96,165,250,0.2)'
                    : 'rgba(244,114,182,0.2)'
                  : 'rgba(255,255,255,0.04)',
                border: gender === g
                  ? g === 'male'
                    ? '1px solid rgba(96,165,250,0.5)'
                    : '1px solid rgba(244,114,182,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: gender === g
                  ? g === 'male' ? '#60a5fa' : '#f472b6'
                  : 'var(--text2)',
                padding: '7px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: gender === g ? '600' : '400',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.625rem', marginBottom: '1rem' }}>
        {/* Height */}
        <div style={{ gridColumn: system === 'imperial' ? 'span 2' : 'span 1' }}>
          {system === 'metric' ? (
            <>
              <div style={labelStyle}>Výška (cm)</div>
              <input
                type="number"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                min="50" max="280"
                style={inputStyle}
              />
            </>
          ) : (
            <>
              <div style={labelStyle}>Výška</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    value={heightFt}
                    onChange={e => setHeightFt(e.target.value)}
                    min="1" max="9"
                    placeholder="ft"
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '2px' }}>ft</div>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    value={heightIn}
                    onChange={e => setHeightIn(e.target.value)}
                    min="0" max="11"
                    placeholder="in"
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginTop: '2px' }}>in</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Weight */}
        {system === 'metric' && (
          <div>
            <div style={labelStyle}>Váha (kg)</div>
            <input
              type="number"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              min="10" max="500"
              style={inputStyle}
            />
          </div>
        )}

        {/* Age */}
        <div>
          <div style={labelStyle}>Věk (roky)</div>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            min="2" max="120"
            style={inputStyle}
          />
        </div>

        {/* Weight imperial */}
        {system === 'imperial' && (
          <div>
            <div style={labelStyle}>Váha (lb)</div>
            <input
              type="number"
              value={weightLb}
              onChange={e => setWeightLb(e.target.value)}
              min="20" max="1000"
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {bmi === null ? (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', padding: '2rem 0' }}>
          Zadej výšku, váhu a věk
        </div>
      ) : (
        <>
          {/* BMI result */}
          <div style={{
            background: cat!.bg,
            border: `1px solid ${cat!.color}33`,
            borderRadius: '14px',
            padding: '1.25rem 1rem',
            marginBottom: '.875rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              Index tělesné hmotnosti
            </div>
            <div style={{
              fontFamily: 'Poppins',
              fontSize: '56px',
              fontWeight: '700',
              color: cat!.color,
              lineHeight: 1,
            }}>
              {bmi.toFixed(1)}
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: cat!.color,
              marginTop: '6px',
            }}>
              {cat!.label}
            </div>
          </div>

          {/* Visual scale */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              position: 'relative',
              height: '12px',
              borderRadius: '6px',
              background: scaleGradient(),
              marginBottom: '6px',
            }}>
              {/* Marker */}
              <div style={{
                position: 'absolute',
                left: `${markerPct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: cat!.color,
                border: '3px solid #0f1428',
                boxShadow: `0 0 8px ${cat!.color}88`,
                transition: 'left 0.3s ease',
              }} />
            </div>
            {/* Scale labels */}
            <div style={{ position: 'relative', height: '14px' }}>
              {[
                { bmi: 16, label: '16' },
                { bmi: 18.5, label: '18.5' },
                { bmi: 25, label: '25' },
                { bmi: 30, label: '30' },
                { bmi: 35, label: '35' },
                { bmi: 40, label: '40' },
              ].map(({ bmi: b, label }) => (
                <span
                  key={b}
                  style={{
                    position: 'absolute',
                    left: `${bmiToPercent(b)}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    color: 'var(--text3)',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Ideal weight range */}
          {idealRange && (
            <div style={{
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '10px',
              padding: '.625rem 1rem',
              marginBottom: '.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Ideální rozsah váhy</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80' }}>
                {idealRange[0]} – {idealRange[1]} {weightUnit}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '.875rem 1rem',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '.5rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                Doporučení
              </div>
              {recs.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  marginBottom: i < recs.length - 1 ? '.375rem' : 0,
                }}>
                  <span style={{ color: cat!.color, fontSize: '10px', marginTop: '3px', flexShrink: 0 }}>●</span>
                  <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
