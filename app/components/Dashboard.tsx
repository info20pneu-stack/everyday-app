'use client';

import { useState, lazy, Suspense } from 'react';
import AdBanner from './AdBanner';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';

/* ─── Lazy widget imports ─── */
const WorldTime          = lazy(() => import('./WorldTime'));
const Currency           = lazy(() => import('./Currency'));
const Weather            = lazy(() => import('./Weather'));
const Sports             = lazy(() => import('./Sports'));
const Crypto             = lazy(() => import('./Crypto'));
const Markets            = lazy(() => import('./Markets'));
const DailyGames         = lazy(() => import('./DailyGames'));
const DailyBoost         = lazy(() => import('./DailyBoost'));
const Rankings           = lazy(() => import('./Rankings'));
const AgeCalculator      = lazy(() => import('./AgeCalculator'));
const DateCounter        = lazy(() => import('./DateCounter'));
const UnitConverter      = lazy(() => import('./UnitConverter'));
const News               = lazy(() => import('./News'));
const CelebrityBirthdays = lazy(() => import('./CelebrityBirthdays'));
const SunriseSunset      = lazy(() => import('./SunriseSunset'));
const IPAddress          = lazy(() => import('./IPAddress'));
const SpeedTest          = lazy(() => import('./SpeedTest'));
const PasswordGenerator  = lazy(() => import('./PasswordGenerator'));
const BMI                = lazy(() => import('./BMI'));
const SuggestClient      = lazy(() => import('../suggest/SuggestClient'));

/* ─── Tile definitions ── 7 rows × 3, last row 2 ─── */
function getTiles(t: Translations) {
  return [
    /* Row 1 */
    { id: 'worldTime'      as const, icon: '🕐', label: 'WORLD TIME',          desc: t.dashboard.desc_worldTime,      Widget: WorldTime },
    { id: 'currency'       as const, icon: '💵', label: 'CURRENCY',             desc: t.dashboard.desc_currency,       Widget: Currency },
    { id: 'weather'        as const, icon: '🌤️', label: 'WEATHER',             desc: t.dashboard.desc_weather,        Widget: Weather },
    /* Row 2 */
    { id: 'sports'         as const, icon: '🏆', label: 'SPORTS CENTER',        desc: t.dashboard.desc_sports,         Widget: Sports },
    { id: 'crypto'         as const, icon: '₿',  label: 'CRYPTO',               desc: t.dashboard.desc_crypto,         Widget: Crypto },
    { id: 'markets'        as const, icon: '📊', label: 'MARKETS',              desc: t.dashboard.desc_markets,        Widget: Markets },
    /* Row 3 */
    { id: 'dailyGames'     as const, icon: '🎮', label: 'DAILY GAMES',          desc: t.dashboard.desc_dailyGames,     Widget: DailyGames },
    { id: 'dailyBoost'     as const, icon: '⚡', label: 'DAILY BOOST',          desc: t.dashboard.desc_dailyBoost,     Widget: DailyBoost },
    { id: 'rankings'       as const, icon: '📈', label: 'RANKINGS',             desc: t.dashboard.desc_rankings,       Widget: Rankings },
    /* Row 4 */
    { id: 'ageCalculator'  as const, icon: '👤', label: 'AGE CALCULATOR',       desc: t.dashboard.desc_ageCalculator,  Widget: AgeCalculator },
    { id: 'dateCounter'    as const, icon: '⏳', label: 'DATE COUNTER',         desc: t.dashboard.desc_dateCounter,    Widget: DateCounter },
    { id: 'unitConverter'  as const, icon: '📐', label: 'UNIT CONVERTER',       desc: t.dashboard.desc_unitConverter,  Widget: UnitConverter },
    /* Row 5 */
    { id: 'news'           as const, icon: '📰', label: 'NEWS',                 desc: t.dashboard.desc_news,           Widget: News },
    { id: 'celebBirthdays' as const, icon: '🎂', label: 'CELEBRITY BIRTHDAYS',  desc: t.dashboard.desc_celebBirthdays, Widget: CelebrityBirthdays },
    { id: 'sunriseSunset'  as const, icon: '🌅', label: 'SUNRISE & SUNSET',     desc: t.dashboard.desc_sunriseSunset,  Widget: SunriseSunset },
    /* Row 6 */
    { id: 'ipAddress'      as const, icon: '🌐', label: 'IP ADDRESS',           desc: t.dashboard.desc_ipAddress,      Widget: IPAddress },
    { id: 'speedTest'      as const, icon: '🚀', label: 'SPEED TEST',           desc: t.dashboard.desc_speedTest,      Widget: SpeedTest },
    { id: 'passwordGen'    as const, icon: '🔑', label: 'PASSWORD GENERATOR',   desc: t.dashboard.desc_passwordGen,    Widget: PasswordGenerator },
    /* Row 7 */
    { id: 'bmi'            as const, icon: '⚖️', label: 'BMI CALCULATOR',      desc: t.dashboard.desc_bmi,            Widget: BMI },
    { id: 'suggestVote'    as const, icon: '💡', label: 'SUGGEST & VOTE',       desc: t.dashboard.desc_suggestVote,    Widget: SuggestClient },
  ];
}

