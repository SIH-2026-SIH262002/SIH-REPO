import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import as from './locales/as.json';
import bn from './locales/bn.json';
import mn from './locales/mn.json';
import mz from './locales/mz.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      as: { translation: as },
      bn: { translation: bn },
      mn: { translation: mn },
      mz: { translation: mz },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'as', 'bn', 'mn', 'mz'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
