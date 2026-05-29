'use client';

import { memo } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';
import AdBanner from './AdBanner';
import LazyWidget from './LazyWidget';
import MobileDashboard from './MobileDashboard';
import WorldTime from './WorldTime';
import Currency from './Currency';
import UnitConverter from './UnitConverter';
import DateCounter from './DateCounter';
import AgeCalculator from './AgeCalculator';
import Weather from './Weather';
import Sports from './Sports';
import Rankings from './Rankings';
import Crypto from './Crypto';
import DailyBoost from './DailyBoost';
import DailyGames from './DailyGames';
import HumanBenchmark from './HumanBenchmark';
import Markets from './Markets';
import IPAddress from './IPAddress';
import SpeedTest from './SpeedTest';
import PasswordGenerator from './PasswordGenerator';
import SunriseSunset from './SunriseSunset';
import BMI from './BMI';

function MainContent() {
  const { isMobile, isTablet } = useDeviceDetect();
  const showTiles = isMobile || isTablet;

  if (showTiles) {
    return <MobileDashboard />;
  }

  return (
    <div className="widget-grid">
      {/* Row 1 — above fold, load immediately */}
      <WorldTime />
      <Currency />
      <UnitConverter />

      <div className="ad-span" style={{ gridColumn: '1 / -1' }}>
        <AdBanner variant="inline" slot="2222222222" />
      </div>

      {/* Row 2 */}
      <LazyWidget height={320}><DateCounter /></LazyWidget>
      <LazyWidget height={360}><AgeCalculator /></LazyWidget>
      <LazyWidget height={440}><Weather /></LazyWidget>

      {/* Row 3 */}
      <LazyWidget height={460}><Sports /></LazyWidget>
      <LazyWidget height={420}><Rankings /></LazyWidget>
      <LazyWidget height={500}><Crypto /></LazyWidget>

      <div className="ad-span" style={{ gridColumn: '1 / -1' }}>
        <AdBanner variant="inline" slot="3333333333" />
      </div>

      {/* Row 4 */}
      <LazyWidget height={400}><DailyBoost /></LazyWidget>
      <LazyWidget height={460}><DailyGames /></LazyWidget>
      <LazyWidget height={380}><Markets /></LazyWidget>

      {/* Row 5 */}
      <LazyWidget height={300}><IPAddress /></LazyWidget>
      <LazyWidget height={340}><SpeedTest /></LazyWidget>
      <LazyWidget height={400}><PasswordGenerator /></LazyWidget>

      {/* Row 6 */}
      <LazyWidget height={380}><SunriseSunset /></LazyWidget>
      <LazyWidget height={360}><BMI /></LazyWidget>
      <LazyWidget height={560}><HumanBenchmark /></LazyWidget>
    </div>
  );
}

export default memo(MainContent);
