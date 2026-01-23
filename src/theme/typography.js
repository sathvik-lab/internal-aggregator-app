/**
 * Typography System
 * 
 * Comprehensive typography scale with font families, sizes, weights,
 * line heights, and letter spacing for consistent text styling.
 */

import { Platform } from 'react-native';

// Font families
export const fontFamilies = {
  heading: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

// Font sizes
export const fontSizes = {
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  label: 12,
  button: 16,
  input: 16,
  small: 12,
  tiny: 10,
};

// Font weights
export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  // Platform-specific
  regularIOS: '400',
  regularAndroid: 'normal',
  mediumIOS: '500',
  mediumAndroid: '500',
  semiboldIOS: '600',
  semiboldAndroid: '600',
  boldIOS: '700',
  boldAndroid: 'bold',
};

// Line heights
export const lineHeights = {
  h1: 40,
  h2: 32,
  h3: 28,
  h4: 24,
  body: 24,
  bodySmall: 20,
  caption: 16,
  label: 16,
  button: 24,
  input: 24,
};

// Letter spacing
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
};

// Text styles for consistent typography
export const textStyles = {
  // Headings
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.h1,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.h2,
    letterSpacing: letterSpacing.normal,
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.h3,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.h4,
    letterSpacing: letterSpacing.normal,
  },
  
  // Body text
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.bodySmall,
    letterSpacing: letterSpacing.normal,
  },
  bodyBold: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
  },
  
  // Captions and labels
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.caption,
    letterSpacing: letterSpacing.normal,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.label,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.label,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  },
  
  // Interactive elements
  button: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.button,
    letterSpacing: letterSpacing.wide,
  },
  input: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.input,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.input,
    letterSpacing: letterSpacing.normal,
  },
  
  // Utility sizes
  small: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.caption,
    letterSpacing: letterSpacing.normal,
  },
  tiny: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.regular,
    lineHeight: 14,
    letterSpacing: letterSpacing.normal,
  },
};

// Helper function to get text style
export const getTextStyle = (styleName) => {
  return textStyles[styleName] || textStyles.body;
};

export default {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
  getTextStyle,
};
