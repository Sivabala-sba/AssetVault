// ─── Colour Tokens ───────────────────────────────────────────────────────────
//
// Primary:  Blue  (#1A73E8) — calm, trustworthy, Google-familiar
// Status colours follow a universal traffic-light model:
//   Active      → green  (#1E8E3E / #34A853)
//   ExpiringSoon → amber  (#E37400 / #F9AB00)
//   Expired     → red    (#C5221F / #EA4335)
// Neutral surfaces use a warm off-white / dark-grey palette.

export const Palette = {
  // Brand
  primaryBlue: '#1A73E8',
  primaryBlueDark: '#1557B0',
  primaryBlueLight: '#D2E3FC',

  // Status – active/healthy (green)
  statusActive: '#1E8E3E',
  statusActiveBg: '#E6F4EA',
  statusActiveDark: '#34A853',
  statusActiveBgDark: '#1A3326',

  // Status – expiring soon (amber)
  statusWarning: '#E37400',
  statusWarningBg: '#FEF7E0',
  statusWarningDark: '#F9AB00',
  statusWarningBgDark: '#3D2E00',

  // Status – expired / overdue (red)
  statusDanger: '#C5221F',
  statusDangerBg: '#FCE8E6',
  statusDangerDark: '#EA4335',
  statusDangerBgDark: '#3B1310',

  // Neutrals – Light mode
  white: '#FFFFFF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F4',
  border: '#DADCE0',
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  textDisabled: '#9AA0A6',
  textInverse: '#FFFFFF',

  // Neutrals – Dark mode
  backgroundDark: '#121212',
  surfaceDark: '#1E1E1E',
  surfaceVariantDark: '#2A2A2A',
  borderDark: '#3C4043',
  textPrimaryDark: '#E8EAED',
  textSecondaryDark: '#9AA0A6',
  textDisabledDark: '#5F6368',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
} as const;

// ─── Typography Scale ─────────────────────────────────────────────────────────

export const Typography = {
  // Display
  displayLarge:  { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.25 },

  // Headline
  headlineLarge:  { fontSize: 24, fontWeight: '700' as const },
  headlineMedium: { fontSize: 20, fontWeight: '700' as const },
  headlineSmall:  { fontSize: 18, fontWeight: '600' as const },

  // Title
  titleLarge:   { fontSize: 16, fontWeight: '600' as const },
  titleMedium:  { fontSize: 14, fontWeight: '600' as const },
  titleSmall:   { fontSize: 12, fontWeight: '600' as const },

  // Body
  bodyLarge:   { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium:  { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall:   { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },

  // Label
  labelLarge:  { fontSize: 14, fontWeight: '500' as const },
  labelMedium: { fontSize: 12, fontWeight: '500' as const },
  labelSmall:  { fontSize: 10, fontWeight: '500' as const, letterSpacing: 0.5 },
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

// ─── Elevation / Shadow ───────────────────────────────────────────────────────

export const Elevation = {
  none: 0,
  low:  2,
  mid:  4,
  high: 8,
} as const;
