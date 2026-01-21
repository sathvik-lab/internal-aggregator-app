/**
 * ChecklistItem Component
 * 
 * Displays a single checklist item with title, due date, priority, and completion checkbox.
 * Used in dashboard and checklist screens.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

/**
 * Get due date color based on date
 * @param {string} dueDate - ISO date string
 * @param {boolean} completed - Whether the item is completed
 * @returns {string} Color code
 */
const getDueDateColor = (dueDate, completed) => {
    if (completed) {
        return COLORS.textLight; // Gray for completed items
    }

    if (!dueDate) {
        return COLORS.textSecondary;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return COLORS.error; // Red for overdue
    } else if (diffDays === 0) {
        return COLORS.warning; // Orange for due today
    } else {
        return COLORS.textSecondary; // Gray for upcoming
    }
};

/**
 * Format due date for display
 * @param {string} dueDate - ISO date string
 * @returns {string} Formatted date string
 */
const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
        return 'Due today';
    } else if (diffDays === 1) {
        return 'Due tomorrow';
    } else if (diffDays <= 7) {
        return `Due in ${diffDays} days`;
    } else {
        return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

/**
 * Get priority color
 * @param {string} priority - Priority level (high, medium, low, critical)
 * @returns {string} Color code
 */
const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'critical':
            return COLORS.error;
        case 'high':
            return COLORS.warning;
        case 'medium':
            return COLORS.info;
        case 'low':
            return COLORS.textLight;
        default:
            return COLORS.textSecondary;
    }
};

/**
 * Get priority label
 * @param {string} priority - Priority level
 * @returns {string} Formatted priority label
 */
const getPriorityLabel = (priority) => {
    if (!priority) return '';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
};

/**
 * ChecklistItem Component
 * 
 * @param {Object} props
 * @param {Object} props.item - Checklist item object
 * @param {Function} props.onPress - Callback when item is pressed
 * @param {Function} props.onToggleComplete - Callback when checkbox is toggled
 */
const ChecklistItem = ({ item, onPress, onToggleComplete }) => {
    const dueDateColor = getDueDateColor(item.dueDate, item.completed);
    const priorityColor = getPriorityColor(item.priority);

    const handleCheckboxPress = (e) => {
        e.stopPropagation(); // Prevent triggering onPress
        if (onToggleComplete) {
            onToggleComplete(item);
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress(item)}
            activeOpacity={0.7}
        >
            {/* Checkbox */}
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={handleCheckboxPress}
                activeOpacity={0.7}
            >
                <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
                    {item.completed && (
                        <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color={COLORS.textInverse}
                        />
                    )}
                </View>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                {/* Title and Priority */}
                <View style={styles.headerRow}>
                    <Text
                        style={[styles.title, item.completed && styles.titleCompleted]}
                        numberOfLines={2}
                    >
                        {item.title}
                    </Text>
                    {item.priority && (
                        <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                            <Text style={[styles.priorityText, { color: priorityColor }]}>
                                {getPriorityLabel(item.priority)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Due Date */}
                <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                        name="calendar-clock"
                        size={14}
                        color={dueDateColor}
                    />
                    <Text style={[styles.dueDate, { color: dueDateColor }]}>
                        {formatDueDate(item.dueDate)}
                    </Text>
                </View>
            </View>

            {/* Arrow Icon */}
            <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={COLORS.textLight}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        // Shadow for depth
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
    checkboxContainer: {
        marginRight: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.borderDark,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    checkboxChecked: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginRight: 8,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: COLORS.textLight,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dueDate: {
        fontSize: 13,
        fontWeight: '500',
    },
});

export default ChecklistItem;
