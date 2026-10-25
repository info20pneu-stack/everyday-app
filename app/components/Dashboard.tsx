'use client';

import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import { useTheme } from '../../lib/ThemeContext';
import { useReveal } from '../../lib/useReveal';
import { TOOLS } from '../../lib/toolsCatalog';
import MyDay from './MyDay';
import DailyPuzzle from './DailyPuzzle';
import EarthHero from './EarthHero';
import ToolsGrid from './ToolsGrid';

const TRENDING_IDS = ['krypto', 'sport', 'cas', 'pocasi', 'trhy', 'meny'];

export default function Dashboard({ imageIds }: { imageIds: string[] }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const heroRef = useReveal<HTMLDivElement>();
  const isRetro = theme === 'xp' || theme === 'win98' || theme === 'win2000';
  const trending = TRENDING_IDS.map(id => TOOLS.find(x => x.id === id)!).filter(Boolean);

  return (
    <>
      {!isRetro && (
        <div ref={heroRef} className="reveal">
          <EarthHero />
        </div>
      )}

      <ToolsGrid imageIds={imageIds} showAllLink />

      <MyDay />
      <DailyPuzzle />

      <div className="trending-section">
        <h3 className="trending-title">🔥 {t.nav.trending}</h3>
        <div className="trending-pills">
          {trending.map(tool => (
            <Link key={tool.id} href={tool.href} className="trending-pill">
              <span>{tool.icon}</span> {t.dashboard[tool.labelKey]}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
