/**
 * Documents Screen
 * 
 * Screen for managing compliance documents.
 * Users can view, upload, and organize documents here.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

const DocumentsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Documents</Text>
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                    📁 Documents management will be implemented here
                </Text>
                <Text style={styles.placeholderSubtext}>
                    Upload, view, and organize compliance documents
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

export default DocumentsScreen;
