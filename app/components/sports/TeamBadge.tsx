import type { CSSProperties } from 'react';
import { badgeTextColor } from '../../../lib/sports/teamColor';

/* The team badge used everywhere on the sports pages and in the dashboard panel:
   a rounded square in the team's primary colour with its abbreviation. */

const SIZES = { sm: 24, md: 30, lg: 36 } as const;

export default function TeamBadge({ abbr, color, size = 'md', title }: {
  abbr: string; color: string; size?: keyof typeof SIZES; title?: string;
}) {
  const px = SIZES[size];
  const style: CSSProperties = {
    width: px, height: px, background: color, color: badgeTextColor(color),
    fontSize: abbr.length > 3 ? Math.round(px * 0.3) : Math.round(px * 0.36),
  };
  return (
    <span className="sp-badge" style={style} title={title} aria-hidden={title ? undefined : true}>
      {abbr}
      <style href="everyday-team-badge" precedence="medium">{`
        .sp-badge {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          border-radius: 7px; font-family: 'Poppins', 'Inter', sans-serif; font-weight: 800; letter-spacing: .2px;
          line-height: 1; white-space: nowrap; overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.14), 0 2px 6px rgba(0,0,0,.25);
        }
      `}</style>
    </span>
  );
}
