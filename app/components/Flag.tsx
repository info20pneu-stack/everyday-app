'use client';

import { useState } from 'react';

/* Country flag as a small SVG image (public/flags/<code>.svg, see lib/flags.ts), so it looks the
   same everywhere — Windows doesn't draw flag emoji. `code` is an ISO 3166 code (or a subdivision
   like 'gb-eng'); 'world' draws a globe. A code without a file falls back to the code in a small box.
   Decorative by default (empty alt); pass `label` when the flag is the only thing saying which
   country it is. */

interface FlagProps {
  code: string | null | undefined;
  /** Width in px; the height follows the 3:2 flag ratio. */
  size?: number;
  label?: string;
  className?: string;
}

export default function Flag({ code, size = 18, label, className }: FlagProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const height = Math.round((size * 2) / 3);
  const box: React.CSSProperties = {
    display: 'inline-block', width: size, height, flexShrink: 0, verticalAlign: 'middle', borderRadius: 2,
  };

  if (code === 'world') {
    return (
      <svg
        viewBox="0 0 24 24" width={height + 2} height={height + 2} className={className}
        role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
        style={{ ...box, width: height + 2, height: height + 2, borderRadius: '50%' }}
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="9.5" />
        <path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5M12 2.5C9.4 5.2 8.1 8.4 8.1 12s1.3 6.8 3.9 9.5" />
      </svg>
    );
  }

  if (!code) return null;
  if (failed === code || !/^[a-z]{2}(-[a-z]{2,3})?$/i.test(code)) {
    return (
      <span
        className={className} title={label} aria-label={label}
        style={{
          ...box, height: 'auto', width: 'auto', padding: '0 3px', fontSize: 9, fontWeight: 700, lineHeight: `${height}px`,
          color: 'currentColor', opacity: 0.7, border: '1px solid currentColor',
        }}
      >
        {code.toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, next/image adds nothing here
    <img
      src={`/flags/${code.toLowerCase()}.svg`} width={size} height={height} alt={label ?? ''}
      loading="lazy" decoding="async" className={className} onError={() => setFailed(code)}
      style={{ ...box, objectFit: 'cover', boxShadow: '0 0 0 1px rgba(127,127,127,0.25)' }}
    />
  );
}
