'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Globe, { type GlobeInstance } from 'globe.gl';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useLang } from '../../lib/LanguageContext';
import { useInstallPrompt } from '../../lib/useInstallPrompt';
import { GLOBE_CITIES, GLOBE_ARCS, type GlobeCity } from '../../lib/globeCities';

// NASA night-lights composite, bundled as an example asset of the three-globe package.
const NIGHT_IMG = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';

type ArcDatum = { startLat: number; startLng: number; endLat: number; endLng: number };

function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

// Heuristic only — low core count or low device memory suggests the 3D globe
// (Three.js + bloom postprocessing) would hurt rather than impress.
function isLikelyWeakDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem > 0 && mem <= 2) return true;
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores > 0 && cores <= 2) return true;
  return false;
}

export default function GlobeHero() {
  const { t, lang } = useLang();
  const { canInstall, promptInstall } = useInstallPrompt();
  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<GlobeCity | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [now, setNow] = useState(() => new Date());
  const [canRender3D] = useState(() => detectWebGL() && !isLikelyWeakDevice());
  const [inView, setInView] = useState(false);

  // Lazy-load: only start the heavy 3D init once the hero has actually
  // scrolled into view, so it never competes with the initial page render.
  useEffect(() => {
    if (!canRender3D) return;
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) { setInView(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [canRender3D]);

  const shouldRender3D = canRender3D && inView;

  useEffect(() => {
    if (!shouldRender3D) return;
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, [shouldRender3D]);

  useEffect(() => {
    if (!shouldRender3D) return;
    const el = containerRef.current;
    if (!el) return;

    const arcsData: ArcDatum[] = GLOBE_ARCS.map(([a, b]) => {
      const from = GLOBE_CITIES.find(c => c.name === a)!;
      const to = GLOBE_CITIES.find(c => c.name === b)!;
      return { startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng };
    });

    const globe: GlobeInstance = new Globe(el, { animateIn: true })
      .globeImageUrl(NIGHT_IMG)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#3B82F6')
      .atmosphereAltitude(0.22)
      .pointsData(GLOBE_CITIES)
      .pointLat('lat')
      .pointLng('lng')
      .pointLabel(() => '')
      .pointColor(() => '#FF9500')
      .pointAltitude(0.012)
      .pointRadius(0.45)
      .pointResolution(12)
      .arcsData(arcsData)
      .arcStartLat((d: object) => (d as ArcDatum).startLat)
      .arcStartLng((d: object) => (d as ArcDatum).startLng)
      .arcEndLat((d: object) => (d as ArcDatum).endLat)
      .arcEndLng((d: object) => (d as ArcDatum).endLng)
      .arcColor(() => ['rgba(59,130,246,0.65)', 'rgba(147,197,253,0.95)'])
      .arcDashLength(0.4)
      .arcDashGap(2)
      .arcDashInitialGap(() => Math.random() * 4)
      .arcDashAnimateTime(3000)
      .arcStroke(0.4)
      .arcAltitude(0.22)
      .onPointHover(point => setHovered(point as GlobeCity | null));

    const isPhone = window.matchMedia('(max-width: 480px), (pointer: coarse)').matches;

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    // On touch screens a drag over the globe must scroll the page, not spin it.
    if (isPhone) controls.enabled = false;

    // Phones: cap pixel ratio and skip bloom — the extra GPU passes cost more than they add.
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone ? 1.5 : 2));
    // Bloom so city lights + point markers actually glow against the dark night texture.
    const bloom = isPhone ? null : new UnrealBloomPass(new THREE.Vector2(el.clientWidth || 1, el.clientHeight || 1), 0.6, 0.4, 0.85);
    if (bloom) globe.postProcessingComposer().addPass(bloom);

    // Stop rendering while the hero is scrolled out of view.
    const visIo = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) globe.resumeAnimation();
      else globe.pauseAnimation();
    });
    visIo.observe(el);

    function handleMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    el.addEventListener('mousemove', handleMouseMove);

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        globe.width(width).height(height);
        bloom?.setSize(width, height);
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      visIo.disconnect();
      el.removeEventListener('mousemove', handleMouseMove);
      globe._destructor();
      el.innerHTML = '';
    };
  }, [shouldRender3D]);

  function cityTime(tz: string) {
    return new Intl.DateTimeFormat(lang, {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
  }

  function scrollToTiles() {
    document.querySelector('.dash-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <div ref={heroRef} className="globe-hero hero-section">
        {shouldRender3D && <div ref={containerRef} className="globe-hero-canvas" />}

        <div className="globe-hero-overlay">
          <h1 className="globe-hero-title">EVERY <span>DAY</span></h1>
          <p className="globe-hero-tagline">Everything you need. Every day.</p>
          <div className="globe-hero-actions">
            <button type="button" className="globe-hero-btn-primary" onClick={scrollToTiles}>
              {t.buttons.exploreNow}
            </button>
            {canInstall && (
              <button type="button" className="globe-hero-btn-outline" onClick={promptInstall}>
                Add to Home Screen
              </button>
            )}
          </div>
        </div>

        {shouldRender3D && hovered && (
          <div className="globe-tooltip" style={{ left: mousePos.x + 18, top: mousePos.y + 18 }}>
            <span className="globe-tooltip-flag">{hovered.flag}</span>
            <div>
              <div className="globe-tooltip-city">{hovered.name}</div>
              <div className="globe-tooltip-time tabular-nums">{cityTime(hovered.tz)}</div>
            </div>
          </div>
        )}
      </div>

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
