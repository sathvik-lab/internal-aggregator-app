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

import { lightThemeColors } from '../theme/colors';

// Export light colors as default COLORS for backward compatibility
// Components should use useTheme() hook for theme support
export const COLORS = lightThemeColors;

// Export default for convenience
export default COLORS;
