import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LanguageCode,
  LANGUAGES,
  LANGUAGE_NAMES,
  NEEDS_NATIVE_REVIEW,
  STRINGS,
  TranslationKey,
} from '../constants/translations';

interface LanguageContextType {
  language: LanguageCode;
  languages: LanguageCode[];
  languageNames: Record<LanguageCode, string>;
  needsNativeReview: (lang: LanguageCode) => boolean;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const STORAGE_KEY = '@app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && LANGUAGES.includes(saved as LanguageCode)) {
        setLanguageState(saved as LanguageCode);
      }
    } catch (e) {
      console.warn('Failed to load saved language:', e);
    }
  };

  const setLanguage = async (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  };

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const currentLangStrings = STRINGS[language];
    if (currentLangStrings && key in currentLangStrings) {
      return currentLangStrings[key as TranslationKey];
    }
    const enStrings = STRINGS.en;
    if (enStrings && key in enStrings) {
      return enStrings[key as TranslationKey];
    }
    return fallback ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        languages: LANGUAGES,
        languageNames: LANGUAGE_NAMES,
        needsNativeReview: (lang) => NEEDS_NATIVE_REVIEW.includes(lang),
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      languages: LANGUAGES,
      languageNames: LANGUAGE_NAMES,
      needsNativeReview: (lang) => NEEDS_NATIVE_REVIEW.includes(lang),
      setLanguage: async () => {},
      t: (key, fallback) => STRINGS.en[key as TranslationKey] ?? fallback ?? key,
    };
  }
  return context;
};
