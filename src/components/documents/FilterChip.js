/**
 * FilterChip Component
 * 
 * Chip component for filtering documents by category.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * FilterChip Component
 * 
 * @param {Object} props
 * @param {string} props.label - Chip label text
 * @param {boolean} props.selected - Whether the chip is selected
 * @param {Function} props.onPress - Callback when chip is pressed
 */
const FilterChip = ({ label, selected, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    chipTextSelected: {
        color: COLORS.textInverse,
    },
});

export default FilterChip;
