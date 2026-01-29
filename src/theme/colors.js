/**
 * Color System
 * 
 * Comprehensive color palette with light and dark mode variants.
 * Includes primary, semantic, neutral, surface, text, and status colors.
 */

// Primary color palette with gradient variants
export const primaryColors = {
  // Base primary colors
  primary: '#1B365D',        // Deep Navy
  primaryDark: '#0F2439',    // Darker navy
  primaryLight: '#2C5282',   // Lighter navy
  
  // Gradient variants
  primaryGradient: ['#1B365D', '#2C5282'],
  primaryGradientLight: ['#2C5282', '#5AC8FA'],
  primaryGradientDark: ['#0F2439', '#1B365D'],
};

// Semantic colors
export const semanticColors = {
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
  infoLight: '#5AC8FA',
  infoDark: '#2C5282',
};

// Neutral grays (10 shades from white to black)
export const neutralColors = {
  white: '#FFFFFF',
  gray50: '#F7FAFC',
  gray100: '#EDF2F7',
  gray200: '#E2E8F0',
  gray300: '#CBD5E0',
  gray400: '#A0AEC0',
  gray500: '#718096',
  gray600: '#4A5568',
  gray700: '#2D3748',
  gray800: '#1A202C',
  gray900: '#171923',
  black: '#000000',
};

// Surface colors (cards, backgrounds, overlays)
export const surfaceColors = {
  // Light mode surfaces
  light: {
    background: '#F7FAFC',
    backgroundSecondary: '#EDF2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F7FAFC',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
  },
  // Dark mode surfaces
  dark: {
    background: '#1A202C',
    backgroundSecondary: '#2D3748',
    surface: '#2D3748',
    surfaceElevated: '#374151',
    surfaceHover: '#4A5568',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

// Text colors
export const textColors = {
  // Light mode text
  light: {
    primary: '#2D3748',
    secondary: '#4A5568',
    tertiary: '#718096',
    disabled: '#A0AEC0',
    inverse: '#FFFFFF',
    link: '#3182CE',
    linkHover: '#2C5282',
  },
  // Dark mode text
  dark: {
    primary: '#F7FAFC',
    secondary: '#CBD5E0',
    tertiary: '#A0AEC0',
    disabled: '#718096',
    inverse: '#1A202C',
    link: '#5AC8FA',
    linkHover: '#90CDF4',
  },
};

// Status colors for compliance/tasks
export const statusColors = {
  overdue: '#E53E3E',        // Red
  dueToday: '#D69E2E',       // Orange/Yellow
  upcoming: '#3182CE',       // Blue
  completed: '#38A169',      // Green
  pending: '#718096',        // Gray
  compliant: '#38A169',      // Green
  atRisk: '#D69E2E',         // Yellow
  nonCompliant: '#E53E3E',   // Red
};

// Zinc palette (glassmorphism / dark UI)
export const zincColors = {
  zinc950: '#18181B',
  zinc900: '#27272A',
  zinc800: '#3F3F46',
  zinc700: '#52525B',
  zinc600: '#71717A',
  zinc500: '#71717A',
  zinc400: '#A1A1AA',
  zinc300: '#D4D4D8',
  zinc200: '#E4E4E7',
  zinc100: '#F4F4F5',
  zinc50: '#FAFAFA',
};

// Glassmorphism color utilities
export const glassColors = {
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(255, 255, 255, 0.1)',
  glassSurface: 'rgba(255, 255, 255, 0.08)',
  glassElevated: 'rgba(255, 255, 255, 0.12)',
};

// Gradient color arrays for text/surfaces
export const gradientColors = {
  whiteToZinc: ['#FFFFFF', '#A1A1AA'],
  whiteToYellow: ['#FFFFFF', '#FFCD75'],
  heroGradient: ['#FFFFFF', '#FFFFFF', '#FFCD75'],
};

// Border and divider colors
export const borderColors = {
  light: {
    default: '#E2E8F0',
    dark: '#CBD5E0',
    light: '#F7FAFC',
  },
  dark: {
    default: '#4A5568',
    dark: '#718096',
    light: '#2D3748',
  },
};

// Complete light theme colors
export const lightThemeColors = {
  ...primaryColors,
  ...semanticColors,
  ...neutralColors,
  ...zincColors,
  ...glassColors,
  gradient: gradientColors,
  surface: surfaceColors.light,
  text: textColors.light,
  status: statusColors,
  border: borderColors.light,
  
  // Legacy compatibility
  secondary: neutralColors.gray600,
  secondaryLight: neutralColors.gray500,
  accent: semanticColors.info,
  accentLight: semanticColors.infoLight,
  background: surfaceColors.light.background,
  backgroundSecondary: surfaceColors.light.backgroundSecondary,
  textSecondary: textColors.light.secondary,
  textLight: textColors.light.tertiary,
  textInverse: textColors.light.inverse,
  divider: borderColors.light.default,
};

// Complete dark theme colors (glassmorphism-friendly: zinc-950 primary background)
export const darkThemeColors = {
  ...primaryColors,
  ...semanticColors,
  ...neutralColors,
  ...zincColors,
  ...glassColors,
  gradient: gradientColors,
  surface: surfaceColors.dark,
  text: textColors.dark,
  status: statusColors,
  border: borderColors.dark,
  
  // Legacy compatibility
  secondary: neutralColors.gray400,
  secondaryLight: neutralColors.gray300,
  accent: semanticColors.infoLight,
  accentLight: '#90CDF4',
  background: zincColors.zinc950,
  backgroundSecondary: zincColors.zinc900,
  textSecondary: textColors.dark.secondary,
  textLight: textColors.dark.tertiary,
  textInverse: textColors.dark.inverse,
  divider: borderColors.dark.default,
};

export default {
  light: lightThemeColors,
  dark: darkThemeColors,
};
