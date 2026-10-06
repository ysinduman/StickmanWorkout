import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

interface SettingsState {
  language: 'en' | 'tr';
  setLanguage: (lang: 'en' | 'tr') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: (i18n.language === 'tr' ? 'tr' : 'en') as 'en' | 'tr',
      setLanguage: (lang: 'en' | 'tr') => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'stickman-settings-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
