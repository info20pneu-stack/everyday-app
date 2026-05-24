'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceOS   = 'ios' | 'android' | 'other';

export interface DeviceInfo {
  /** Viewport-based device class */
  type: DeviceType;
  /** Operating system from UA */
  os: DeviceOS;

  isMobile:  boolean;
  isTablet:  boolean;
  isDesktop: boolean;

  isIOS:     boolean;
  isAndroid: boolean;

  /** true when primary pointer is coarse (touch screen) */
  isTouchDevice: boolean;

  /**
   * Recommended list length for the current device.
   * Use it to slice long data arrays in widgets.
   * mobile → 8  |  tablet → 12  |  desktop → Infinity
   */
  listLimit: number;

  /**
   * Whether to render heavy SVG charts (sparklines etc.).
   * false on mobile to reduce layout work.
   */
  showCharts: boolean;
}

const DESKTOP_DEFAULT: DeviceInfo = {
  type: 'desktop',
  os: 'other',
  isMobile:  false,
  isTablet:  false,
  isDesktop: true,
  isIOS:     false,
  isAndroid: false,
  isTouchDevice: false,
  listLimit:  Infinity,
  showCharts: true,
};

function detectOS(ua: string): DeviceOS {
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

function detectFromWidth(width: number): DeviceType {
  if (width <= 480) return 'mobile';
  if (width <= 768) return 'tablet';
  return 'desktop';
}

function build(width: number, ua: string): DeviceInfo {
  const os       = detectOS(ua);
  // iPad on iOS 13+ reports desktop UA — check maxTouchPoints as fallback
  const isIPad   = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  const iosFixed = isIPad ? 'ios' : os;

  const touch = window.matchMedia?.('(pointer: coarse)').matches
    ?? (navigator.maxTouchPoints > 0);

  // If UA says desktop but touch screen detected → treat as tablet
  let type = detectFromWidth(width);
  if (type === 'desktop' && touch && isIPad) type = 'tablet';

  const isMobile  = type === 'mobile';
  const isTablet  = type === 'tablet';
  const isDesktop = type === 'desktop';

  return {
    type,
    os: iosFixed,
    isMobile,
    isTablet,
    isDesktop,
    isIOS:     iosFixed === 'ios',
    isAndroid: iosFixed === 'android',
    isTouchDevice: touch,
    listLimit:  isMobile ? 8 : isTablet ? 12 : Infinity,
    showCharts: !isMobile,
  };
}

export function useDeviceDetect(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(DESKTOP_DEFAULT);

  useEffect(() => {
    const ua = navigator.userAgent;

    function update() {
      setInfo(build(window.innerWidth, ua));
    }

    update();

    const mq = window.matchMedia('(pointer: coarse)');
    window.addEventListener('resize', update, { passive: true });
    mq.addEventListener?.('change', update);

    return () => {
      window.removeEventListener('resize', update);
      mq.removeEventListener?.('change', update);
    };
  }, []);

  return info;
}
