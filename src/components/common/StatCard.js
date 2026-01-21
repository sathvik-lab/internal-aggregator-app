/**
 * StatCard Component
 * 
 * Reusable card component for displaying statistics on the dashboard.
 * Features icon, large number, label, optional subtitle, and press animation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

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

    return (
        <CardComponent
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
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
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
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
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: 4,
    },
});

export default StatCard;
