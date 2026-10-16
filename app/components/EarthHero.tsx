'use client';

import { useState } from 'react';
import Image from 'next/image';
import heroEarth from '../../public/images/hero-earth.png';
import { useLang } from '../../lib/LanguageContext';
import { useInstallPrompt } from '../../lib/useInstallPrompt';
import HeroClock from './HeroClock';

export default function EarthHero() {
  const { t } = useLang();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [installHint, setInstallHint] = useState<string | null>(null);

  function scrollToTiles() {
    document.querySelector('.dash-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function addToHomeScreen() {
    if (canInstall) { promptInstall(); return; }
    // No install prompt available (iOS Safari, already installed, unsupported browser) — explain how instead
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setInstallHint(ios ? 'Tap Share, then “Add to Home Screen”.' : 'Open your browser menu and choose “Install app” or “Add to Home screen”.');
  }

  return (
    <>
      <section className="earth-hero hero-section">
        <div className="earth-hero-planet" aria-hidden="true">
          <div className="earth-hero-glow" />
          <Image
            src={heroEarth}
            alt=""
            fill
            preload
            sizes="(max-width: 480px) 100vw, 560px"
            className="earth-hero-img"
          />
        </div>

        <div className="earth-hero-content">
          <h1 className="earth-hero-title">EVERY <span>DAY</span></h1>
          <p className="earth-hero-tagline">Everything you need. Every day.</p>
          <div className="earth-hero-actions">
            <button type="button" className="earth-hero-btn-primary" onClick={scrollToTiles}>
              {t.buttons.exploreNow}
            </button>
            <button type="button" className="earth-hero-btn-outline" onClick={addToHomeScreen}>
              Add to Home Screen
            </button>
          </div>
          {installHint && <p className="earth-hero-hint" role="status">{installHint}</p>}
        </div>

        <HeroClock />
      </section>

      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">50+</span>
          <span className="hero-stat-label">World Cities</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">Live</span>
          <span className="hero-stat-label">Data Updates</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">9</span>
          <span className="hero-stat-label">Tools</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">24/7</span>
          <span className="hero-stat-label">Availability</span>
        </div>
      </div>
    </>
  );
}
