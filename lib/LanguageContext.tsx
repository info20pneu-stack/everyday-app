'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Lang, Translations, isRTL } from './i18n';

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  rtl: boolean;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations['en'],
  rtl: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('everyday-lang') as Lang | null;
    if (stored && translations[stored]) setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('everyday-lang', l);
  }

  const rtl = isRTL(lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], rtl }}>
      <div dir={rtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}
