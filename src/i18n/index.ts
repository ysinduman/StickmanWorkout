import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import tr from './tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

function getDeviceLanguage(): 'tr' | 'en' {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
  return locale.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

const defaultLang = getDeviceLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already handles XSS
  },
  compatibilityJSON: 'v4',
});

export default i18n;
