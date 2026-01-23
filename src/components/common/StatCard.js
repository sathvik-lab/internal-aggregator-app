/**
 * StatCard Component
 * 
 * Reusable card component for displaying statistics on the dashboard.
 * Features icon, large number, label, optional subtitle, and press animation.
 */

import React, { memo, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { moderateScale, PADDING, SPACING, isTablet, getCardWidth } from '../../utils/responsive';

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
    color = COLORS.primary,
    style,
}) => {
    const CardComponent = onPress ? TouchableOpacity : View;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Memoize accessibility label
    const accessibilityLabel = useMemo(() => {
        return `${label}: ${value}${subtitle ? `. ${subtitle}` : ''}`;
    }, [label, value, subtitle]);
    
    const accessibilityHint = onPress ? `Double tap to view ${label.toLowerCase()}` : undefined;

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

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
            ]}
        >
            <CardComponent
                style={[styles.card, style]}
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
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <MaterialCommunityIcons
                    name={icon}
                    size={28}
                    color={color}
                />
            </View>

            {/* Value */}
            <Text style={styles.value}>{value}</Text>

            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Subtitle (optional) */}
            {subtitle && (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                )}
        </CardComponent>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: moderateScale(12),
        padding: PADDING.CARD,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isTablet ? moderateScale(180) : moderateScale(160),
        // Shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
        borderWidth: 1,
        borderColor: COLORS.border,
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
        fontSize: isTablet ? moderateScale(36) : moderateScale(32),
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.XS,
    },
    label: {
        fontSize: moderateScale(14),
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: SPACING.XS,
    },
    subtitle: {
        fontSize: moderateScale(12),
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: SPACING.XS,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(StatCard);
