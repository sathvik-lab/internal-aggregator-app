/**
 * SearchBar Component
 * 
 * Reusable search input component with debouncing, clear button, and optional filter.
 * Used in Documents, Checklist, and other screens that require search functionality.
 */

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * SearchBar Component
 * 
 * @param {Object} props
 * @param {string} props.value - Search query value (controlled)
 * @param {Function} props.onChangeText - Callback when text changes (debounced)
 * @param {Function} props.onFocus - Callback when input is focused
 * @param {Function} props.onBlur - Callback when input loses focus
 * @param {Function} props.onFilterPress - Optional callback for filter button
 * @param {string} props.placeholder - Placeholder text (default: 'Search...')
 * @param {boolean} props.autoFocus - Whether to auto-focus on mount (default: false)
 * @param {number} props.debounceDelay - Debounce delay in milliseconds (default: 500)
 * @param {boolean} props.showFilter - Whether to show filter button (default: false)
 * @param {Object} props.style - Additional styles for the container
 */
const SearchBar = ({
    value = '',
    onChangeText,
    onFocus,
    onBlur,
    onFilterPress,
    placeholder = 'Search...',
    autoFocus = false,
    debounceDelay = 500,
    showFilter = false,
    style,
}) => {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);
    const isTypingRef = useRef(false);
    const latestLocalValueRef = useRef(value);

    // Sync local value with prop value (only when not actively typing)
    useEffect(() => {
        if (!isTypingRef.current || value !== latestLocalValueRef.current) {
            setLocalValue(value);
            latestLocalValueRef.current = value;
        }
    }, [value]);

    // Auto-focus on mount if requested
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    // Handle local text change with debouncing
    const handleTextChange = (text) => {
        isTypingRef.current = true;
        setLocalValue(text);
        latestLocalValueRef.current = text;

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer for debounced callback
        debounceTimerRef.current = setTimeout(() => {
            isTypingRef.current = false;
            if (onChangeText) {
                onChangeText(text);
            }
        }, debounceDelay);
    };

    // Handle clear button press
    const handleClear = useCallback(() => {
        isTypingRef.current = false;
        setLocalValue('');
        latestLocalValueRef.current = '';
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (onChangeText) {
            onChangeText('');
        }
        // Refocus input after clearing
        inputRef.current?.focus();
    }, [onChangeText]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <View style={[styles.container, style]}>
            {/* Search Icon */}
            <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={COLORS.textLight}
                style={styles.searchIcon}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
            />

            {/* Text Input */}
            <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textLight}
                value={localValue}
                onChangeText={handleTextChange}
                onFocus={onFocus}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="never" // We handle clear button manually
                accessibilityLabel={placeholder}
                accessibilityHint="Type to search. Results will update as you type."
                accessibilityRole="searchbox"
            />

            {/* Clear Button (shown when text is entered) */}
            {localValue.length > 0 && (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear}
                    activeOpacity={0.7}
                    accessibilityLabel="Clear search"
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

            {/* Filter Button (optional, shown on right) */}
            {showFilter && onFilterPress && (
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={onFilterPress}
                    activeOpacity={0.7}
                    accessibilityLabel="Filter options"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons
                        name="filter-variant"
                        size={20}
                        color={COLORS.primary}
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
        paddingHorizontal: 0,
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    filterButton: {
        marginLeft: 8,
        padding: 4,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        paddingLeft: 12,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(SearchBar);
