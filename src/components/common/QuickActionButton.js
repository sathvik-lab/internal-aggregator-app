/**
 * QuickActionButton Component
 * 
 * Reusable button component for quick actions on the dashboard.
 * Features icon, label, press animation, and navigation.
 */

import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TOUCH_TARGETS, SPACING, moderateScale, ICON_SIZES, isTablet } from '../../utils/responsive';

/**
 * Convert color to translucent version with alpha
 * @param {string} color - Color in hex, rgb, rgba, or named format
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} Color string with alpha applied
 */
const getTranslucentColor = (color, opacity) => {
    // Handle 7-char hex (with #)
    if (typeof color === 'string' && color.startsWith('#') && color.length === 7) {
        const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
        return `${color}${alphaHex}`;
    }
    // Handle 6-char hex (without #)
    if (typeof color === 'string' && !color.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(color)) {
        const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
        return `#${color}${alphaHex}`;
    }
    // Handle rgb/rgba - convert to rgba
    if (typeof color === 'string' && color.startsWith('rgb')) {
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbaMatch) {
            return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
        }
    }
    // Fallback: return original color or safe default
    return color || '#000000';
};

/**
 * QuickActionButton Component
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name from MaterialCommunityIcons
 * @param {string} props.label - Button label text
 * @param {Function} props.onPress - Callback when button is pressed
 * @param {string} props.color - Optional color for icon (default: primary)
 * @param {boolean} props.disabled - When true, button is non-interactive and de-emphasized
 */
const QuickActionButton = ({
    icon,
    label,
    onPress,
    color,
    disabled = false,
}) => {
    // Use default value inside function body to avoid module load-time evaluation
    const iconColor = color || COLORS.primary;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
        }).start();
    };

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }],
            }}
        >
            <TouchableOpacity
                style={[styles.button, disabled && styles.buttonDisabled]}
                onPress={disabled ? undefined : onPress}
                onPressIn={disabled ? undefined : handlePressIn}
                onPressOut={disabled ? undefined : handlePressOut}
                activeOpacity={1}
                disabled={disabled}
                accessibilityLabel={label}
                accessibilityHint={disabled ? 'Action unavailable for your role' : `Double tap to ${label.toLowerCase()}`}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
            >
            <View style={[styles.iconContainer, { backgroundColor: getTranslucentColor(iconColor, 0.08) }]}>
                <MaterialCommunityIcons
                    name={icon}
                    size={isTablet ? ICON_SIZES.MD : ICON_SIZES.SM}
                    color={disabled ? COLORS.textLight : iconColor}
                />
            </View>
            <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={2}>
                {label}
            </Text>
        </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: isTablet ? moderateScale(100) : moderateScale(80),
        maxWidth: isTablet ? moderateScale(120) : moderateScale(100),
        minHeight: TOUCH_TARGETS.MINIMUM, // Ensure minimum touch target
        marginRight: SPACING.MD,
    },
    iconContainer: {
        width: isTablet ? moderateScale(64) : moderateScale(56),
        height: isTablet ? moderateScale(64) : moderateScale(56),
        borderRadius: isTablet ? moderateScale(32) : moderateScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.SM,
        // Subtle shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: Number(0), height: Number(1) },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    label: {
        fontSize: moderateScale(12),
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonDisabled: {
        opacity: 0.45,
    },
    labelDisabled: {
        color: COLORS.textLight,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(QuickActionButton);
