/**
 * Theme System Index
 * 
 * Centralized theme exports combining colors, typography, spacing, and shadows.
 */

import { lightThemeColors, darkThemeColors } from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';

// Complete light theme
export const lightTheme = {
  colors: lightThemeColors,
  typography,
  spacing,
  shadows,
  isDark: false,
};

// Complete dark theme
export const darkTheme = {
  colors: darkThemeColors,
  typography,
  spacing,
  shadows,
  isDark: true,
};

// Export individual theme modules
export { lightThemeColors, darkThemeColors } from './colors';
export { default as typography } from './typography';
export { default as spacing } from './spacing';
export { default as shadows } from './shadows';

export default {
  light: lightTheme,
  dark: darkTheme,
};
