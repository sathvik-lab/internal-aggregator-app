/**
 * FilterChip Component
 *
 * Chip component for filtering documents by category.
 * Glassmorphism variant: bg-white/5, border-white/10, rounded-full.
 */

import React, { memo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';

/**
 * FilterChip Component
 *
 * @param {Object} props
 * @param {string} props.label - Chip label text
 * @param {boolean} props.selected - Whether the chip is selected
 * @param {Function} props.onPress - Callback when chip is pressed
 */
const FilterChip = ({ label, selected, onPress }) => {
    const { colors } = useTheme();
    const useGlass = colors.glassBackground != null;

    const chipStyle = useGlass
        ? [
            styles.chip,
            styles.glassChip,
            {
                backgroundColor: selected ? (colors.glassHover ?? GLASS.hover) : (colors.glassBackground ?? GLASS.background),
                borderColor: selected ? (colors.glassBorder ?? GLASS.border) : (colors.glassBorder ?? GLASS.border),
            },
        ]
        : [styles.chip, selected && styles.chipSelected];

    const textColor = useGlass
        ? (colors.text?.primary ?? COLORS.text)
        : (selected ? COLORS.textInverse : COLORS.textSecondary);

    return (
        <TouchableOpacity
            style={chipStyle}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityLabel={`Filter by ${label}${selected ? ', selected' : ''}`}
            accessibilityHint={selected ? 'Filter is active. Double tap to remove filter.' : 'Double tap to filter by this category'}
            accessibilityRole="button"
            accessibilityState={{ selected }}
        >
            <Text style={[styles.chipText, { color: textColor }]}>
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
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
    },
    glassChip: {
        borderRadius: 9999,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(FilterChip);
