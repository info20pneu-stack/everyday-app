'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '../../lib/LanguageContext';

const NAV_ITEMS = [
  { href: '/',           icon: '🏠', key: 'home'      as const },
  { href: '/world-time', icon: '🕐', key: 'worldTime' as const },
  { href: '/weather',    icon: '🌤️', key: 'weather'   as const },
  { href: '/sports',     icon: '🏆', key: 'sports'    as const },
  { href: '/crypto',     icon: '₿',  key: 'crypto'    as const },
] as const;

export default function BottomNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const activeIdx = NAV_ITEMS.findIndex(i => i.href === pathname);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  // Horizontal swipe on the bar moves to the neighbouring tab
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    const curr = activeIdx === -1 ? 0 : activeIdx;
    const next = dx < 0 ? curr + 1 : curr - 1;
    if (next >= 0 && next < NAV_ITEMS.length) router.push(NAV_ITEMS[next].href);
  }

  return (
    <nav
      className="bottom-nav"
      aria-label="Mobile navigation"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {NAV_ITEMS.map((item, i) => {
        const isActive = i === activeIdx;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="bottom-nav-item"
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active indicator pill */}
            {isActive && (
              <span style={{
                position: 'absolute',
                top: '6px',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(93,76,255,0.2)',
                border: '1px solid rgba(93,76,255,0.35)',
              }} />
            )}
            <span style={{
              fontSize: '20px',
              lineHeight: 1,
              position: 'relative',
              zIndex: 1,
              filter: isActive ? 'drop-shadow(0 0 6px rgba(93,76,255,0.8))' : 'none',
              transition: 'filter .15s',
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '12px',
              color: isActive ? 'var(--purple3)' : 'var(--text3)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: isActive ? '600' : '400',
              transition: 'color .15s',
              maxWidth: '100%',
              padding: '0 2px',
              textAlign: 'center',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {t.nav[item.key]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
