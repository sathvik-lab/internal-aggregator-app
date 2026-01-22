/**
 * Profile Screen
 * 
 * User profile screen showing account information, settings, and preferences.
 * Includes Firebase integration for user data, preferences, and storage calculation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Switch, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';
import { getDocument, queryDocuments, updateDocument } from '../services/firestore';
import { updateUserProfile } from '../services/auth';
import EditProfileModal from '../components/profile/EditProfileModal';

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

/**
 * Settings Row Component
 */
const SettingsRow = ({
    icon,
    title,
    subtitle,
    value,
    onPress,
    rightComponent,
    showChevron = true,
    iconColor = COLORS.textSecondary,
}) => {
    return (
        <TouchableOpacity
            style={styles.settingsRow}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View style={styles.settingsRowLeft}>
                {icon && (
                    <View style={[styles.settingsIconContainer, { backgroundColor: `${iconColor}15` }]}>
                        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
                    </View>
                )}
                <View style={styles.settingsRowContent}>
                    <Text style={styles.settingsRowTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingsRowSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.settingsRowRight}>
                {value && <Text style={styles.settingsRowValue}>{value}</Text>}
                {rightComponent}
                {showChevron && onPress && (
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={COLORS.textLight}
                        style={styles.chevron}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

/**
 * Settings Section Component
 */
const SettingsSection = ({ title, children }) => {
    return (
        <View style={styles.settingsSection}>
            {title && <Text style={styles.settingsSectionTitle}>{title}</Text>}
            <View style={styles.settingsSectionContent}>{children}</View>
        </View>
    );
};

/**
 * Profile Screen Component
 */
const ProfileScreen = () => {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        checklistReminders: true,
        reminderTime: '09:00',
        checklistFrequency: 'daily',
    });
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageLoading, setStorageLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    /**
     * Fetch user preferences from Firestore
     */
    const fetchUserPreferences = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        try {
            // Real Firestore:
            // const userDoc = await getDocument('users', user.uid);
            // const preferences = userDoc?.preferences || {};

            const result = await getDocument('users', user.uid);
            if (result.data && result.data.preferences) {
                setUserPreferences((prev) => ({
                    ...prev,
                    ...result.data.preferences,
                }));
            }
        } catch (error) {
            console.error('Error fetching user preferences:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Calculate storage used from documents
     */
    const calculateStorageUsed = useCallback(async () => {
        if (!user?.uid) {
            setStorageLoading(false);
            return;
        }

        try {
            // Real Firestore:
            // const docsQuery = query(
            //   collection(db, 'documents'),
            //   where('userId', '==', user.uid)
            // );
            // const docs = await getDocs(docsQuery);
            // const totalSize = docs.docs.reduce((sum, doc) => sum + (doc.data().size || 0), 0);

            const conditions = [{ field: 'userId', operator: '==', value: user.uid }];
            const result = await queryDocuments('documents', conditions);

            if (result.data) {
                const totalSize = result.data.reduce((sum, doc) => sum + (doc.size || 0), 0);
                setStorageUsed(totalSize);
            }
        } catch (error) {
            console.error('Error calculating storage:', error);
        } finally {
            setStorageLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserPreferences();
        calculateStorageUsed();
    }, [user, fetchUserPreferences, calculateStorageUsed]);

    /**
     * Handle edit profile
     */
    const handleEditProfile = () => {
        setShowEditModal(true);
    };

    /**
     * Handle edit modal close
     */
    const handleEditModalClose = () => {
        setShowEditModal(false);
    };

    /**
     * Handle successful profile update
     */
    const handleProfileUpdated = () => {
        // Refresh user preferences and storage
        fetchUserPreferences();
        calculateStorageUsed();
    };

    /**
     * Handle account settings navigation
     */
    const handleAccountSettings = (type) => {
        Alert.alert(
            type === 'name' ? 'Edit Name' : type === 'email' ? 'Change Email' : 'Change Password',
            `${type === 'name' ? 'Name' : type === 'email' ? 'Email' : 'Password'} editing will be implemented in a future update.`,
            [{ text: 'OK' }]
        );
    };

    /**
     * Handle notification toggle
     */
    const handleNotificationToggle = async (key) => {
        if (!user?.uid) {
            Alert.alert('Error', 'You must be signed in to update preferences.');
            return;
        }

        // Optimistically update UI
        const previousPreferences = { ...userPreferences };
        const newValue = !userPreferences[key];
        const updatedPreferences = { ...userPreferences, [key]: newValue };

        setUserPreferences(updatedPreferences);

        try {
            // Real Firestore:
            // await updateDocument('users', user.uid, {
            //   preferences: updatedPreferences,
            // });

            const result = await updateDocument('users', user.uid, {
                preferences: updatedPreferences,
            });

            if (result.error) {
                // Revert on error
                setUserPreferences(previousPreferences);
                Alert.alert('Error', 'Failed to update notification preferences.');
            }
        } catch (error) {
            // Revert on error
            setUserPreferences(previousPreferences);
            Alert.alert('Error', 'Failed to update notification preferences.');
        }
    };

    /**
     * Handle checklist settings navigation
     */
    const handleChecklistSettings = () => {
        Alert.alert(
            'Checklist Settings',
            'Checklist reminder settings will be implemented in a future update.',
            [{ text: 'OK' }]
        );
    };

    /**
     * Handle app information navigation
     */
    const handleAppInfo = (type) => {
        const messages = {
            about: 'Internal Aggregator App\nVersion 1.0.0\n\nA compliance document management system for businesses.',
            privacy: 'Privacy Policy\n\nYour privacy is important to us. This app stores your data securely using Firebase. We do not share your information with third parties.',
            terms: 'Terms of Service\n\nBy using this app, you agree to comply with all applicable laws and regulations. Use of this app is at your own risk.',
        };

        Alert.alert(type === 'about' ? 'About' : type === 'privacy' ? 'Privacy Policy' : 'Terms of Service', messages[type], [
            { text: 'OK' },
        ]);
    };

    /**
     * Handle sign out
     */
    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ],
        );
    };

    /**
     * Get user initials for avatar
     */
    const getUserInitials = () => {
        if (user?.displayName) {
            const names = user.displayName.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            }
            return user.displayName.substring(0, 2).toUpperCase();
        }
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.profileHeader}>
                    {/* Profile Picture */}
                    <TouchableOpacity
                        style={styles.profilePictureContainer}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                    >
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.profilePicture} />
                        ) : (
                            <View style={styles.profilePicturePlaceholder}>
                                <Text style={styles.profilePictureText}>{getUserInitials()}</Text>
                            </View>
                        )}
                        <View style={styles.editProfileBadge}>
                            <MaterialCommunityIcons name="camera" size={16} color={COLORS.textInverse} />
                        </View>
                    </TouchableOpacity>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
                        <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Account Settings Section */}
            <SettingsSection title="Account Settings">
                <SettingsRow
                    icon="account-outline"
                    title="Name"
                    subtitle={user?.displayName || 'Not set'}
                    onPress={() => handleAccountSettings('name')}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="email-outline"
                    title="Email"
                    subtitle={user?.email || 'Not set'}
                    onPress={() => handleAccountSettings('email')}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="lock-outline"
                    title="Password"
                    subtitle="Change your password"
                    onPress={() => handleAccountSettings('password')}
                />
            </SettingsSection>

            {/* Notification Preferences Section */}
            <SettingsSection title="Notification Preferences">
                <SettingsRow
                    icon="email-outline"
                    title="Email Notifications"
                    subtitle="Receive notifications via email"
                    rightComponent={
                        <Switch
                            value={userPreferences.emailNotifications}
                            onValueChange={() => handleNotificationToggle('emailNotifications')}
                            color={COLORS.primary}
                        />
                    }
                    showChevron={false}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="bell-outline"
                    title="Push Notifications"
                    subtitle="Receive push notifications"
                    rightComponent={
                        <Switch
                            value={userPreferences.pushNotifications}
                            onValueChange={() => handleNotificationToggle('pushNotifications')}
                            color={COLORS.primary}
                        />
                    }
                    showChevron={false}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="bell-ring-outline"
                    title="Checklist Reminders"
                    subtitle="Get reminders for pending checklists"
                    rightComponent={
                        <Switch
                            value={userPreferences.checklistReminders}
                            onValueChange={() => handleNotificationToggle('checklistReminders')}
                            color={COLORS.primary}
                        />
                    }
                    showChevron={false}
                />
            </SettingsSection>

            {/* Document Storage Section */}
            <SettingsSection title="Document Storage">
                <SettingsRow
                    icon="database-outline"
                    title="Storage Used"
                    subtitle="Total space used by your documents"
                    value={storageLoading ? 'Calculating...' : formatFileSize(storageUsed)}
                    showChevron={false}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="cloud-outline"
                    title="Storage Limit"
                    subtitle="Maximum storage capacity"
                    value="10 GB"
                    showChevron={false}
                />
            </SettingsSection>

            {/* Checklist Settings Section */}
            <SettingsSection title="Checklist Settings">
                <SettingsRow
                    icon="clock-outline"
                    title="Reminder Time"
                    subtitle={`Daily reminders at ${userPreferences.reminderTime}`}
                    onPress={handleChecklistSettings}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="calendar-clock"
                    title="Default Frequency"
                    subtitle={`Default checklist frequency: ${userPreferences.checklistFrequency}`}
                    onPress={handleChecklistSettings}
                />
            </SettingsSection>

            {/* App Information Section */}
            <SettingsSection title="App Information">
                <SettingsRow
                    icon="information-outline"
                    title="About"
                    onPress={() => handleAppInfo('about')}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="shield-check-outline"
                    title="Privacy Policy"
                    onPress={() => handleAppInfo('privacy')}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="file-document-outline"
                    title="Terms of Service"
                    onPress={() => handleAppInfo('terms')}
                />
                <Divider style={styles.divider} />
                <SettingsRow
                    icon="tag-outline"
                    title="App Version"
                    subtitle="1.0.0"
                    showChevron={false}
                />
            </SettingsSection>

            {/* Logout Button */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleSignOut}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Edit Profile Modal */}
        <EditProfileModal
            visible={showEditModal}
            onClose={handleEditModalClose}
            onSuccess={handleProfileUpdated}
        />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.surface,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    profileHeader: {
        alignItems: 'center',
    },
    profilePictureContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.backgroundSecondary,
    },
    profilePicturePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePictureText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.textInverse,
    },
    editProfileBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.surface,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 6,
    },
    settingsSection: {
        marginTop: 24,
    },
    settingsSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        paddingHorizontal: 20,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    settingsSectionContent: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        minHeight: 56,
    },
    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingsIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingsRowContent: {
        flex: 1,
    },
    settingsRowTitle: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    settingsRowSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    settingsRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsRowValue: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginRight: 8,
    },
    chevron: {
        marginLeft: 8,
    },
    divider: {
        marginLeft: 68, // Align with content (icon + margin)
        backgroundColor: COLORS.border,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.error,
        marginLeft: 8,
    },
    bottomSpacing: {
        height: 40,
    },
});

export default ProfileScreen;
