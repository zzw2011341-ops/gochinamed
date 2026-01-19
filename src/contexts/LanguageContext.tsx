'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '@/locales/en.json';
import zhTranslations from '@/locales/zh.json';

type Language = 'en' | 'de' | 'fr' | 'zh';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  de: enTranslations, // Fallback to English for now
  fr: enTranslations, // Fallback to English for now
  zh: zhTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Detect browser language on mount
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'de', 'fr', 'zh'].includes(browserLang)) {
      setLanguageState(browserLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
