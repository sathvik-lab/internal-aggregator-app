/**
 * EmptyState Component
 * 
 * Displays an empty state message when there's no data to show.
 * Used in lists and sections throughout the app.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * EmptyState Component
 * 
 * @param {Object} props
 * @param {string} props.icon - Icon name from MaterialCommunityIcons
 * @param {string} props.title - Title text
 * @param {string} props.message - Message text
 */
const EmptyState = ({ icon = 'inbox-outline', title, message }) => {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons
                name={icon}
                size={48}
                color={COLORS.textLight}
            />
            {title && <Text style={styles.title}>{title}</Text>}
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default EmptyState;
