/**
 * Button Component
 * 
 * Reusable button component with multiple variants, sizes, and states.
 * This is the standard button used throughout the app for consistency.
 */

import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TOUCH_TARGETS, PADDING, moderateScale } from '../../utils/responsive';

/**
 * Button Component
 * 
 * @param {Object} props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'outline', 'text' (default: 'primary')
 * @param {string} props.size - Button size: 'small', 'medium', 'large' (default: 'medium')
 * @param {boolean} props.loading - Shows loading spinner and disables button
 * @param {boolean} props.disabled - Disables the button
 * @param {string} props.icon - Icon name from MaterialCommunityIcons (optional)
 * @param {string} props.iconPosition - Icon position: 'left' or 'right' (default: 'left')
 * @param {boolean} props.fullWidth - Makes button full width
 * @param {string} props.color - Custom color override for primary variant
 * @param {Function} props.onPress - Callback when button is pressed
 * @param {string} props.title - Button text
 * @param {Object} props.style - Additional styles for the button
 * @param {Object} props.textStyle - Additional styles for the text
 */
const Button = ({
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    color,
    onPress,
    title,
    style,
    textStyle,
    ...props
}) => {
    const { colors, shadows, spacing } = useTheme();
    
    // Determine if button should be disabled
    const isDisabled = disabled || loading;

    // Get variant styles
    const getVariantStyles = () => {
        const customColor = color || colors.primary;
        
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: isDisabled ? colors.border : customColor,
                    borderWidth: 0,
                    borderColor: 'transparent',
                };
            case 'secondary':
                return {
                    backgroundColor: isDisabled ? colors.border : colors.secondary,
                    borderWidth: 0,
                    borderColor: 'transparent',
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: isDisabled ? colors.border : customColor,
                };
            case 'text':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    borderColor: 'transparent',
                };
            case 'danger':
                return {
                    backgroundColor: isDisabled ? colors.border : colors.error,
                    borderWidth: 0,
                    borderColor: 'transparent',
                };
            default:
                return {
                    backgroundColor: isDisabled ? colors.border : customColor,
                    borderWidth: 0,
                    borderColor: 'transparent',
                };
        }
    };

    // Get text color based on variant
    const getTextColor = () => {
        const customColor = color || colors.primary;
        
        if (isDisabled) {
            return colors.textLight;
        }
        
        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                return colors.textInverse;
            case 'outline':
            case 'text':
                return customColor;
            default:
                return colors.textInverse;
        }
    };

    // Get size styles (ensuring minimum touch target of 44x44)
    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    paddingVertical: moderateScale(8),
                    paddingHorizontal: moderateScale(16),
                    minHeight: Math.max(TOUCH_TARGETS.MINIMUM, moderateScale(36)),
                };
            case 'medium':
                return {
                    paddingVertical: moderateScale(12),
                    paddingHorizontal: PADDING.BUTTON_HORIZONTAL,
                    minHeight: Math.max(TOUCH_TARGETS.MINIMUM, moderateScale(44)),
                };
            case 'large':
                return {
                    paddingVertical: moderateScale(16),
                    paddingHorizontal: moderateScale(32),
                    minHeight: Math.max(TOUCH_TARGETS.MINIMUM, moderateScale(52)),
                };
            default:
                return {
                    paddingVertical: moderateScale(12),
                    paddingHorizontal: PADDING.BUTTON_HORIZONTAL,
                    minHeight: Math.max(TOUCH_TARGETS.MINIMUM, moderateScale(44)),
                };
        }
    };

    // Get icon size based on button size
    const getIconSize = () => {
        switch (size) {
            case 'small':
                return 16;
            case 'medium':
                return 20;
            case 'large':
                return 24;
            default:
                return 20;
        }
    };

    // Get font size based on button size (responsive)
    const getFontSize = () => {
        switch (size) {
            case 'small':
                return moderateScale(14);
            case 'medium':
                return moderateScale(16);
            case 'large':
                return moderateScale(18);
            default:
                return moderateScale(16);
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    const textColor = getTextColor();
    const iconSize = getIconSize();
    const fontSize = getFontSize();

    // Scale animation for press feedback
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (!isDisabled) {
            Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        }
    };

    const handlePressOut = () => {
        if (!isDisabled) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        }
    };

    const renderIcon = () => {
        if (loading) {
            return (
                <ActivityIndicator
                    size="small"
                    color={textColor}
                    style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
                />
            );
        }
        
        if (icon) {
            return (
                <MaterialCommunityIcons
                    name={icon}
                    size={iconSize}
                    color={textColor}
                    style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
                />
            );
        }
        
        return null;
    };

    // Build accessibility label with icon context
    const getAccessibilityLabel = () => {
        if (!title) return undefined;
        let label = title;
        if (icon) {
            const iconLabel = icon.replace(/-/g, ' ').replace(/([A-Z])/g, ' $1').trim();
            label = iconPosition === 'left' 
                ? `${iconLabel}, ${label}`
                : `${label}, ${iconLabel}`;
        }
        if (loading) {
            label = `Loading, ${label}`;
        }
        return label;
    };

    // Build accessibility hint
    const getAccessibilityHint = () => {
        if (isDisabled) {
            return 'Button is disabled';
        }
        if (loading) {
            return 'Please wait while the action completes';
        }
        return undefined;
    };

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
                fullWidth && styles.fullWidth,
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    variantStyles,
                    sizeStyles,
                    // Add shadow for non-text variants
                    variant !== 'text' && !isDisabled && shadows.shadows[2],
                    fullWidth && styles.fullWidth,
                    style,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                activeOpacity={1} // Disable default opacity change, use scale instead
                accessibilityLabel={getAccessibilityLabel()}
                accessibilityHint={getAccessibilityHint()}
                accessibilityRole="button"
                accessibilityState={{ disabled: isDisabled }}
                {...props}
            >
            <View style={styles.content}>
                {iconPosition === 'left' && renderIcon()}
                {title && (
                    <Text
                        style={[
                            styles.text,
                            { color: textColor, fontSize },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                )}
                {iconPosition === 'right' && renderIcon()}
            </View>
        </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    fullWidth: {
        width: '100%',
    },
});

export default Button;
