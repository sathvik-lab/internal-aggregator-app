/**
 * Glassmorphism Utilities
 * 
 * Helper functions and style presets for creating glassmorphism effects
 * in React Native. Adapts web CSS patterns (bg-white/5, backdrop-blur-xl)
 * to React Native using expo-blur and rgba colors.
 */

import { StyleSheet } from 'react-native';

// Glassmorphism color constants
export const GLASS = {
  background: 'rgba(255, 255, 255, 0.05)',      // white/5
  border: 'rgba(255, 255, 255, 0.1)',            // white/10
  hover: 'rgba(255, 255, 255, 0.1)',             // white/10 (hover state)
  surface: 'rgba(255, 255, 255, 0.08)',          // white/8 (elevated)
  elevated: 'rgba(255, 255, 255, 0.12)',         // white/12 (more elevated)
};

// Border radius presets
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

/**
 * Creates a glassmorphism style object
 * 
 * @param {Object} options
 * @param {string} options.backgroundColor - Background color (default: GLASS.background)
 * @param {string} options.borderColor - Border color (default: GLASS.border)
 * @param {number} options.borderRadius - Border radius (default: 24)
 * @param {number} options.borderWidth - Border width (default: 1)
 * @param {Object} options.extraStyles - Additional styles to merge
 * @returns {Object} StyleSheet-compatible style object
 */
export const createGlassStyle = ({
  backgroundColor = GLASS.background,
  borderColor = GLASS.border,
  borderRadius = BORDER_RADIUS['2xl'],
  borderWidth = 1,
  extraStyles = {},
} = {}) => {
  return {
    backgroundColor,
    borderColor,
    borderRadius,
    borderWidth,
    ...extraStyles,
  };
};

/**
 * Glassmorphism style presets for common components
 */
export const glassPresets = {
  // Standard glass card
  card: createGlassStyle({
    borderRadius: BORDER_RADIUS['2xl'],
  }),
  
  // Badge with glass effect
  badge: createGlassStyle({
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: GLASS.background,
  }),
  
  // Button with glass effect
  button: createGlassStyle({
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: GLASS.background,
  }),
  
  // Elevated surface (more opacity)
  surface: createGlassStyle({
    backgroundColor: GLASS.surface,
    borderRadius: BORDER_RADIUS['2xl'],
  }),
  
  // More elevated surface
  elevated: createGlassStyle({
    backgroundColor: GLASS.elevated,
    borderRadius: BORDER_RADIUS['2xl'],
  }),
  
  // Small rounded glass element
  chip: createGlassStyle({
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: GLASS.background,
  }),
  
  // Modal backdrop
  modal: createGlassStyle({
    backgroundColor: GLASS.background,
    borderRadius: BORDER_RADIUS['2xl'],
  }),
};

/**
 * Sanitizes a single style object to ensure numeric layout properties are numbers.
 * Prevents "cannot be cast from String to double" errors in gesture handlers.
 *
 * @param {Object} style - Style object to sanitize
 * @returns {Object} Sanitized style object
 */
const sanitizeStyleObject = (style) => {
  if (!style || typeof style !== 'object') {
    return style;
  }

  const sanitized = { ...style };
  const numericProps = [
    'top', 'right', 'bottom', 'left', 'width', 'height',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderRadius', 'borderWidth', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
    'elevation', 'shadowOpacity', 'shadowRadius', 'opacity', 'flex',
  ];

  numericProps.forEach(prop => {
    if (sanitized[prop] !== undefined && sanitized[prop] !== null) {
      const value = sanitized[prop];
      if (typeof value === 'string' && value !== 'auto' && value !== 'none') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          sanitized[prop] = numValue;
        } else if (typeof value.trim === 'function' && value.trim() === '') {
          delete sanitized[prop];
        }
      }
    }
  });

  // Nested layout objects (e.g. shadowOffset) must have numeric width/height
  if (sanitized.shadowOffset && typeof sanitized.shadowOffset === 'object') {
    const o = sanitized.shadowOffset;
    sanitized.shadowOffset = {
      width: typeof o.width === 'string' ? parseFloat(o.width) || 0 : (o.width ?? 0),
      height: typeof o.height === 'string' ? parseFloat(o.height) || 0 : (o.height ?? 0),
    };
  }

  return sanitized;
};

/**
 * Sanitizes style or style array so all numeric layout properties are numbers.
 * Use for any style that may reach native gesture-handler or animated views.
 *
 * @param {Object|Object[]|number} style - Style object, array of styles, or StyleSheet id
 * @returns {Object|Object[]} Sanitized style
 */
export const sanitizeStyleForGestures = (style) => {
  if (style == null) {
    return style;
  }
  if (Array.isArray(style)) {
    return style.map(s => sanitizeStyleForGestures(s)).filter(Boolean);
  }
  if (typeof style === 'number') {
    return style; // StyleSheet reference, leave as-is
  }
  return sanitizeStyleObject(style);
};

/**
 * Creates a glow effect style (for stats cards, hero elements)
 * Uses absolute positioning with blur radius
 * 
 * @param {Object} options
 * @param {string} options.color - Glow color (default: white/5)
 * @param {number} options.size - Size of glow circle (default: 256)
 * @param {string} options.position - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left' (default: 'top-right')
 * @returns {Object} StyleSheet-compatible style object
 */
export const createGlowStyle = ({
  color = GLASS.background,
  size = 256,
  position = 'top-right',
} = {}) => {
  // Ensure size is a number (convert string to number if needed)
  const numericSize = typeof size === 'string' ? parseFloat(size) : Number(size);
  const safeSize = isNaN(numericSize) ? 256 : numericSize;
  const offset = Number(-safeSize / 4);

  const positions = {
    'top-right': { top: offset, right: offset },
    'top-left': { top: offset, left: offset },
    'bottom-right': { bottom: offset, right: offset },
    'bottom-left': { bottom: offset, left: offset },
  };
  
  const style = {
    position: 'absolute',
    width: safeSize,
    height: safeSize,
    borderRadius: safeSize / 2,
    backgroundColor: color,
    ...positions[position],
  };
  
  // Sanitize to ensure all numeric values are actually numbers
  return sanitizeStyleForGestures(style);
};

/**
 * Helper to get glass styles with theme colors
 * Falls back to default GLASS constants if theme doesn't have glass colors
 * 
 * @param {Object} themeColors - Theme colors object from useTheme()
 * @returns {Object} Glass color values
 */
export const getGlassColors = (themeColors = {}) => {
  return {
    background: themeColors.glassBackground || GLASS.background,
    border: themeColors.glassBorder || GLASS.border,
    hover: themeColors.glassHover || GLASS.hover,
    surface: themeColors.glassSurface || GLASS.surface,
    elevated: themeColors.glassElevated || GLASS.elevated,
  };
};

export default {
  GLASS,
  BORDER_RADIUS,
  createGlassStyle,
  glassPresets,
  createGlowStyle,
  getGlassColors,
  sanitizeStyleForGestures,
};
