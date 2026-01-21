/**
 * QuickActionButton Component
 * 
 * Reusable button component for quick actions on the dashboard.
 * Features icon, label, press animation, and navigation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * QuickActionButton Component
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name from MaterialCommunityIcons
 * @param {string} props.label - Button label text
 * @param {Function} props.onPress - Callback when button is pressed
 * @param {string} props.color - Optional color for icon (default: primary)
 */
const QuickActionButton = ({
    icon,
    label,
    onPress,
    color = COLORS.primary,
}) => {
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={color}
                />
            </View>
            <Text style={styles.label} numberOfLines={2}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        maxWidth: 100,
        marginRight: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        // Subtle shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    label: {
        fontSize: 12,
        color: COLORS.text,
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default QuickActionButton;
