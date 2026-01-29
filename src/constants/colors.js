/**
 * Color Scheme for Compliance/Business App
 * 
 * Professional color palette designed for a compliance document management system.
 * Colors are chosen to convey trust, professionalism, and clarity.
 * 
 * NOTE: For theme support, use the useTheme hook from ThemeContext instead of importing COLORS directly.
 * This file exports the light theme colors for backward compatibility and as a fallback.
 * 
 * @deprecated Use useTheme() hook from ThemeContext for theme-aware colors
 */

/**
 * IMPORTANT
 * This file must never crash during module initialization.
 * Keep it dependency-free (no imports) so `COLORS` is always defined.
 */

// Nested groups (for newer code that expects structured colors)
const surfaceColors = {
  background: '#F7FAFC',
  backgroundSecondary: '#EDF2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const textColors = {
  primary: '#2D3748',
  secondary: '#718096',
  tertiary: '#A0AEC0',
  inverse: '#FFFFFF',
};

const borderColors = {
  default: '#E2E8F0',
  light: '#EDF2F7',
  dark: '#CBD5E0',
};

// Flat legacy palette (most of the app currently imports these)
export const COLORS = {
  // Brand
  primary: '#1B365D',
  primaryDark: '#0F2439',
  primaryLight: '#2C5282',

  // Semantic
  success: '#38A169',
  successLight: '#68D391',
  successDark: '#2F855A',
  warning: '#D69E2E',
  warningLight: '#F6E05E',
  warningDark: '#B7791F',
  error: '#E53E3E',
  errorLight: '#FC8181',
  errorDark: '#C53030',
  info: '#3182CE',
  infoLight: '#90CDF4',
  infoDark: '#2C5282',

  // Compatibility (flat)
  background: surfaceColors.background,
  backgroundSecondary: surfaceColors.backgroundSecondary,
  surface: surfaceColors.surface,
  overlay: surfaceColors.overlay,
  border: borderColors.default,
  borderLight: borderColors.light,
  borderDark: borderColors.dark,
  divider: borderColors.default,
  text: textColors.primary,
  textSecondary: textColors.secondary,
  textLight: textColors.tertiary,
  textInverse: textColors.inverse,

  // Legacy-ish extras used around the app
  secondary: textColors.secondary,
  secondaryLight: textColors.tertiary,
  accent: '#3182CE',
  accentLight: '#90CDF4',

  // Structured access (opt-in)
  surfaceColors,
  textColors,
  borderColors,
};
