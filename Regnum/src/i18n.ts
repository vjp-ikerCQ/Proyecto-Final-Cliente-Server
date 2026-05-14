import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es/common.json';
import en from './locales/en/common.json';
import pt from './locales/pt/common.json';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: localStorage.getItem('lang') || 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
