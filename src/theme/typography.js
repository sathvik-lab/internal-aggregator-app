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

// Font sizes (glassmorphism: larger headings per ui.md)
export const fontSizes = {
  h1: 48,
  h2: 36,
  h3: 28,
  h4: 22,
  h5: 20,
  body: 16,
  bodySmall: 14,
  caption: 12,
  label: 12,
  button: 16,
  input: 16,
  small: 12,
  tiny: 10,
  // Hero-style sizes
  hero: 64,
  heroSmall: 48,
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

// Line heights (match larger heading sizes)
export const lineHeights = {
  h1: 52,
  h2: 42,
  h3: 34,
  h4: 28,
  h5: 26,
  body: 24,
  bodySmall: 20,
  caption: 16,
  label: 16,
  button: 24,
  input: 24,
  hero: 1,
  heroSmall: 1,
};

// Letter spacing (tracking-tighter for glassmorphism headings)
export const letterSpacing = {
  tighter: -1,
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
};

// Text styles for consistent typography
export const textStyles = {
  // Headings (glassmorphism: tracking-tighter, medium weight option)
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.h1,
    letterSpacing: letterSpacing.tighter,
  },
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.h2,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.h3,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.h4,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h5,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.h5,
    letterSpacing: letterSpacing.normal,
  },
  hero: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.hero,
    letterSpacing: letterSpacing.tighter,
  },
  heroSmall: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.heroSmall,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.heroSmall,
    letterSpacing: letterSpacing.tighter,
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
