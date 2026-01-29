/**
 * NotificationBadge Component
 * 
 * Small circular badge component for displaying counts, notifications, and indicators.
 * Can be positioned absolutely on top of parent components.
 * Used for unread notifications, pending items, and other count indicators.
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

/**
 * NotificationBadge Component
 * 
 * @param {Object} props
 * @param {number} props.count - Count to display (0 hides badge, unless showWhenZero is true)
 * @param {number} props.maxCount - Maximum count to display before showing "99+" (default: 99)
 * @param {boolean} props.showDot - If true, shows only a dot without number (default: false)
 * @param {string} props.color - Badge background color (default: error/red)
 * @param {string} props.textColor - Badge text color (default: white)
 * @param {boolean} props.showWhenZero - Show badge even when count is 0 (default: false)
 * @param {Object} props.style - Additional styles for the badge container
 * @param {string} props.position - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left' (default: 'top-right')
 * @param {string} props.size - Size of the badge: 'small', 'medium', 'large' (default: 'small')
 * @param {string} props.variant - 'default' | 'glass' for glassmorphism style (default: 'default')
 */
const NotificationBadge = ({
    count = 0,
    maxCount = 99,
    showDot = false,
    color,
    textColor,
    showWhenZero = false,
    style,
    position = 'top-right',
    size = 'small',
    variant = 'default',
}) => {
    const { colors } = useTheme();
    const useGlass = variant === 'glass' && colors.glassBackground != null;
    const badgeColor = color ?? (useGlass ? (colors.glassBackground ?? 'rgba(255,255,255,0.05)') : COLORS.error);
    const badgeTextColor = textColor ?? (useGlass ? (colors.text?.primary ?? colors.textInverse) : COLORS.textInverse);
    // Memoize size dimensions
    const sizeStyles = useMemo(() => {
        switch (size) {
            case 'small':
                return {
                    minWidth: showDot ? 8 : 18,
                    height: showDot ? 8 : 18,
                    fontSize: 10,
                };
            case 'medium':
                return {
                    minWidth: showDot ? 10 : 22,
                    height: showDot ? 10 : 22,
                    fontSize: 12,
                };
            case 'large':
                return {
                    minWidth: showDot ? 12 : 26,
                    height: showDot ? 12 : 26,
                    fontSize: 14,
                };
            default:
                return {
                    minWidth: showDot ? 8 : 18,
                    height: showDot ? 8 : 18,
                    fontSize: 10,
                };
        }
    }, [size, showDot]);

    // Memoize position styles
    const positionStyles = useMemo(() => {
        const baseOffset = size === 'small' ? -4 : size === 'medium' ? -6 : -8;
        
        switch (position) {
            case 'top-right':
                return {
                    top: baseOffset,
                    right: baseOffset,
                };
            case 'top-left':
                return {
                    top: baseOffset,
                    left: baseOffset,
                };
            case 'bottom-right':
                return {
                    bottom: baseOffset,
                    right: baseOffset,
                };
            case 'bottom-left':
                return {
                    bottom: baseOffset,
                    left: baseOffset,
                };
            default:
                return {
                    top: baseOffset,
                    right: baseOffset,
                };
        }
    }, [position, size]);

    // Memoize count display text
    const displayText = useMemo(() => {
        if (showDot) {
            return null; // No text for dot mode
        }
        if (count > maxCount) {
            return `${maxCount}+`;
        }
        return count.toString();
    }, [showDot, count, maxCount]);

    // Don't show badge if count is 0 and showWhenZero is false
    if (!showWhenZero && count === 0 && !showDot) {
        return null;
    }

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: badgeColor,
                    minWidth: sizeStyles.minWidth,
                    height: sizeStyles.height,
                    ...positionStyles,
                },
                useGlass && {
                    borderWidth: 1,
                    borderColor: colors.glassBorder ?? 'rgba(255,255,255,0.1)',
                },
                style,
            ]}
        >
            {!showDot && displayText && (
                <Text
                    style={[
                        styles.text,
                        {
                            color: badgeTextColor,
                            fontSize: sizeStyles.fontSize,
                        },
                    ]}
                >
                    {displayText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        borderRadius: 999, // Large value for circular shape
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 1000, // Ensure it appears on top
        // Shadow for visibility
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3, // Android shadow
    },
    text: {
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false, // Better text centering on Android
        textAlignVertical: 'center',
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(NotificationBadge);
