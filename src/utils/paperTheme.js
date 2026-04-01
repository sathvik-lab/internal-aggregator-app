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
  if (!customColors) {
    return isDark ? MD3DarkTheme : MD3LightTheme;
  }
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const surface = customColors.surface ?? {
    surface: baseTheme.colors.surface,
    surfaceElevated: baseTheme.colors.surfaceVariant,
    overlay: baseTheme.colors.scrim,
  };
  const text = customColors.text ?? { primary: baseTheme.colors.onSurface, secondary: baseTheme.colors.onSurfaceVariant };
  const border = customColors.border ?? { default: baseTheme.colors.outline, light: baseTheme.colors.outlineVariant };

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // Primary colors
      primary: customColors.primary ?? baseTheme.colors.primary,
      primaryContainer: customColors.primaryLight,
      onPrimary: customColors.textInverse,
      onPrimaryContainer: customColors.primaryDark,
      
      // Secondary colors
      secondary: customColors.secondary,
      secondaryContainer: customColors.secondaryLight,
      onSecondary: customColors.textInverse,
      onSecondaryContainer: customColors.secondary,
      
      // Surface colors
      surface: surface.surface ?? baseTheme.colors.surface,
      surfaceVariant: surface.surfaceElevated ?? baseTheme.colors.surfaceVariant,
      onSurface: text.primary ?? customColors.textInverse ?? baseTheme.colors.onSurface,
      onSurfaceVariant: text.secondary ?? baseTheme.colors.onSurfaceVariant,
      
      // Background colors (backgroundColor for backwards compatibility)
      background: customColors.background ?? baseTheme.colors.background,
      backgroundColor: customColors.background ?? baseTheme.colors.background,
      onBackground: text.primary ?? customColors.textInverse ?? baseTheme.colors.onBackground,
      
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
      outline: border.default ?? baseTheme.colors.outline,
      outlineVariant: border.light ?? baseTheme.colors.outlineVariant,
      
      // Inverse colors
      // For inverse surfaces, use contrasting colors from the current theme
      // Paper will handle the inversion logic internally
      inverseSurface: isDark ? customColors.backgroundSecondary : customColors.background,
      inverseOnSurface: text.primary ?? customColors.textInverse ?? baseTheme.colors.inverseOnSurface,
      inversePrimary: customColors.primaryLight,
      
      // Shadow colors
      shadow: isDark ? '#000000' : '#000000',
      scrim: surface.overlay ?? baseTheme.colors.scrim,
      
      // Elevation colors (for surfaces)
      elevation: {
        ...baseTheme.colors.elevation,
        level0: surface.surface ?? baseTheme.colors.elevation?.level0,
        level1: surface.surfaceElevated ?? baseTheme.colors.elevation?.level1,
        level2: surface.surfaceElevated ?? baseTheme.colors.elevation?.level2,
        level3: surface.surfaceElevated ?? baseTheme.colors.elevation?.level3,
        level4: surface.surfaceElevated ?? baseTheme.colors.elevation?.level4,
        level5: surface.surfaceElevated ?? baseTheme.colors.elevation?.level5,
      },
    },
    dark: isDark,
    mode: isDark ? 'adaptive' : 'exact',
  };
};

export default createPaperTheme;
