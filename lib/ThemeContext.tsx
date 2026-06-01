'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppTheme = 'dark' | 'light' | 'xp' | 'win98' | 'win7';

interface ThemeCtx { theme: AppTheme; setTheme: (t: AppTheme) => void; }

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_theme') as AppTheme | null;
      if (saved) { setThemeState(saved); document.documentElement.dataset.theme = saved; }
    } catch {}
  }, []);

  function setTheme(t: AppTheme) {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('app_theme', t); } catch {}
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
