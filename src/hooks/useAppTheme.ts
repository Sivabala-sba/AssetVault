import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from '../theme';
import type { AppTheme } from '../theme';
import { useSettingsStore } from '../store/settingsStore';

export type { AppTheme };

export function useAppTheme(): AppTheme {
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.themePreference);

  if (themePreference === 'light') return LightTheme as unknown as AppTheme;
  if (themePreference === 'dark') return DarkTheme as unknown as AppTheme;

  return (systemColorScheme === 'dark' ? DarkTheme : LightTheme) as unknown as AppTheme;
}
