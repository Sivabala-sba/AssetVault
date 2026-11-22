import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Palette } from './tokens';

// ─── Light Theme ──────────────────────────────────────────────────────────────
export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          Palette.primaryBlue,
    primaryContainer: Palette.primaryBlueLight,
    secondary:        Palette.primaryBlueDark,
    background:       Palette.background,
    surface:          Palette.surface,
    surfaceVariant:   Palette.surfaceVariant,
    outline:          Palette.border,
    onSurface:        Palette.textPrimary,
    onSurfaceVariant: Palette.textSecondary,
    onBackground:     Palette.textPrimary,
    onPrimary:        Palette.white,
    error:            Palette.statusDanger,
    onError:          Palette.white,
  },
  custom: {
    statusActive:      Palette.statusActive,
    statusActiveBg:    Palette.statusActiveBg,
    statusWarning:     Palette.statusWarning,
    statusWarningBg:   Palette.statusWarningBg,
    statusDanger:      Palette.statusDanger,
    statusDangerBg:    Palette.statusDangerBg,
    textSecondary:     Palette.textSecondary,
    textDisabled:      Palette.textDisabled,
    border:            Palette.border,
    surfaceVariant:    Palette.surfaceVariant,
  },
};

// ─── Dark Theme ───────────────────────────────────────────────────────────────
export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          Palette.primaryBlue,
    primaryContainer: '#1A3A6E',
    secondary:        '#90B4F3',
    background:       Palette.backgroundDark,
    surface:          Palette.surfaceDark,
    surfaceVariant:   Palette.surfaceVariantDark,
    outline:          Palette.borderDark,
    onSurface:        Palette.textPrimaryDark,
    onSurfaceVariant: Palette.textSecondaryDark,
    onBackground:     Palette.textPrimaryDark,
    onPrimary:        Palette.white,
    error:            Palette.statusDangerDark,
    onError:          Palette.white,
  },
  custom: {
    statusActive:      Palette.statusActiveDark,
    statusActiveBg:    Palette.statusActiveBgDark,
    statusWarning:     Palette.statusWarningDark,
    statusWarningBg:   Palette.statusWarningBgDark,
    statusDanger:      Palette.statusDangerDark,
    statusDangerBg:    Palette.statusDangerBgDark,
    textSecondary:     Palette.textSecondaryDark,
    textDisabled:      Palette.textDisabledDark,
    border:            Palette.borderDark,
    surfaceVariant:    Palette.surfaceVariantDark,
  },
};

// AppTheme is a loose structural type so both LightTheme and DarkTheme satisfy it.
export type AppTheme = {
  colors: {
    primary: string;
    primaryContainer: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    outline: string;
    onSurface: string;
    onSurfaceVariant: string;
    onBackground: string;
    onPrimary: string;
    error: string;
    onError: string;
    [key: string]: string | unknown;
  };
  custom: {
    statusActive: string;
    statusActiveBg: string;
    statusWarning: string;
    statusWarningBg: string;
    statusDanger: string;
    statusDangerBg: string;
    textSecondary: string;
    textDisabled: string;
    border: string;
    surfaceVariant: string;
  };
  dark: boolean;
  roundness: number;
  animation: { scale: number };
  fonts: typeof MD3LightTheme['fonts'];
};

