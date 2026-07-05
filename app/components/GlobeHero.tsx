'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Globe, { type GlobeInstance } from 'globe.gl';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as solar from 'solar-calculator';
import { useLang } from '../../lib/LanguageContext';
import { GLOBE_CITIES, GLOBE_ARCS, type GlobeCity } from '../../lib/globeCities';

const DAY_IMG = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg';
const NIGHT_IMG = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';

// Official globe.gl day/night recipe (bundled example: day-night-cycle) —
// blends two globe textures using the real solar position for the given time.
const DAY_NIGHT_SHADER = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #define PI 3.141592653589793
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform vec2 sunPosition;
    uniform vec2 globeRotation;
    varying vec3 vNormal;
    varying vec2 vUv;

    float toRad(in float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(in vec2 c) {
      float theta = toRad(90.0 - c.x);
      float phi = toRad(90.0 - c.y);
      return vec3(
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      float invLon = toRad(globeRotation.x);
      float invLat = -toRad(globeRotation.y);
      mat3 rotX = mat3(
        1, 0, 0,
        0, cos(invLat), -sin(invLat),
        0, sin(invLat), cos(invLat)
      );
      mat3 rotY = mat3(
        cos(invLon), 0, sin(invLon),
        0, 1, 0,
        -sin(invLon), 0, cos(invLon)
      );
      vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
      float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv) * 0.6;
      float blendFactor = smoothstep(-0.1, 0.1, intensity);
      gl_FragColor = mix(nightColor, dayColor, blendFactor);
    }
  `,
};

function sunPosAt(dt: number): [number, number] {
  const day = new Date(dt).setUTCHours(0, 0, 0, 0);
  const t = solar.century(dt);
  const longitude = ((day - dt) / 864e5) * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
}

type ArcDatum = { startLat: number; startLng: number; endLat: number; endLng: number };

export default function GlobeHero() {
  const { lang } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<GlobeCity | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: null },
        nightTexture: { value: null },
        sunPosition: { value: new THREE.Vector2() },
        globeRotation: { value: new THREE.Vector2() },
      },
      vertexShader: DAY_NIGHT_SHADER.vertexShader,
      fragmentShader: DAY_NIGHT_SHADER.fragmentShader,
    });

    const loader = new THREE.TextureLoader();
    Promise.all([loader.loadAsync(DAY_IMG), loader.loadAsync(NIGHT_IMG)]).then(([day, night]) => {
      material.uniforms.dayTexture.value = day;
      material.uniforms.nightTexture.value = night;
    });

    const arcsData: ArcDatum[] = GLOBE_ARCS.map(([a, b]) => {
      const from = GLOBE_CITIES.find(c => c.name === a)!;
      const to = GLOBE_CITIES.find(c => c.name === b)!;
      return { startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng };
    });

    const globe: GlobeInstance = new Globe(el, { animateIn: true })
      .globeMaterial(material)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#7A6CFF')
      .atmosphereAltitude(0.2)
      .pointsData(GLOBE_CITIES)
      .pointLat('lat')
      .pointLng('lng')
      .pointLabel(() => '')
      .pointColor(() => '#ffd76b')
      .pointAltitude(0.012)
      .pointRadius(0.45)
      .pointResolution(12)
      .arcsData(arcsData)
      .arcStartLat((d: object) => (d as ArcDatum).startLat)
      .arcStartLng((d: object) => (d as ArcDatum).startLng)
      .arcEndLat((d: object) => (d as ArcDatum).endLat)
      .arcEndLng((d: object) => (d as ArcDatum).endLng)
      .arcColor(() => ['rgba(93,76,255,0.65)', 'rgba(160,130,255,0.95)'])
      .arcDashLength(0.4)
      .arcDashGap(2)
      .arcDashInitialGap(() => Math.random() * 4)
      .arcDashAnimateTime(3000)
      .arcStroke(0.4)
      .arcAltitude(0.22)
      .onPointHover(point => setHovered(point as GlobeCity | null));

    globe.onZoom(({ lng, lat }) => material.uniforms.globeRotation.value.set(lng, lat));

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;

    // Bloom pass so the city points glow without blowing out the globe texture itself.
    const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth || 1, el.clientHeight || 1), 0.5, 0.4, 0.92);
    globe.postProcessingComposer().addPass(bloom);

    let raf = 0;
    (function animate() {
      material.uniforms.sunPosition.value.set(...sunPosAt(Date.now()));
      raf = requestAnimationFrame(animate);
    })();

    function handleMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    el.addEventListener('mousemove', handleMouseMove);

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        globe.width(width).height(height);
        bloom.setSize(width, height);
      }
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('mousemove', handleMouseMove);
      globe._destructor();
      el.innerHTML = '';
    };
  }, []);

  function cityTime(tz: string) {
    return new Intl.DateTimeFormat(lang, {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
  }

  return (
    <div className="globe-hero hero-section">
      <div ref={containerRef} className="globe-hero-canvas" />
      {hovered && (
        <div
          className="globe-tooltip"
          style={{ left: mousePos.x + 18, top: mousePos.y + 18 }}
        >
          <span className="globe-tooltip-flag">{hovered.flag}</span>
          <div>
            <div className="globe-tooltip-city">{hovered.name}</div>
            <div className="globe-tooltip-time tabular-nums">{cityTime(hovered.tz)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
