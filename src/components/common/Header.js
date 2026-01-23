/**
 * Header Component
 * 
 * Reusable header component for dashboard and other screens.
 * Features user greeting, profile picture, notification bell, and date display.
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';

/**
 * Format date to readable string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

/**
 * Get time-based greeting
 * @returns {string} Greeting based on time of day
 */
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

/**
 * Get user initials from name
 * @param {string} name - User's full name
 * @returns {string} Initials (max 2 characters)
 */
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Header Component
 * 
 * @param {Object} props
 * @param {string} props.title - Custom title (optional, overrides greeting)
 * @param {number} props.notificationCount - Number of unread notifications
 * @param {Function} props.onNotificationPress - Callback when notification bell is pressed
 * @param {Function} props.onProfilePress - Callback when profile picture is pressed
 * @param {boolean} props.showDate - Whether to show the date (default: true)
 * @param {boolean} props.showProfile - Whether to show profile picture (default: true)
 * @param {boolean} props.showNotifications - Whether to show notification bell (default: true)
 */
const Header = ({
    title,
    notificationCount = 0,
    onNotificationPress,
    onProfilePress,
    showDate = true,
    showProfile = true,
    showNotifications = true,
}) => {
    const { user } = useAuth();

    // Memoize user data calculations
    const userName = useMemo(() => {
        return user?.displayName || user?.email?.split('@')[0] || 'User';
    }, [user?.displayName, user?.email]);

    const userInitials = useMemo(() => getInitials(userName), [userName]);

    // Memoize greeting text
    const greetingText = useMemo(() => {
        return title || `${getGreeting()}, ${userName}!`;
    }, [title, userName]);

    // Memoize current date
    const currentDate = useMemo(() => formatDate(new Date()), []);

    // Memoize notification badge text
    const notificationBadgeText = useMemo(() => {
        return notificationCount > 99 ? '99+' : notificationCount.toString();
    }, [notificationCount]);

    // Memoize accessibility labels
    const notificationLabel = useMemo(() => {
        if (notificationCount === 0) {
            return 'Notifications. No unread notifications';
        }
        return `Notifications. ${notificationCount} unread notification${notificationCount === 1 ? '' : 's'}`;
    }, [notificationCount]);

    const profileLabel = useMemo(() => {
        return `Profile. ${userName}'s profile picture`;
    }, [userName]);

    // Callbacks for button presses
    const handleNotificationPress = useCallback(() => {
        if (onNotificationPress) {
            onNotificationPress();
        }
    }, [onNotificationPress]);

    const handleProfilePress = useCallback(() => {
        if (onProfilePress) {
            onProfilePress();
        }
    }, [onProfilePress]);

    return (
        <View style={styles.container}>
            <View style={styles.headerContent}>
                {/* Left section - Greeting and Date */}
                <View style={styles.leftSection}>
                    <Text 
                        style={styles.greeting}
                        accessibilityRole="header"
                        accessibilityLevel={1}
                    >
                        {greetingText}
                    </Text>
                    {showDate && (
                        <Text 
                            style={styles.date}
                            accessibilityLabel={`Today is ${currentDate}`}
                        >
                            {currentDate}
                        </Text>
                    )}
                </View>

                {/* Right section - Notifications and Profile */}
                <View style={styles.rightSection}>
                    {/* Notification Bell */}
                    {showNotifications && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={handleNotificationPress}
                            activeOpacity={0.7}
                            accessibilityLabel={notificationLabel}
                            accessibilityHint="Double tap to view notifications"
                            accessibilityRole="button"
                            accessibilityState={{ disabled: false }}
                        >
                            <MaterialCommunityIcons
                                name="bell-outline"
                                size={24}
                                color={COLORS.text}
                                accessibilityElementsHidden={true}
                                importantForAccessibility="no-hide-descendants"
                            />
                            {notificationCount > 0 && (
                                <View 
                                    style={styles.notificationBadge}
                                    accessibilityElementsHidden={true}
                                    importantForAccessibility="no-hide-descendants"
                                >
                                    <Text style={styles.notificationBadgeText}>
                                        {notificationBadgeText}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Profile Picture */}
                    {showProfile && (
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={handleProfilePress}
                            activeOpacity={0.7}
                            accessibilityLabel={profileLabel}
                            accessibilityHint="Double tap to view your profile"
                            accessibilityRole="button"
                        >
                            <View style={styles.avatar}>
                                <Text 
                                    style={styles.avatarText}
                                    accessibilityElementsHidden={true}
                                    importantForAccessibility="no-hide-descendants"
                                >
                                    {userInitials}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        paddingTop: Platform.OS === 'ios' ? 0 : 8,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        // Shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flex: 1,
        marginRight: 16,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    notificationBadgeText: {
        color: COLORS.textInverse,
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileButton: {
        marginLeft: 4,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primaryLight,
        // Subtle shadow
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    avatarText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(Header);
