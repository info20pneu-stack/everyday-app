'use client';

import { LanguageProvider } from '../../lib/LanguageContext';
import { ThemeProvider } from '../../lib/ThemeContext';
import { RetroWindowProvider } from '../../lib/RetroWindowContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RetroWindowProvider>{children}</RetroWindowProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
