/**
 * Checklist Screen
 * 
 * Screen for managing compliance checklists.
 * Users can view and complete compliance tasks.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const ChecklistScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Checklist</Text>
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                    ✅ Compliance checklist will be implemented here
                </Text>
                <Text style={styles.placeholderSubtext}>
                    Track and complete compliance tasks
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    placeholder: {
        backgroundColor: COLORS.surface,
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    placeholderText: {
        fontSize: 18,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    placeholderSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default ChecklistScreen;
