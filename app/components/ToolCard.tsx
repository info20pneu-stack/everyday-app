'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  id: string;
  lang: string;
  href: string;
  color: string;
  icon: string;
  label: string;
  desc: string;
  hasImage: boolean;
};

/* Image is 60 % of a card: 2 cols on phones, 3 on tablets, 4 on desktop */
const SIZES = '(max-width: 767px) 32vw, (max-width: 1023px) 22vw, 16vw';

export default function ToolCard({ id, lang, href, color, icon, label, desc, hasImage }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = hasImage && !failed;

  return (
    <Link href={href} className="tool-card" style={{ '--c': color } as CSSProperties}>
      <div className="tool-card__media" aria-hidden="true">
        {showImage ? (
          <Image
            src={`/images/cards/${id}.webp`}
            alt=""
            fill
            sizes={SIZES}
            loading="lazy"
            className="tool-card__img"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="tool-card__fallback">
            <span>{icon}</span>
          </div>
        )}
      </div>
      <div className="tool-card__shade" aria-hidden="true" />

      <span className="tool-card__icon" aria-hidden="true">{icon}</span>

      <div className="tool-card__text">
        <span className="tool-card__title" lang={lang}>{label}</span>
        <span className="tool-card__desc">{desc}</span>
      </div>

      <span className="tool-card__go" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
