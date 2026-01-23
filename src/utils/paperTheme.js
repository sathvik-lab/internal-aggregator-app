/**
 * Paper Theme Adapter
 * 
 * Converts custom app theme to react-native-paper's theme format.
 * This ensures Paper components (Switch, TextInput, FAB, etc.) respond
 * to theme changes from ThemeContext.
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * Converts custom theme colors to react-native-paper theme format
 * 
 * @param {Object} customColors - Custom theme colors from ThemeContext
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {Object} react-native-paper theme object
 */
export const createPaperTheme = (customColors, isDark) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // Primary colors
      primary: customColors.primary,
      primaryContainer: customColors.primaryLight,
      onPrimary: customColors.textInverse,
      onPrimaryContainer: customColors.primaryDark,
      
      // Secondary colors
      secondary: customColors.secondary,
      secondaryContainer: customColors.secondaryLight,
      onSecondary: customColors.textInverse,
      onSecondaryContainer: customColors.secondary,
      
      // Surface colors
      surface: customColors.surface.surface,
      surfaceVariant: customColors.surface.surfaceElevated,
      onSurface: customColors.text.primary,
      onSurfaceVariant: customColors.text.secondary,
      
      // Background colors
      background: customColors.background,
      onBackground: customColors.text.primary,
      
      // Error colors
      error: customColors.error,
      errorContainer: customColors.errorLight,
      onError: customColors.textInverse,
      onErrorContainer: customColors.errorDark,
      
      // Success colors (using accent for Paper's tertiary)
      tertiary: customColors.success,
      tertiaryContainer: customColors.successLight,
      onTertiary: customColors.textInverse,
      onTertiaryContainer: customColors.successDark,
      
      // Outline colors
      outline: customColors.border.default,
      outlineVariant: customColors.border.light,
      
      // Inverse colors
      // For inverse surfaces, use contrasting colors from the current theme
      // Paper will handle the inversion logic internally
      inverseSurface: isDark ? customColors.backgroundSecondary : customColors.background,
      inverseOnSurface: customColors.text.primary,
      inversePrimary: customColors.primaryLight,
      
      // Shadow colors
      shadow: isDark ? '#000000' : '#000000',
      scrim: customColors.surface.overlay,
      
      // Elevation colors (for surfaces)
      elevation: {
        level0: customColors.surface.surface,
        level1: customColors.surface.surfaceElevated,
        level2: customColors.surface.surfaceElevated,
        level3: customColors.surface.surfaceElevated,
        level4: customColors.surface.surfaceElevated,
        level5: customColors.surface.surfaceElevated,
      },
    },
    dark: isDark,
    mode: isDark ? 'adaptive' : 'exact',
  };
};

export default createPaperTheme;
