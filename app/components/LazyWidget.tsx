'use client';

import { useRef, useState, useEffect, ReactNode, memo } from 'react';

interface LazyWidgetProps {
  children: ReactNode;
  height?: number;
}

function LazyWidget({ children, height = 320 }: LazyWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (visible) return <>{children}</>;

  return (
    <div
      ref={ref}
      className="shimmer-card"
      style={{
        minHeight: height,
        borderRadius: 'var(--card-radius)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    />
  );
}

export default memo(LazyWidget);
