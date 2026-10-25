'use client';

import { useTheme } from '../../lib/ThemeContext';
import { useReveal } from '../../lib/useReveal';
import MyDay from './MyDay';
import DailyTrio from './DailyTrio';
import EarthHero from './EarthHero';
import ToolsGrid from './ToolsGrid';

export default function Dashboard({ imageIds }: { imageIds: string[] }) {
  const { theme } = useTheme();
  const heroRef = useReveal<HTMLDivElement>();
  const isRetro = theme === 'xp' || theme === 'win98' || theme === 'win2000';

  return (
    <>
      {!isRetro && (
        <div ref={heroRef} className="reveal">
          <EarthHero />
        </div>
      )}

      <DailyTrio />
      <MyDay />
      <ToolsGrid imageIds={imageIds} showAllLink />
    </>
  );
}
