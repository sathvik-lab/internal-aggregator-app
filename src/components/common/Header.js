/**
 * Header Component
 * 
 * Reusable header component for dashboard and other screens.
 * Features user greeting, profile picture, notification bell, and date display.
 */

import React from 'react';
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

    // Get user's display name or email
    const userName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const userInitials = getInitials(userName);

    // Determine greeting text
    const greetingText = title || `${getGreeting()}, ${userName}!`;

    // Current date
    const currentDate = formatDate(new Date());

    return (
        <View style={styles.container}>
            <View style={styles.headerContent}>
                {/* Left section - Greeting and Date */}
                <View style={styles.leftSection}>
                    <Text style={styles.greeting}>{greetingText}</Text>
                    {showDate && <Text style={styles.date}>{currentDate}</Text>}
                </View>

                {/* Right section - Notifications and Profile */}
                <View style={styles.rightSection}>
                    {/* Notification Bell */}
                    {showNotifications && (
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onNotificationPress}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons
                                name="bell-outline"
                                size={24}
                                color={COLORS.text}
                            />
                            {notificationCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {notificationCount > 99 ? '99+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Profile Picture */}
                    {showProfile && (
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={onProfilePress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{userInitials}</Text>
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

export default Header;
