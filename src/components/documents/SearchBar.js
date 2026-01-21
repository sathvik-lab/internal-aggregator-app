/**
 * SearchBar Component
 * 
 * Search input component for filtering documents by name.
 */

import React from 'react';
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
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={COLORS.textLight}
                style={styles.searchIcon}
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textLight}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value.length > 0 && (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={onClear}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name="close-circle"
                        size={20}
                        color={COLORS.textLight}
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

export default SearchBar;
