'use client';

import { LanguageProvider } from '../../lib/LanguageContext';
import { ThemeProvider } from '../../lib/ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
