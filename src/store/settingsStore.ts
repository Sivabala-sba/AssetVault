import { create } from 'zustand';

type ThemePreference = 'system' | 'light' | 'dark';
type LanguageCode = 'en' | 'ta';

interface SettingsState {
  themePreference: ThemePreference;
  language: LanguageCode;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (lang: LanguageCode) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themePreference: 'system',
  language: 'en',
  setTheme: (themePreference) => set({ themePreference }),
  setLanguage: (language) => set({ language }),
}));
