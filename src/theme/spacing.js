/**
 * Spacing System
 * 
 * Consistent spacing scale and utilities for padding and margins.
 * Based on 4px base unit for visual harmony.
 */

// Spacing scale (4px base unit)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Named spacing for common use cases
export const SPACING = {
  // Micro spacing
  XS: spacing.xs,      // 4px
  SM: spacing.sm,        // 8px
  MD: spacing.md,       // 12px
  
  // Base spacing
  BASE: spacing.base,  // 16px
  LG: spacing.lg,       // 20px
  XL: spacing.xl,       // 24px
  
  // Large spacing
  XXL: spacing['2xl'],  // 32px
  XXXL: spacing['3xl'], // 40px
  XXXXL: spacing['4xl'], // 48px
  XXXXXL: spacing['5xl'], // 64px
  
  // Common padding values
  PADDING: {
    SCREEN_HORIZONTAL: spacing.base,  // 16px
    SCREEN_VERTICAL: spacing.lg,      // 20px
    CARD: spacing.base,               // 16px
    CARD_LARGE: spacing.lg,          // 20px
    BUTTON_HORIZONTAL: spacing.xl,   // 24px
    BUTTON_VERTICAL: spacing.md,     // 12px
    INPUT_HORIZONTAL: spacing.base,  // 16px
    INPUT_VERTICAL: spacing.md,      // 12px
  },
  
  // Common margin values
  MARGIN: {
    SECTION: spacing.xl,              // 24px
    SECTION_LARGE: spacing['2xl'],    // 32px
    ELEMENT: spacing.base,            // 16px
    ELEMENT_SMALL: spacing.sm,        // 8px
    ELEMENT_LARGE: spacing.lg,        // 20px
  },
  
  // Gap values for flex layouts
  GAP: {
    SMALL: spacing.sm,    // 8px
    MEDIUM: spacing.base, // 16px
    LARGE: spacing.xl,    // 24px
  },
};

// Border radius values
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
  
  // Common use cases
  button: 8,
  input: 8,
  card: 12,
  cardLarge: 16,
  modal: 20,
  badge: 12,
  chip: 20,
};

// Helper functions for spacing
export const getSpacing = (multiplier = 1) => {
  return spacing.base * multiplier;
};

export const getPadding = (type = 'CARD') => {
  return SPACING.PADDING[type] || SPACING.PADDING.CARD;
};

export const getMargin = (type = 'ELEMENT') => {
  return SPACING.MARGIN[type] || SPACING.MARGIN.ELEMENT;
};

export default {
  spacing,
  SPACING,
  borderRadius,
  getSpacing,
  getPadding,
  getMargin,
};
