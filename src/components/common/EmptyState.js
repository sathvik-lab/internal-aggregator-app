/**
 * EmptyState Component
 * 
 * Displays an empty state message when there's no data to show.
 * Used in lists, sections, and search results throughout the app.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * EmptyState Component
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name from MaterialCommunityIcons (default: 'inbox-outline')
 * @param {string} props.title - Title text
 * @param {string} props.message - Message text
 * @param {Function} props.onAction - Optional callback for action button
 * @param {string} props.actionLabel - Label for action button (default: 'Get Started')
 * @param {boolean} props.showAction - Whether to show action button (default: false)
 */
const EmptyState = ({ 
    icon = 'inbox-outline', 
    title, 
    message,
    onAction,
    actionLabel = 'Get Started',
    showAction = false
}) => {
    return (
        <View 
            style={styles.container}
            accessibilityRole="text"
        >
            <MaterialCommunityIcons
                name={icon}
                size={64}
                color={COLORS.textLight}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
            />
            {title && (
                <Text 
                    style={styles.title}
                    accessibilityRole="header"
                    accessibilityLevel={3}
                >
                    {title}
                </Text>
            )}
            {message && (
                <Text 
                    style={styles.message}
                    accessibilityRole="text"
                >
                    {message}
                </Text>
            )}
            {showAction && onAction && (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onAction}
                    activeOpacity={0.7}
                >
                    <Text style={styles.actionButtonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
        minWidth: 140,
    },
    actionButtonText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default EmptyState;
