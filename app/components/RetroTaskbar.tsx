'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../../lib/ThemeContext';
import { useLang } from '../../lib/LanguageContext';
import { useRetroWindow } from '../../lib/RetroWindowContext';
import { RETRO_WIDGETS } from '../../lib/retroWidgets';

export default function RetroTaskbar() {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const { win, toggleMinimize } = useRetroWindow();
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isRetro = theme === 'xp' || theme === 'win98' || theme === 'win2000';
  if (!isRetro) return null;

  const timeStr = now ? now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="retro-taskbar">
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button type="button" className="retro-start-btn" onClick={() => setMenuOpen(o => !o)}>
          <span className="retro-start-flag">⊞</span> Start
        </button>
        {menuOpen && (
          <div className="retro-start-menu">
            {RETRO_WIDGETS.map(w => (
              <Link key={w.id} href={w.href} className="retro-start-item" onClick={() => setMenuOpen(false)}>
                <span className="retro-start-item-icon">{w.icon}</span>
                <span>{t.dashboard[w.labelKey]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {win && (
        <button
          type="button"
          className={`retro-taskbar-task${!win.minimized ? ' retro-taskbar-task-active' : ''}`}
          onClick={toggleMinimize}
        >
          <span>{win.icon}</span>
          <span className="retro-taskbar-task-label">{win.title}</span>
        </button>
      )}

      <div className="retro-systray">
        <span>{timeStr}</span>
      </div>
    </div>
  );
}
