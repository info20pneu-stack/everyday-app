'use client';

import Image from 'next/image';
import heroEarth from '../../public/images/hero-earth-wide.webp';
import HeroClock from './HeroClock';

export default function EarthHero() {
  return (
    <>
      <section className="earth-hero hero-section">
        <Image
          src={heroEarth}
          alt=""
          fill
          preload
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 90vw, 900px"
          className="earth-hero-img"
        />
        {/* Shades keep the text readable: top-left under the title, bottom-left under the time, fade at the bottom */}
        <div className="earth-hero-shade earth-hero-shade-title" aria-hidden="true" />
        <div className="earth-hero-shade earth-hero-shade-corner" aria-hidden="true" />
        <div className="earth-hero-shade earth-hero-shade-bottom" aria-hidden="true" />

        <div className="earth-hero-content">
          <h1 className="earth-hero-title">EVERY <span>DAY</span></h1>
          <p className="earth-hero-tagline">Everything you need. Every day.</p>
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
          <span className="hero-stat-value">20+</span>
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
