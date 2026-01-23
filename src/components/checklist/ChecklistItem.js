/**
 * Enhanced ChecklistItem Component
 * 
 * Displays a single checklist item with expandable card design, swipeable actions,
 * and smooth animations. Supports collapsed and expanded views.
 */

import React, { useState, useRef, memo, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger action
const ACTION_WIDTH = 80; // Width of action buttons

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
 * Get regulatory reference based on category
 * @param {string} category - Checklist category
 * @returns {string} Regulatory reference
 */
const getRegulatoryReference = (category) => {
    const references = {
        'Food Safety': 'FDA CFR 21, HACCP Guidelines',
        'Fire Safety': 'NFPA 101, OSHA 29 CFR 1910',
        'Safety': 'OSHA 29 CFR 1910',
        'Compliance': 'Industry Standards',
        'Health & Hygiene': 'FDA CFR 21, Local Health Codes',
        'Equipment Maintenance': 'OSHA 29 CFR 1910',
        'Training': 'OSHA 29 CFR 1926',
        'Documentation': 'ISO 9001, Industry Standards',
    };
    return references[category] || 'Industry Standards';
};

/**
 * Enhanced ChecklistItem Component
 * 
 * @param {Object} props
 * @param {Object} props.item - Checklist item object
 * @param {Function} props.onPress - Callback when item is pressed (for details)
 * @param {Function} props.onToggleComplete - Callback when item is marked complete
 * @param {Function} props.onSnooze - Callback when item is snoozed
 */
const ChecklistItem = ({ item, onPress, onToggleComplete, onSnooze }) => {
    const [expanded, setExpanded] = useState(false);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    
    const expandAnimation = useRef(new Animated.Value(0)).current;
    const swipeAnimation = useRef(new Animated.Value(0)).current;
    const opacityAnimation = useRef(new Animated.Value(item.completed ? 0.6 : 1)).current;
    const checkmarkScale = useRef(new Animated.Value(item.completed ? 1 : 0)).current;
    const successPulse = useRef(new Animated.Value(0)).current;

    const dueDateColor = getDueDateColor(item.dueDate, item.completed);
    const priorityColor = getPriorityColor(item.priority);
    const regulatoryReference = getRegulatoryReference(item.category);

    // Expand/collapse animation
    useEffect(() => {
        Animated.spring(expandAnimation, {
            toValue: expanded ? 1 : 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
        }).start();
    }, [expanded, expandAnimation]);

    // Opacity animation for completed items
    useEffect(() => {
        Animated.timing(opacityAnimation, {
            toValue: item.completed ? 0.6 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [item.completed]);

    // Animate checkmark and pulse when completion changes
    useEffect(() => {
        if (item.completed) {
            // Animate checkmark scale
            Animated.spring(checkmarkScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 200,
                friction: 5,
            }).start();

            // Animate success pulse
            Animated.sequence([
                Animated.timing(successPulse, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(successPulse, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(checkmarkScale, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [item.completed, checkmarkScale, successPulse]);

    // Refs for mutable dependencies in PanResponder
    const expandedRef = useRef(expanded);
    const onToggleCompleteRef = useRef(onToggleComplete);
    const onSnoozeRef = useRef(onSnooze);
    const itemRef = useRef(item);

    // Keep refs updated
    useEffect(() => {
        expandedRef.current = expanded;
    }, [expanded]);

    useEffect(() => {
        onToggleCompleteRef.current = onToggleComplete;
    }, [onToggleComplete]);

    useEffect(() => {
        onSnoozeRef.current = onSnooze;
    }, [onSnooze]);

    useEffect(() => {
        itemRef.current = item;
    }, [item]);

    // Pan responder for swipe gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !expandedRef.current,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return !expandedRef.current && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderGrant: () => {
                setIsSwiping(true);
                swipeAnimation.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                const dx = gestureState.dx;
                // Limit swipe to left (complete) or right (snooze)
                if (dx < 0 && dx > -ACTION_WIDTH) {
                    swipeAnimation.setValue(dx);
                    setSwipeOffset(dx);
                } else if (dx > 0 && dx < ACTION_WIDTH) {
                    swipeAnimation.setValue(dx);
                    setSwipeOffset(dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                setIsSwiping(false);
                const dx = gestureState.dx;

                // Swipe left to complete
                if (dx < -SWIPE_THRESHOLD && onToggleCompleteRef.current) {
                    Animated.spring(swipeAnimation, {
                        toValue: -SCREEN_WIDTH,
                        useNativeDriver: true,
                    }).start(() => {
                        onToggleCompleteRef.current?.(itemRef.current);
                        swipeAnimation.setValue(0);
                        setSwipeOffset(0);
                    });
                }
                // Swipe right to snooze
                else if (dx > SWIPE_THRESHOLD && onSnoozeRef.current) {
                    Animated.spring(swipeAnimation, {
                        toValue: SCREEN_WIDTH,
                        useNativeDriver: true,
                    }).start(() => {
                        onSnoozeRef.current?.(itemRef.current);
                        swipeAnimation.setValue(0);
                        setSwipeOffset(0);
                    });
                }
                // Snap back
                else {
                    Animated.spring(swipeAnimation, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                    setSwipeOffset(0);
                }
            },
        })
    ).current;

    // Memoize handlers to prevent re-renders
    const handleCheckboxPress = useCallback((e) => {
        e.stopPropagation();
        if (onToggleComplete) {
            onToggleComplete(item);
        }
    }, [onToggleComplete, item]);

    const handleCardPress = useCallback(() => {
        setExpanded(prev => !prev);
    }, []);

    const handleMarkComplete = useCallback(() => {
        if (onToggleComplete) {
            onToggleComplete(item);
        }
        setExpanded(false);
    }, [onToggleComplete, item]);

    const handleSnooze = useCallback(() => {
        if (onSnooze) {
            onSnooze(item);
        }
        setExpanded(false);
    }, [onSnooze, item]);

    const handleViewDetails = useCallback(() => {
        if (onPress) {
            onPress(item);
        }
        setExpanded(false);
    }, [onPress, item]);

    // Calculate expanded height
    const expandedHeight = expandAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 200], // Approximate height for expanded content
    });

    // Swipe action buttons opacity
    const completeActionOpacity = swipeAnimation.interpolate({
        inputRange: [-ACTION_WIDTH, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const snoozeActionOpacity = swipeAnimation.interpolate({
        inputRange: [0, ACTION_WIDTH],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <Animated.View
            style={[
                styles.wrapper,
            ]}
        >
            {/* Swipe Action: Complete (left) */}
            <Animated.View
                style={[
                    styles.swipeAction,
                    styles.completeAction,
                    {
                        opacity: completeActionOpacity,
                        transform: [{ translateX: swipeAnimation }],
                    },
                ]}
            >
                <MaterialCommunityIcons name="check-circle" size={32} color={COLORS.textInverse} />
                <Text style={styles.actionText}>Complete</Text>
            </Animated.View>

            {/* Swipe Action: Snooze (right) */}
            <Animated.View
                style={[
                    styles.swipeAction,
                    styles.snoozeAction,
                    {
                        opacity: snoozeActionOpacity,
                        transform: [{ translateX: swipeAnimation }],
                    },
                ]}
            >
                <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.textInverse} />
                <Text style={styles.actionText}>Snooze</Text>
            </Animated.View>

            {/* Main Card */}
            <Animated.View
                style={[
                    styles.container,
                    item.completed && styles.containerCompleted,
                    {
                        opacity: opacityAnimation,
                        transform: [{ translateX: swipeAnimation }],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCardPress}
                    style={styles.cardContent}
                    accessibilityLabel={`${item.title}, ${item.completed ? 'completed' : 'pending'}, ${item.priority ? `${item.priority} priority` : ''}, due ${formatDueDate(item.dueDate)}`}
                    accessibilityHint={expanded ? 'Double tap to collapse' : 'Double tap to expand and view details'}
                    accessibilityRole="button"
                    accessibilityState={{ expanded, checked: item.completed }}
                >
                    {/* Collapsed View */}
                    <View style={styles.collapsedContent}>
                        {/* Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={handleCheckboxPress}
                            activeOpacity={0.7}
                            accessibilityLabel={item.completed ? `Mark ${item.title} as incomplete` : `Mark ${item.title} as complete`}
                            accessibilityHint="Double tap to toggle completion status"
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: item.completed }}
                        >
                            <Animated.View
                                style={[
                                    styles.checkbox,
                                    item.completed && styles.checkboxChecked,
                                    {
                                        transform: [
                                            {
                                                scale: successPulse.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [1, 1.15],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <Animated.View
                                    style={{
                                        opacity: checkmarkScale,
                                        transform: [{ scale: checkmarkScale }],
                                    }}
                                >
                                    {item.completed && (
                                        <MaterialCommunityIcons
                                            name="check"
                                            size={16}
                                            color={COLORS.textInverse}
                                        />
                                    )}
                                </Animated.View>
                            </Animated.View>
                        </TouchableOpacity>

                        {/* Main Content */}
                        <View style={styles.content}>
                            {/* Header Row */}
                            <View style={styles.headerRow}>
                                <Text
                                    style={[styles.title, item.completed && styles.titleCompleted]}
                                    numberOfLines={expanded ? 0 : 2}
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

                            {/* Meta Row */}
                            <View style={styles.metaRow}>
                                {/* Category Tag */}
                                {item.category && (
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryText}>{item.category}</Text>
                                    </View>
                                )}

                                {/* Due Date */}
                                <View style={styles.dueDateRow}>
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
                        </View>

                        {/* Expand/Collapse Icon */}
                        <Animated.View
                            style={{
                                transform: [
                                    {
                                        rotate: expandAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '180deg'],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <MaterialCommunityIcons
                                name="chevron-down"
                                size={24}
                                color={COLORS.textLight}
                            />
                        </Animated.View>
                    </View>

                    {/* Expanded View */}
                    <Animated.View
                        style={[
                            styles.expandedContent,
                            {
                                maxHeight: expandedHeight,
                                opacity: expandAnimation,
                            },
                        ]}
                    >
                        {/* Description */}
                        {item.description && (
                            <View style={styles.descriptionContainer}>
                                <Text style={styles.descriptionLabel}>Description:</Text>
                                <Text style={styles.description}>{item.description}</Text>
                            </View>
                        )}

                        {/* Regulatory Reference */}
                        <View style={styles.referenceContainer}>
                            <MaterialCommunityIcons
                                name="file-document-outline"
                                size={16}
                                color={COLORS.textSecondary}
                            />
                            <Text style={styles.referenceText}>{regulatoryReference}</Text>
                        </View>

                        {/* Notes */}
                        {item.notes && (
                            <View style={styles.notesContainer}>
                                <Text style={styles.notesLabel}>Notes:</Text>
                                <Text style={styles.notes}>{item.notes}</Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            {!item.completed && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.completeButton]}
                                    onPress={handleMarkComplete}
                                    activeOpacity={0.7}
                                    accessibilityLabel={`Mark ${item.title} as complete`}
                                    accessibilityHint="Double tap to mark this checklist item as completed"
                                    accessibilityRole="button"
                                >
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={20}
                                        color={COLORS.textInverse}
                                    />
                                    <Text style={styles.actionButtonText}>Mark Complete</Text>
                                </TouchableOpacity>
                            )}

                            {!item.completed && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.snoozeButton]}
                                    accessibilityLabel={`Snooze ${item.title}`}
                                    accessibilityHint="Double tap to snooze this checklist item"
                                    accessibilityRole="button"
                                    onPress={handleSnooze}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons
                                        name="clock-outline"
                                        size={20}
                                        color={COLORS.textInverse}
                                    />
                                    <Text style={styles.actionButtonText}>Snooze</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.actionButton, styles.detailsButton]}
                                onPress={handleViewDetails}
                                activeOpacity={0.7}
                                accessibilityLabel={`View details for ${item.title}`}
                                accessibilityHint="Double tap to view full details of this checklist item"
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons
                                    name="information-outline"
                                    size={20}
                                    color={COLORS.primary}
                                />
                                <Text style={[styles.actionButtonText, styles.detailsButtonText]}>
                                    View Details
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 12,
        position: 'relative',
    },
    swipeAction: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: ACTION_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    completeAction: {
        left: 0,
        backgroundColor: COLORS.success,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    snoozeAction: {
        right: 0,
        backgroundColor: COLORS.warning,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    actionText: {
        color: COLORS.textInverse,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        zIndex: 2,
        // Shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    containerCompleted: {
        borderColor: COLORS.success + '40',
        backgroundColor: COLORS.surface,
    },
    cardContent: {
        padding: 16,
    },
    collapsedContent: {
        flexDirection: 'row',
        alignItems: 'center',
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
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryTag: {
        backgroundColor: COLORS.backgroundSecondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    dueDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dueDate: {
        fontSize: 13,
        fontWeight: '500',
    },
    expandedContent: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        overflow: 'hidden',
    },
    descriptionContainer: {
        marginBottom: 12,
    },
    descriptionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    referenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 6,
    },
    referenceText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    notesContainer: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 8,
    },
    notesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    notes: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    completeButton: {
        backgroundColor: COLORS.success,
    },
    snoozeButton: {
        backgroundColor: COLORS.warning,
    },
    detailsButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textInverse,
    },
    detailsButtonText: {
        color: COLORS.primary,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(ChecklistItem, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.title === nextProps.item.title &&
        prevProps.item.completed === nextProps.item.completed &&
        prevProps.item.dueDate === nextProps.item.dueDate &&
        prevProps.item.priority === nextProps.item.priority &&
        prevProps.item.category === nextProps.item.category &&
        prevProps.item.description === nextProps.item.description &&
        prevProps.item.notes === nextProps.item.notes &&
        prevProps.onPress === nextProps.onPress &&
        prevProps.onToggleComplete === nextProps.onToggleComplete &&
        prevProps.onSnooze === nextProps.onSnooze
    );
});
