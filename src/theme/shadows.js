/**
 * Shadow & Elevation System
 * 
 * Platform-specific shadow styles for iOS and elevation for Android.
 * Provides consistent depth and elevation levels.
 */

import { Platform } from 'react-native';

// Shadow levels (0-5)
export const shadows = {
  // Level 0: No shadow (flat)
  0: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(0) },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  
  // Level 1: Subtle shadow (cards, inputs)
  1: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(1) },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  
  // Level 2: Medium shadow (hovered cards, dropdowns)
  2: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(2) },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // Level 3: Prominent shadow (modals, important cards)
  3: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(4) },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  // Level 4: Strong shadow (FABs, floating elements)
  4: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(8) },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  // Level 5: Maximum shadow (important modals, overlays)
  5: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: Number(0), height: Number(12) },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
};

// Named shadow presets for common use cases
export const shadowPresets = {
  card: shadows[1],
  cardHover: shadows[2],
  cardElevated: shadows[3],
  input: shadows[1],
  inputFocus: shadows[2],
  button: shadows[2],
  buttonPressed: shadows[1],
  modal: shadows[5],
  dropdown: shadows[3],
  fab: shadows[4],
  tooltip: shadows[3],
  badge: shadows[1],
};

// Helper function to get shadow by level
export const getShadow = (level = 1) => {
  return shadows[level] || shadows[1];
};

// Helper function to get shadow preset
export const getShadowPreset = (preset = 'card') => {
  return shadowPresets[preset] || shadowPresets.card;
};

// Custom shadow creator
export const createShadow = (options = {}) => {
  const {
    color = '#000',
    offset = { width: 0, height: 2 },
    opacity = 0.1,
    radius = 4,
    elevation = 2,
  } = options;

  return {
    ...Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: offset,
        shadowOpacity: opacity,
        shadowRadius: radius,
      },
      android: {
        elevation,
      },
    }),
  };
};

export default {
  shadows,
  shadowPresets,
  getShadow,
  getShadowPreset,
  createShadow,
};