type TileId = ReturnType<typeof getTiles>[number]['id'];

/* ─── Ad after every 2 rows (6 tiles): indices 5, 11, 17 ─── */
const AD_AFTER = new Set([5, 11, 17]);
const AD_SLOTS = ['2222222222', '3333333333', '4444444444'];

/* ─── Loading fallback ─── */
function WidgetSkeleton({ text }: { text: string }) {
  return (
    <div style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '2rem',
      minHeight: '280px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text3)',
      fontSize: '14px',
    }}>
      {text}
    </div>
  );
}

/* ─── Main component ─── */
export default function Dashboard() {
  const { t } = useLang();
  const [activeId, setActiveId] = useState<TileId | null>(null);
  const TILES = getTiles(t);

  /* ── Widget detail view ── */
  if (activeId) {
    const tile = TILES.find(x => x.id === activeId)!;
    const { Widget } = tile;

    return (
      <div key={activeId} style={{ animation: 'slideInLeft 0.3s ease both' }}>

        {/* Back bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: 'var(--text2)',
              fontSize: '13px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(93,76,255,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
            }}
          >
            {t.dashboard.back}
          </button>
          <span style={{
            fontSize: '11px', color: 'var(--text3)',
            fontFamily: 'Poppins', letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            {tile.icon} {tile.label}
          </span>
        </div>

        {/* Ad banner — key forces fresh mount + ad refresh on each open */}
        <div style={{ marginBottom: '1.25rem' }}>
          <AdBanner key={activeId} variant="inline" slot="2222222222" />
        </div>

        {/* Widget */}
        <Suspense fallback={<WidgetSkeleton text={t.dashboard.loading} />}>
          <Widget />
        </Suspense>
      </div>
    );
  }

  /* ── Tile grid ── */
  let adUsed = 0;
  const items: React.ReactNode[] = [];

  TILES.forEach((tile, i) => {
    items.push(
      <button
        key={tile.id}
        onClick={() => setActiveId(tile.id)}
        className="card"
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '8px',
          background: 'rgba(15,20,40,0.92)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--card-radius)',
          padding: '20px 10px',
          cursor: 'pointer',
          textAlign: 'center',
          width: '100%',
          boxShadow: 'var(--card-shadow)',
          animation: `widgetIn 0.4s ease ${0.03 + i * 0.025}s both`,
        }}
      >
        <span style={{ fontSize: '32px', lineHeight: 1 }}>{tile.icon}</span>
        <span style={{
          fontSize: '10px', fontWeight: '700', letterSpacing: '1px',
          color: '#fff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.2,
        }}>
          {tile.label}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text3)', lineHeight: 1.35 }}>
          {tile.desc}
        </span>
      </button>
    );

    if (AD_AFTER.has(i) && adUsed < AD_SLOTS.length) {
      items.push(
        <div key={`ad-${i}`} style={{ gridColumn: '1 / -1', margin: '4px 0' }}>
          <AdBanner variant="inline" slot={AD_SLOTS[adUsed++]} />
        </div>
      );
    }
  });

  return <div className="dash-grid">{items}</div>;
}
