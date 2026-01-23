/**
 * Responsive Utilities
 * 
 * Helper functions and constants for responsive design across different screen sizes.
 * Ensures the app works well on small phones, large phones, and tablets.
 */

import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Screen size breakpoints
export const SCREEN_SIZES = {
    SMALL: 375,   // iPhone SE, small Android phones
    MEDIUM: 414,  // iPhone 11 Pro Max, most Android phones
    LARGE: 768,   // iPad Mini, small tablets
    XLARGE: 1024, // iPad Pro, large tablets
};

// Device type detection
export const isSmallDevice = SCREEN_WIDTH < SCREEN_SIZES.SMALL;
export const isMediumDevice = SCREEN_WIDTH >= SCREEN_SIZES.SMALL && SCREEN_WIDTH < SCREEN_SIZES.MEDIUM;
export const isLargeDevice = SCREEN_WIDTH >= SCREEN_SIZES.MEDIUM && SCREEN_WIDTH < SCREEN_SIZES.LARGE;
export const isTablet = SCREEN_WIDTH >= SCREEN_SIZES.LARGE;
export const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// Responsive scaling functions
export const scale = (size) => {
    const baseWidth = 375; // iPhone X/11 base width
    return (SCREEN_WIDTH / baseWidth) * size;
};

export const verticalScale = (size) => {
    const baseHeight = 812; // iPhone X/11 base height
    return (SCREEN_HEIGHT / baseHeight) * size;
};

export const moderateScale = (size, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};

// Touch target sizes (minimum 44x44 points for accessibility)
export const TOUCH_TARGETS = {
    MINIMUM: 44,
    SMALL: 44,
    MEDIUM: 48,
    LARGE: 56,
};

// Responsive spacing
export const SPACING = {
    XS: isSmallDevice ? 4 : 8,
    SM: isSmallDevice ? 8 : 12,
    MD: isSmallDevice ? 12 : 16,
    LG: isSmallDevice ? 16 : 24,
    XL: isSmallDevice ? 24 : 32,
    XXL: isSmallDevice ? 32 : 48,
};

// Responsive font sizes
export const FONT_SIZES = {
    XS: moderateScale(10),
    SM: moderateScale(12),
    MD: moderateScale(14),
    LG: moderateScale(16),
    XL: moderateScale(18),
    XXL: moderateScale(24),
    XXXL: moderateScale(32),
};

// Responsive padding
export const PADDING = {
    SCREEN_HORIZONTAL: isTablet ? 32 : isSmallDevice ? 12 : 16,
    SCREEN_VERTICAL: isTablet ? 24 : isSmallDevice ? 12 : 16,
    CARD: isTablet ? 24 : isSmallDevice ? 12 : 16,
    BUTTON_HORIZONTAL: isTablet ? 32 : isSmallDevice ? 16 : 24,
    BUTTON_VERTICAL: isTablet ? 16 : isSmallDevice ? 10 : 12,
};

// Responsive grid columns
export const getGridColumns = () => {
    if (isTablet) {
        return isLandscape ? 4 : 3;
    }
    return 2; // Default 2 columns for phones
};

// Responsive card width
export const getCardWidth = (columns = 2, gap = 16) => {
    const totalPadding = PADDING.SCREEN_HORIZONTAL * 2;
    const totalGap = gap * (columns - 1);
    return (SCREEN_WIDTH - totalPadding - totalGap) / columns;
};

// Responsive image sizes
export const IMAGE_SIZES = {
    AVATAR_SMALL: isTablet ? 48 : isSmallDevice ? 32 : 40,
    AVATAR_MEDIUM: isTablet ? 64 : isSmallDevice ? 48 : 56,
    AVATAR_LARGE: isTablet ? 96 : isSmallDevice ? 64 : 80,
    THUMBNAIL: isTablet ? 120 : isSmallDevice ? 80 : 100,
};

// Responsive icon sizes
export const ICON_SIZES = {
    XS: isTablet ? 16 : 12,
    SM: isTablet ? 20 : 16,
    MD: isTablet ? 24 : 20,
    LG: isTablet ? 32 : 24,
    XL: isTablet ? 48 : 32,
};

// Helper to get responsive value based on screen size
export const getResponsiveValue = (values) => {
    if (isTablet) {
        return values.tablet !== undefined ? values.tablet : values.large || values.default;
    }
    if (isSmallDevice) {
        return values.small !== undefined ? values.small : values.default;
    }
    return values.default;
};

// Helper to check if device is in landscape
export const useIsLandscape = () => {
    return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// Export screen dimensions
export const SCREEN_DIMENSIONS = {
    WIDTH: SCREEN_WIDTH,
    HEIGHT: SCREEN_HEIGHT,
    IS_LANDSCAPE: isLandscape,
    IS_PORTRAIT: !isLandscape,
};

export default {
    SCREEN_SIZES,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    isLandscape,
    scale,
    verticalScale,
    moderateScale,
    TOUCH_TARGETS,
    SPACING,
    FONT_SIZES,
    PADDING,
    getGridColumns,
    getCardWidth,
    IMAGE_SIZES,
    ICON_SIZES,
    getResponsiveValue,
    useIsLandscape,
    SCREEN_DIMENSIONS,
};
