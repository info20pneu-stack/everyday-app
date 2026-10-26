'use client';

import { useState } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';
import { fmtDecimal, fmtNumber } from '../../lib/formatNumber';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolCard, ToolCards, ToolField, ToolHero, useShare } from './tools/ToolFrame';

type System = 'metric' | 'imperial';
type Gender = 'male' | 'female';

type Category = {
  label: string;
  color: string;
  bg: string;
  min: number;
  max: number;
};

function getCategories(t: Translations): Category[] {
  return [
    { label: t.bmi.cat_severeUnderweight, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', min: 0, max: 16 },
    { label: t.bmi.cat_underweight, color: '#93c5fd', bg: 'rgba(147,197,253,0.12)', min: 16, max: 18.5 },
    { label: t.bmi.cat_normal, color: '#4ade80', bg: 'rgba(74,222,128,0.15)', min: 18.5, max: 25 },
    { label: t.bmi.cat_overweight, color: '#facc15', bg: 'rgba(250,204,21,0.15)', min: 25, max: 30 },
    { label: t.bmi.cat_obesity1, color: '#fb923c', bg: 'rgba(251,146,60,0.15)', min: 30, max: 35 },
    { label: t.bmi.cat_obesity2, color: '#f87171', bg: 'rgba(248,113,113,0.15)', min: 35, max: 40 },
    { label: t.bmi.cat_obesity3, color: '#dc2626', bg: 'rgba(220,38,38,0.15)', min: 40, max: 999 },
  ];
}

function getCategory(categories: Category[], bmi: number): Category {
  return categories.find(c => bmi >= c.min && bmi < c.max) ?? categories[categories.length - 1];
}

function getRecommendations(t: Translations, bmi: number, age: number, gender: Gender): string[] {
  const recs: string[] = [];
  if (bmi < 16) {
    recs.push(t.bmi.rec_seekMedical);
    recs.push(t.bmi.rec_increaseCalories);
    recs.push(t.bmi.rec_proteinFats);
  } else if (bmi < 18.5) {
    recs.push(t.bmi.rec_gradualIncrease);
    recs.push(t.bmi.rec_strengthTraining);
    recs.push(t.bmi.rec_nutritionist);
  } else if (bmi < 25) {
    recs.push(t.bmi.rec_maintainLifestyle);
    recs.push(t.bmi.rec_stayActive);
    recs.push(t.bmi.rec_balancedDiet);
  } else if (bmi < 30) {
    recs.push(t.bmi.rec_reduceCalories);
    recs.push(t.bmi.rec_addCardio);
    recs.push(t.bmi.rec_limitSugar);
  } else if (bmi < 35) {
    recs.push(t.bmi.rec_consultDoctor);
    recs.push(t.bmi.rec_suitableActivity);
    recs.push(t.bmi.rec_monitorBP);
  } else {
    recs.push(t.bmi.rec_professionalHelp);
    recs.push(t.bmi.rec_multidisciplinary);
    recs.push(t.bmi.rec_regularCheckups);
  }

  if (age >= 65 && bmi < 22) {
    recs.push(t.bmi.rec_olderAgeBMI);
  }
  if (gender === 'female' && bmi >= 18.5 && bmi < 25) {
    recs.push(t.bmi.rec_calcium);
  }
  if (gender === 'male' && bmi >= 25) {
    recs.push(t.bmi.rec_cardiovascular);
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

export default function BMI() {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
  const { share, done } = useShare();
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

  const categories = getCategories(t);
  const bmi = calcBMI();
  const cat = bmi !== null ? getCategory(categories, bmi) : null;
  const ageN = parseInt(age) || 0;
  const recs = bmi !== null && ageN >= 2 ? getRecommendations(t, bmi, ageN, gender) : [];
  const idealRange = idealWeightRange();
  const markerPct = bmi !== null ? bmiToPercent(bmi) : null;
  const weightUnit = system === 'metric' ? 'kg' : 'lb';

  const fmtW = (n: number) => fmtDecimal(n, lang, 1);

  return (
    <ToolFrame toolId="bmi">
      <div className="tf-panel">
        <div className="bmi-toggles">
          <div className="tf-chips" role="group" aria-label={t.bmi.title}>
            {(['metric', 'imperial'] as System[]).map(sys => (
              <button key={sys} type="button" className={`tf-chip${system === sys ? ' is-on' : ''}`} aria-pressed={system === sys} onClick={() => setSystem(sys)}>
                {sys === 'metric' ? t.bmi.metric : t.bmi.imperial}
              </button>
            ))}
          </div>
          <div className="tf-chips" role="group" aria-label={s.gender}>
            {([['male', t.bmi.male], ['female', t.bmi.female]] as [Gender, string][]).map(([g, label]) => (
              <button key={g} type="button" className={`tf-chip${gender === g ? ' is-on' : ''}`} aria-pressed={gender === g} onClick={() => setGender(g)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {system === 'metric' ? (
          <div className="tf-row">
            <ToolField label={t.bmi.heightCm} htmlFor="bmi-h">
              <input id="bmi-h" type="number" inputMode="decimal" className="tf-input" value={heightCm} onChange={e => setHeightCm(e.target.value)} min="50" max="280" />
            </ToolField>
            <ToolField label={t.bmi.weightKg} htmlFor="bmi-w">
              <input id="bmi-w" type="number" inputMode="decimal" className="tf-input" value={weightKg} onChange={e => setWeightKg(e.target.value)} min="10" max="500" />
            </ToolField>
            <ToolField label={t.bmi.ageYears} htmlFor="bmi-a">
              <input id="bmi-a" type="number" inputMode="numeric" className="tf-input" value={age} onChange={e => setAge(e.target.value)} min="2" max="120" />
            </ToolField>
          </div>
        ) : (
          <>
            <ToolField label={s.height} htmlFor="bmi-ft">
              <div className="tf-row">
                <input id="bmi-ft" type="number" inputMode="numeric" className="tf-input" value={heightFt} onChange={e => setHeightFt(e.target.value)} min="1" max="9" aria-label={t.bmi.ft} placeholder={t.bmi.ft} />
                <span className="bmi-unit">{t.bmi.ft}</span>
                <input type="number" inputMode="numeric" className="tf-input" value={heightIn} onChange={e => setHeightIn(e.target.value)} min="0" max="11" aria-label={t.bmi.in} placeholder={t.bmi.in} />
                <span className="bmi-unit">{t.bmi.in}</span>
              </div>
            </ToolField>
            <div className="tf-row">
              <ToolField label={t.bmi.weightLb} htmlFor="bmi-lb">
                <input id="bmi-lb" type="number" inputMode="decimal" className="tf-input" value={weightLb} onChange={e => setWeightLb(e.target.value)} min="20" max="1000" />
              </ToolField>
              <ToolField label={t.bmi.ageYears} htmlFor="bmi-a2">
                <input id="bmi-a2" type="number" inputMode="numeric" className="tf-input" value={age} onChange={e => setAge(e.target.value)} min="2" max="120" />
              </ToolField>
            </div>
          </>
        )}
      </div>

      {bmi === null || !cat ? (
        <div className="tf-note" style={{ padding: '2rem 0' }}>{t.bmi.enterAll}</div>
      ) : (
        <>
          <ToolHero
            label={t.bmi.bodyMassIndex}
            value={fmtDecimal(bmi, lang, 1)}
            sub={<span style={{ color: cat.color, fontSize: 16, fontWeight: 800 }}>{cat.label}</span>}
          >
            {/* Scale (always left → right, like the numbers) */}
            <div className="bmi-scale" dir="ltr">
              <div className="bmi-bar" style={{ background: scaleGradient() }}>
                <div className="bmi-marker" style={{ left: `${markerPct}%`, background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
              </div>
              <div className="bmi-ticks">
                {[16, 18.5, 25, 30, 35, 40].map(b => (
                  <span key={b} style={{ left: `${bmiToPercent(b)}%` }}>{b % 1 ? fmtDecimal(b, lang, 1) : fmtNumber(b, lang)}</span>
                ))}
              </div>
            </div>
          </ToolHero>

          {idealRange && (
            <ToolCards>
              <ToolCard wide icon="⚖️" color="#4ADE80" label={t.bmi.idealWeightRange}
                value={<span dir="ltr">{fmtW(idealRange[0])} – {fmtW(idealRange[1])} {weightUnit}</span>} />
            </ToolCards>
          )}

          {recs.length > 0 && (
            <div className="tf-panel">
              <div className="tf-label">💡 {t.bmi.recommendations}</div>
              <ul className="bmi-recs">
                {recs.map((r, i) => <li key={i} style={{ '--dot': cat.color } as React.CSSProperties}>{r}</li>)}
              </ul>
            </div>
          )}

          <ToolButton onClick={() => share(`${t.bmi.bodyMassIndex}: ${fmtDecimal(bmi, lang, 1)} – ${cat.label}\nhttps://www.everyday1234567.com/bmi`)}>
            {done ? s.copied : <>📤 {s.share}</>}
          </ToolButton>
        </>
      )}

      <style>{`
        .bmi-toggles { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .bmi-unit { flex: 0 0 auto !important; align-self: center; font-size: 13px; color: var(--tf-dim); }
        .bmi-scale { margin-top: 16px; }
        .bmi-bar { position: relative; height: 12px; border-radius: 6px; }
        .bmi-marker {
          position: absolute; top: 50%; transform: translate(-50%, -50%); width: 22px; height: 22px; border-radius: 50%;
          border: 3px solid #0E1238; transition: left .3s ease;
        }
        .bmi-ticks { position: relative; height: 18px; margin-top: 6px; }
        .bmi-ticks span { position: absolute; transform: translateX(-50%); font-size: 11px; color: var(--tf-dim); }
        .bmi-recs { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .bmi-recs li { position: relative; padding-inline-start: 16px; font-size: 13px; line-height: 1.5; color: rgba(236,238,255,.88); }
        .bmi-recs li::before { content: ''; position: absolute; inset-inline-start: 0; top: 7px; width: 7px; height: 7px; border-radius: 50%; background: var(--dot); }
      `}</style>
    </ToolFrame>
  );
}
