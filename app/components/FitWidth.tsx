'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Scales a fixed-width game board down (never up) so it fits narrow screens.
 * Uses CSS zoom so layout height shrinks too and taps still hit the right element.
 */
export default function FitWidth({ width, children }: { width: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} style={{ width: '100%', minWidth: 0 }}>
      <div style={{ width, margin: '0 auto', zoom: scale }}>{children}</div>
    </div>
  );
}
