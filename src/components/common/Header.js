/**
 * Header Component
 * 
 * Reusable header component for dashboard and other screens.
 * Features user greeting, profile picture, notification bell, and date display.
 */

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

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
    const { colors } = useTheme();

    // Memoize user data calculations
    const userName = useMemo(() => {
        return user?.displayName || user?.email?.split('@')[0] || 'User';
    }, [user?.displayName, user?.email]);

    const userInitials = useMemo(() => getInitials(userName), [userName]);

    // State to trigger updates on time boundaries
    const [now, setNow] = useState(new Date());

    // Update time at appropriate boundaries (next greeting change or midnight)
    useEffect(() => {
        const updateTime = () => {
            const current = new Date();
            setNow(current);
            
            // Calculate next update time (next hour boundary for greeting, or midnight for date)
            const nextHour = new Date(current);
            nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
            
            const midnight = new Date(current);
            midnight.setHours(24, 0, 0, 0);
            
            const nextUpdate = Math.min(nextHour.getTime(), midnight.getTime());
            const delay = nextUpdate - current.getTime();
            
            const timeoutId = setTimeout(updateTime, delay);
            return () => clearTimeout(timeoutId);
        };

        const timeoutId = setTimeout(updateTime, 60000); // Check every minute
        return () => clearTimeout(timeoutId);
    }, []);

    // Memoize greeting text with now dependency
    const greetingText = useMemo(() => {
        return title || `${getGreeting()}, ${userName}!`;
    }, [title, userName, now]);

    // Memoize current date with now dependency
    const currentDate = useMemo(() => formatDate(now), [now]);

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
        <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
                {/* Left section - Greeting and Date */}
                <View style={styles.leftSection}>
                    <Text 
                        style={[styles.greeting, { color: colors.text }]}
                        accessibilityRole="header"
                        accessibilityLevel={1}
                    >
                        {greetingText}
                    </Text>
                    {showDate && (
                        <Text 
                            style={[styles.date, { color: colors.textSecondary }]}
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
                            style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary }]}
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
                                color={colors.text}
                                accessibilityElementsHidden={true}
                                importantForAccessibility="no-hide-descendants"
                            />
                            {notificationCount > 0 && (
                                <View 
                                    style={[styles.notificationBadge, { backgroundColor: colors.error, borderColor: colors.surface }]}
                                    accessibilityElementsHidden={true}
                                    importantForAccessibility="no-hide-descendants"
                                >
                                    <Text style={[styles.notificationBadgeText, { color: colors.textInverse }]}>
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
                            <View style={[styles.avatar, { backgroundColor: colors.primary, borderColor: colors.primaryLight }]}>
                                <Text 
                                    style={[styles.avatarText, { color: colors.textInverse }]}
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
        paddingTop: Platform.OS === 'ios' ? 0 : 8,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
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
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    notificationBadgeText: {
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
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        // Subtle shadow
        ...Platform.select({
            ios: {
                shadowColor: '#000',
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
        fontSize: 16,
        fontWeight: 'bold',
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(Header);
