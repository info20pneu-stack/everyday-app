'use client';

import { useEffect, useRef } from 'react';

export type AdVariant = 'top' | 'sidebar' | 'inline' | 'mobile';

const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';

const VARIANTS: Record<AdVariant, {
  w: number;
  h: number;
  label: string;
  format: string;
  responsive: boolean;
}> = {
  top:     { w: 728, h: 90,  label: 'Leaderboard 728×90',        format: 'horizontal',  responsive: true },
  sidebar: { w: 300, h: 250, label: 'Medium Rectangle 300×250',  format: 'rectangle',   responsive: false },
  inline:  { w: 728, h: 90,  label: 'Leaderboard 728×90',        format: 'horizontal',  responsive: true },
  mobile:  { w: 320, h: 100, label: 'Mobile Banner 320×100',     format: 'banner',      responsive: false },
};

interface AdBannerProps {
  variant: AdVariant;
  slot?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle: any[];
  }
}

export default function AdBanner({ variant, slot = '0000000000' }: AdBannerProps) {
  const { w, h, label, format, responsive } = VARIANTS[variant];
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({} as never);
    } catch {}
  }, []);

  const isPlaceholder = AD_CLIENT.includes('XXXX') || slot === '0000000000';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: w,
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: variant === 'sidebar' ? '12px' : '8px',
      }}
      aria-label="Advertisement"
    >
      <div style={{ position: 'relative', width: w, height: h, maxWidth: '100%' }}>
        {/* Placeholder — visible until AdSense fills the <ins> */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #5225D8, #183B99)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          borderRadius: 'inherit',
          border: '1px solid rgba(255,255,255,0.10)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          <span style={{
            fontSize: variant === 'mobile' ? '9px' : '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}>
            Advertisement
          </span>
          <span style={{
            fontSize: variant === 'mobile' ? '14px' : '18px',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.15)',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '1px',
          }}>
            {label}
          </span>
          {isPlaceholder && (
            <span style={{
              fontSize: '9px',
              color: 'rgba(255,255,255,0.25)',
              marginTop: '2px',
              fontFamily: 'Inter, sans-serif',
            }}>
              pending AdSense approval
            </span>
          )}
        </div>

        {/* Real AdSense unit — overlays placeholder once approved */}
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            width: w,
            height: h,
          }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
}
