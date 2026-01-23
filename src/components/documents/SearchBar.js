/**
 * SearchBar Component
 * 
 * Search input component for filtering documents by name.
 */

import React, { memo, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * SearchBar Component
 * 
 * @param {Object} props
 * @param {string} props.value - Search query value
 * @param {Function} props.onChangeText - Callback when text changes
 * @param {Function} props.onClear - Callback when clear button is pressed
 * @param {string} props.placeholder - Placeholder text
 */
const SearchBar = ({ value, onChangeText, onClear, placeholder = 'Search documents...' }) => {
    const handleClear = useCallback(() => {
        if (onClear) {
            onClear();
        }
    }, [onClear]);

    return (
        <View style={styles.container}>
            <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={COLORS.textLight}
                style={styles.searchIcon}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search input"
                accessibilityHint={`Type to search. ${value ? `Current search: ${value}` : ''}`}
                accessibilityRole="searchbox"
            />
            {value.length > 0 && (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear}
                    activeOpacity={0.7}
                    accessibilityLabel="Clear search"
                    accessibilityHint="Double tap to clear the search text"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons
                        name="close-circle"
                        size={20}
                        color={COLORS.textLight}
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no-hide-descendants"
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        height: 48,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 0, // Remove default padding
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(SearchBar);
