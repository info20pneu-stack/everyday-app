'use client';

import { useEffect, useId, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../lib/ThemeContext';
import { useLang } from '../../lib/LanguageContext';
import { findRetroWidgetByHref } from '../../lib/retroWidgets';
import { useRetroWindow } from '../../lib/RetroWindowContext';

interface RetroWindowProps {
  icon?: string;
  title?: string;
  onClose?: () => void;
  children: ReactNode;
}

function titleFromPathname(pathname: string): string {
  const last = pathname.split('/').filter(Boolean).pop() ?? 'Window';
  return last
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function RetroWindow({ icon, title, onClose, children }: RetroWindowProps) {
  const { theme } = useTheme();
  const { t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const { win, registerWindow, unregisterWindow, setMinimized } = useRetroWindow();
  const [maximized, setMaximized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const id = useId();

  useEffect(() => setMounted(true), []);

  const isRetro = theme === 'xp' || theme === 'win98' || theme === 'win2000';

  const autoWidget = title ? undefined : findRetroWidgetByHref(pathname ?? '/');
  const resolvedIcon = icon ?? autoWidget?.icon ?? '🪟';
  const resolvedTitle = title ?? (autoWidget ? t.dashboard[autoWidget.labelKey] : titleFromPathname(pathname ?? '/'));

  useEffect(() => {
    if (!isRetro) return;
    registerWindow(id, resolvedIcon, resolvedTitle);
    return () => unregisterWindow(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRetro, id, resolvedIcon, resolvedTitle]);

  if (!isRetro) return <>{children}</>;

  const minimized = win?.id === id ? win.minimized : false;

  function handleMinimize() {
    setMinimized(id, !minimized);
  }
  function handleMaximize() {
    setMaximized(m => !m);
  }
  function handleClose() {
    if (onClose) onClose();
    else router.push('/');
  }

  const windowEl = (
    <div className={`retro-window${maximized ? ' retro-window-maximized' : ''}`}>
      <div className="retro-titlebar" onDoubleClick={handleMaximize}>
        <span className="retro-titlebar-icon">{resolvedIcon}</span>
        <span className="retro-titlebar-text">{resolvedTitle}</span>
        <div className="retro-titlebar-buttons">
          <button type="button" className="retro-btn-min" aria-label="Minimize" onClick={handleMinimize}>─</button>
          <button type="button" className="retro-btn-max" aria-label="Maximize" onClick={handleMaximize}>{maximized ? '❐' : '□'}</button>
          <button type="button" className="retro-btn-close" aria-label="Close" onClick={handleClose}>×</button>
        </div>
      </div>
      {!minimized && <div className="retro-window-body">{children}</div>}
    </div>
  );

  // Maximize escapes via a portal — an ancestor may have a lingering CSS
  // transform (e.g. an animation with fill-mode: both), which would turn
  // it into a containing block and break position:fixed here otherwise.
  if (maximized && mounted) return createPortal(windowEl, document.body);
  return windowEl;
}
