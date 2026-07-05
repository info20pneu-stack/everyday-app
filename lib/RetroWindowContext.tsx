'use client';

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

export type RetroWindowInfo = {
  id: string;
  icon: string;
  title: string;
  minimized: boolean;
};

interface RetroWindowCtx {
  win: RetroWindowInfo | null;
  registerWindow: (id: string, icon: string, title: string) => void;
  unregisterWindow: (id: string) => void;
  setMinimized: (id: string, minimized: boolean) => void;
  toggleMinimize: () => void;
}

const RetroWindowContext = createContext<RetroWindowCtx>({
  win: null,
  registerWindow: () => {},
  unregisterWindow: () => {},
  setMinimized: () => {},
  toggleMinimize: () => {},
});

export function RetroWindowProvider({ children }: { children: ReactNode }) {
  const [win, setWin] = useState<RetroWindowInfo | null>(null);

  const registerWindow = useCallback((id: string, icon: string, title: string) => {
    setWin({ id, icon, title, minimized: false });
  }, []);

  const unregisterWindow = useCallback((id: string) => {
    setWin(prev => (prev && prev.id === id ? null : prev));
  }, []);

  const setMinimized = useCallback((id: string, minimized: boolean) => {
    setWin(prev => (prev && prev.id === id ? { ...prev, minimized } : prev));
  }, []);

  const toggleMinimize = useCallback(() => {
    setWin(prev => (prev ? { ...prev, minimized: !prev.minimized } : prev));
  }, []);

  const value = useMemo(
    () => ({ win, registerWindow, unregisterWindow, setMinimized, toggleMinimize }),
    [win, registerWindow, unregisterWindow, setMinimized, toggleMinimize]
  );

  return <RetroWindowContext.Provider value={value}>{children}</RetroWindowContext.Provider>;
}

export function useRetroWindow() {
  return useContext(RetroWindowContext);
}
