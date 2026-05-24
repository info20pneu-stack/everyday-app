'use client';

import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';
import AdBanner from './AdBanner';
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
import Markets from './Markets';
import IPAddress from './IPAddress';
import SpeedTest from './SpeedTest';
import PasswordGenerator from './PasswordGenerator';
import SunriseSunset from './SunriseSunset';
import BMI from './BMI';

export default function MainContent() {
  const { isMobile, isTablet } = useDeviceDetect();
  const showTiles = isMobile || isTablet;

  if (showTiles) {
    return <MobileDashboard />;
  }

  return (
    <div className="widget-grid">
      {/* Row 1 */}
      <WorldTime />
      <Currency />
      <UnitConverter />

      <div className="ad-span" style={{ gridColumn: '1 / -1' }}>
        <AdBanner variant="inline" slot="2222222222" />
      </div>

      {/* Row 2 */}
      <DateCounter />
      <AgeCalculator />
      <Weather />

      {/* Row 3 */}
      <Sports />
      <Rankings />
      <Crypto />

      <div className="ad-span" style={{ gridColumn: '1 / -1' }}>
        <AdBanner variant="inline" slot="3333333333" />
      </div>

      {/* Row 4 */}
      <DailyBoost />
      <DailyGames />
      <Markets />

      {/* Row 5 */}
      <IPAddress />
      <SpeedTest />
      <PasswordGenerator />

      {/* Row 6 */}
      <SunriseSunset />
      <BMI />
    </div>
  );
}
