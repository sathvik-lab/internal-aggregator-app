/**
 * StatCard Component
 * 
 * Reusable card component for displaying statistics on the dashboard.
 * Features icon, large number, label, optional subtitle, and press animation.
 */

import React, { memo, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { moderateScale, PADDING, SPACING, isTablet, getCardWidth } from '../../utils/responsive';
import { GLASS } from '../../utils/glassmorphism';

/**
 * StatCard Component
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name from MaterialCommunityIcons
 * @param {string|number} props.value - Main statistic value to display
 * @param {string} props.label - Label text below the value
 * @param {string} props.subtitle - Optional subtitle or trend indicator
 * @param {Function} props.onPress - Optional callback when card is pressed
 * @param {string} props.color - Optional color for icon background (default: primary)
 * @param {Object} props.style - Optional additional styles for the card
 */
const StatCard = ({
    icon,
    value,
    label,
    subtitle,
    onPress,
    color,
    style,
    trend, // 'up', 'down', or undefined
    trendValue, // e.g., '+12%'
}) => {
    const { colors, typography, spacing, shadows } = useTheme();
    const cardColor = color || colors.primary;
    const CardComponent = onPress ? TouchableOpacity : View;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const iconPulseAnim = useRef(new Animated.Value(1)).current;

    // Memoize accessibility label
    const accessibilityLabel = useMemo(() => {
        return `${label}: ${value}${subtitle ? `. ${subtitle}` : ''}`;
    }, [label, value, subtitle]);
    
    const accessibilityHint = onPress && label ? `Double tap to view ${(typeof label === 'string' ? label : String(label || '')).toLowerCase()}` : undefined;

    const handlePressIn = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        }
    };

    const handlePressOut = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        }
    };

    // Subtle icon pulse animation
    React.useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(iconPulseAnim, {
                    toValue: 1.1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(iconPulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();
        return () => pulseAnimation.stop();
    }, []);

    const useGlass = colors.glassBackground != null;
    const cardContainerStyle = useGlass
        ? [
            styles.card,
            styles.glassCard,
            {
                borderColor: colors.glassBorder ?? GLASS.border,
                backgroundColor: Platform.OS === 'android' ? (colors.glassBackground ?? GLASS.background) : 'transparent',
            },
            style,
        ]
        : [
            styles.card,
            {
                backgroundColor: colors.surface.surface,
                borderColor: colors.border.default,
                ...shadows.shadows[2],
            },
            style,
        ];

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
            ]}
        >
            <CardComponent
                style={cardContainerStyle}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={onPress ? 1 : 1}
                disabled={!onPress}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityRole={onPress ? "button" : "text"}
                accessibilityState={{ disabled: !onPress }}
            >
            {useGlass && Platform.OS === 'ios' && (
                <BlurView
                    intensity={80}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
            )}
            {useGlass && (
                <View style={styles.glow} pointerEvents="none" />
            )}
            <View style={styles.contentInner} pointerEvents="box-none">
            {/* Icon Container with gradient effect */}
            <Animated.View 
                style={[
                    styles.iconContainer, 
                    { 
                        backgroundColor: useGlass ? (colors.glassHover ?? GLASS.hover) : `${cardColor}20`,
                        transform: [{ scale: iconPulseAnim }],
                    }
                ]}
            >
                <MaterialCommunityIcons
                    name={icon}
                    size={isTablet ? 32 : 28}
                    color={cardColor}
                />
            </Animated.View>

            {/* Value with better typography */}
            <Text style={[
                styles.value,
                { 
                    color: colors.text.primary,
                    ...typography.textStyles.h2,
                }
            ]}>
                {value}
            </Text>

            {/* Label */}
            <Text style={[
                styles.label,
                { 
                    color: colors.text.secondary,
                    ...typography.textStyles.bodySmall,
                }
            ]}>
                {label}
            </Text>

            {/* Trend indicator or subtitle */}
            {(trend || subtitle) && (
                <View style={styles.trendContainer}>
                    {trend && trendValue && (
                        <View style={[
                            styles.trendBadge,
                            { 
                                backgroundColor: trend === 'up' 
                                    ? `${colors.success}20` 
                                    : `${colors.error}20`,
                            }
                        ]}>
                            <MaterialCommunityIcons
                                name={trend === 'up' ? 'trending-up' : 'trending-down'}
                                size={12}
                                color={trend === 'up' ? colors.success : colors.error}
                            />
                            <Text style={[
                                styles.trendText,
                                { 
                                    color: trend === 'up' ? colors.success : colors.error,
                                }
                            ]}>
                                {trendValue}
                            </Text>
                        </View>
                    )}
                    {subtitle && (
                        <Text style={[
                            styles.subtitle,
                            { color: colors.text.tertiary }
                        ]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            )}
            </View>
        </CardComponent>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: SPACING.BASE,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isTablet ? moderateScale(180) : moderateScale(160),
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    glassCard: {
        borderRadius: 24,
        padding: SPACING.BASE,
    },
    glow: {
        position: 'absolute',
        top: Number(0),
        right: Number(0),
        width: 160,
        height: 160,
        marginRight: -64,
        marginTop: -64,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    contentInner: {
        ...StyleSheet.absoluteFillObject,
        padding: SPACING.BASE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: isTablet ? moderateScale(64) : moderateScale(56),
        height: isTablet ? moderateScale(64) : moderateScale(56),
        borderRadius: isTablet ? moderateScale(32) : moderateScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.SM,
    },
    value: {
        marginBottom: SPACING.XS,
        textAlign: 'center',
    },
    label: {
        textAlign: 'center',
        marginBottom: SPACING.XS,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.XS,
        gap: SPACING.XS,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.SM,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(StatCard);
