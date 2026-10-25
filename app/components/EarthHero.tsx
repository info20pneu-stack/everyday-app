'use client';

import Image from 'next/image';
import Link from 'next/link';
import heroEarth from '../../public/images/hero-earth-wide.webp';
import { useLang } from '../../lib/LanguageContext';
import { getNavRoutes } from '../../lib/navRoutes';
import HeroClock from './HeroClock';
import { formatCurrencies } from '../../lib/homeI18n';
import { CURRENCY_COUNT } from '../../lib/currencies';

/** Quick links along the bottom of the hero: nav route id → short description key
 *  (currency has none: it shows the real number of supported currencies). */
const HERO_TILES = [
  { id: 'worldtime', desc: 'worldTimeDesc' },
  { id: 'currency', desc: null },
  { id: 'units', desc: 'convertersDesc' },
  { id: 'weather', desc: 'weatherDesc' },
  { id: 'sports', desc: 'sportsDesc' },
] as const;

export default function EarthHero() {
  const { t, lang } = useLang();
  const routes = getNavRoutes(t);
  const titles: Record<string, string> = {
    worldtime: t.topbar.worldTime,
    currency: t.nav.currency,
    units: t.topbar.converters,
    weather: t.topbar.weather,
    sports: t.topbar.sports,
  };

  return (
    <section className="earth-hero hero-section">
      <Image
        src={heroEarth}
        alt=""
        fill
        preload
        sizes="(max-width: 600px) 100vw, (max-width: 1400px) 90vw, 1200px"
        className="earth-hero-img"
      />
      {/* Shades keep the text readable: under the title, and the lower ~55 % for time and tiles */}
      <div className="earth-hero-shade earth-hero-shade-title" aria-hidden="true" />
      <div className="earth-hero-shade earth-hero-shade-bottom" aria-hidden="true" />

      <div className="earth-hero-content">
        <h1 className="earth-hero-title">EVERY <span>DAY</span></h1>
        <p className="earth-hero-tagline">{t.heroTiles.tagline}</p>
      </div>

      <HeroClock
        below={
          <div className="hero-tiles">
            {HERO_TILES.map(tile => {
              const route = routes.find(r => r.id === tile.id);
              if (!route) return null;
              return (
                <Link key={tile.id} href={route.href} className="hero-tile">
                  <span className="hero-tile-icon" aria-hidden="true">{route.icon}</span>
                  <span className="hero-tile-text">
                    <span className="hero-tile-name">{titles[tile.id]}</span>
                    <span className="hero-tile-desc">
                      {tile.desc ? t.heroTiles[tile.desc] : formatCurrencies(CURRENCY_COUNT, lang)}
                    </span>
                  </span>
                  <span className="hero-tile-arrow" aria-hidden="true">›</span>
                </Link>
              );
            })}
          </div>
        }
      />
    </section>
  );
}
