/**
 * Profile Screen
 * 
 * User profile screen showing account information, settings, and preferences.
 * Includes Firebase integration for user data, preferences, and storage calculation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { useTheme, THEME_MODES } from '../context/ThemeContext';
import { getDocument, queryDocuments, updateDocument } from '../services/firestore';
import EditProfileModal from '../components/profile/EditProfileModal';
import BusinessProfileModal from '../components/profile/BusinessProfileModal';
import { clearTemplateCache, syncTemplates } from '../services/checklistTemplateSync';
import { syncInstances } from '../services/checklistInstanceSync';
import { updateBusinessVisibilitySettings, updateUserVisibilitySettings } from '../services/userProfile';
import {
    TRUCK_TYPE_LABELS,
    FOOD_TYPE_LABELS,
} from '../constants/checklistConstants';
import { ROUTES } from '../navigation/navigationConfig';
import { useEffectiveRole } from '../hooks/useEffectiveRole';

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
    iconColor,
    colors,
}) => {
    const defaultIconColor = iconColor || colors?.textSecondary || '#4A5568';
    return (
        <TouchableOpacity
            style={styles.settingsRow}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
            accessibilityRole={onPress ? 'button' : 'text'}
            accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
            accessibilityState={{ disabled: !onPress }}
        >
            <View style={styles.settingsRowLeft}>
                {icon && (
                    <View
                        style={[styles.settingsIconContainer, { backgroundColor: `${defaultIconColor}15` }]}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        <MaterialCommunityIcons name={icon} size={20} color={defaultIconColor} />
                    </View>
                )}
                <View style={styles.settingsRowContent}>
                    <Text style={[styles.settingsRowTitle, { color: colors?.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.settingsRowSubtitle, { color: colors?.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.settingsRowRight}>
                {value && <Text style={[styles.settingsRowValue, { color: colors?.textSecondary }]}>{value}</Text>}
                {rightComponent}
                {showChevron && onPress && (
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={colors?.textSecondary}
                        style={styles.chevron}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

/**
 * Settings Section Component
 */
const SettingsSection = ({ title, children, colors }) => {
    return (
        <View style={styles.settingsSection}>
            {title ? (
                <Text
                    style={[styles.settingsSectionTitle, { color: colors?.textSecondary }]}
                    accessibilityRole="header"
                    accessibilityLevel={2}
                >
                    {title}
                </Text>
            ) : null}
            <View style={[styles.settingsSectionContent, { backgroundColor: colors?.surface, borderColor: colors?.border }]}>{children}</View>
        </View>
    );
};

/**
 * Profile Screen Component
 */
const ProfileScreen = () => {
    const { user, signOut } = useAuth();
    const { isOwner, isStaff } = useEffectiveRole();
    const navigation = useNavigation();
    const { colors, theme, setTheme } = useTheme();
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
    const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
    const [businessProfile, setBusinessProfile] = useState(null);
    const [businessId, setBusinessId] = useState(null);
    const [visibilitySettings, setVisibilitySettings] = useState({
        userPublicProfileEnabled: false,
        userPublicScoreEnabled: false,
        businessPublicProfileEnabled: false,
        businessPublicScoreEnabled: false,
    });

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

    /**
     * Fetch business profile from Firestore
     */
    const fetchBusinessProfile = useCallback(async () => {
        if (!user?.uid) {
            return;
        }

        try {
            const result = await getDocument('users', user.uid);
            if (result.data) {
                setBusinessProfile(result.data.businessProfile || null);
                setBusinessId(result.data.defaultBusinessId || null);
                setVisibilitySettings((prev) => ({
                    ...prev,
                    userPublicProfileEnabled: Boolean(result.data.publicProfileEnabled),
                    userPublicScoreEnabled: Boolean(result.data.publicScoreEnabled),
                }));
                if (result.data.defaultBusinessId) {
                    const businessResult = await getDocument('businesses', result.data.defaultBusinessId);
                    if (businessResult.data) {
                        setVisibilitySettings((prev) => ({
                            ...prev,
                            businessPublicProfileEnabled: Boolean(businessResult.data.publicProfileEnabled),
                            businessPublicScoreEnabled: Boolean(businessResult.data.publicScoreEnabled),
                        }));
                    }
                }
            } else {
                setBusinessProfile(null);
                setBusinessId(null);
            }
        } catch (error) {
            console.error('Error fetching business profile:', error);
        }
    }, [user]);

    const handleVisibilityToggle = async (target, key) => {
        const stateKey = `${target}${key}`; // userPublicProfileEnabled / businessPublicScoreEnabled
        const previous = visibilitySettings[stateKey];
        const next = !previous;

        setVisibilitySettings((prev) => ({ ...prev, [stateKey]: next }));

        let result;
        if (target === 'user') {
            result = await updateUserVisibilitySettings(user?.uid, {
                ...(key === 'PublicProfileEnabled' ? { publicProfileEnabled: next } : {}),
                ...(key === 'PublicScoreEnabled' ? { publicScoreEnabled: next } : {}),
            });
        } else if (target === 'business') {
            result = await updateBusinessVisibilitySettings(businessId, {
                ...(key === 'PublicProfileEnabled' ? { publicProfileEnabled: next } : {}),
                ...(key === 'PublicScoreEnabled' ? { publicScoreEnabled: next } : {}),
            });
        }

        if (result?.error) {
            setVisibilitySettings((prev) => ({ ...prev, [stateKey]: previous }));
            Alert.alert('Update failed', 'Could not save visibility preference. Please try again.');
        }
    };

    useEffect(() => {
        fetchUserPreferences();
        calculateStorageUsed();
        fetchBusinessProfile();
    }, [user, fetchUserPreferences, calculateStorageUsed, fetchBusinessProfile]);

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
        fetchBusinessProfile();
    };

    /**
     * Handle business profile edit
     */
    const handleEditBusinessProfile = () => {
        setShowBusinessProfileModal(true);
    };

    /**
     * Handle business profile modal close
     */
    const handleBusinessProfileModalClose = () => {
        setShowBusinessProfileModal(false);
    };

    /**
     * Handle successful business profile update
     */
    const handleBusinessProfileUpdated = async () => {
        // Clear template cache (profile changed)
        if (user?.uid) {
            try {
                await clearTemplateCache(user.uid);
            } catch (error) {
                console.error('Error clearing template cache:', error);
            }
        }

        // Refresh business profile
        await fetchBusinessProfile();

        // Re-sync templates with new profile
        if (user?.uid) {
            try {
                const result = await syncTemplates(user.uid, true);
                if (!result.error && result.templates) {
                    await syncInstances(user.uid, result.templates);
                }
            } catch (error) {
                console.error('Error syncing templates after profile update:', error);
            }
        }
    };

    /**
     * Format business profile for display
     */
    const formatBusinessProfileDisplay = () => {
        if (!businessProfile) {
            return 'Not set up';
        }

        const parts = [];
        if (businessProfile.truckType) {
            const truckLabel = TRUCK_TYPE_LABELS[businessProfile.truckType] || businessProfile.truckType || 'Unknown';
            parts.push(`Truck: ${truckLabel}`);
        }
        if (businessProfile.location?.state) {
            parts.push(`Location: ${businessProfile.location.state}${businessProfile.location.city ? `, ${businessProfile.location.city}` : ''}`);
        }
        if (businessProfile.foodTypes && businessProfile.foodTypes.length > 0) {
            parts.push(
                `Food: ${businessProfile.foodTypes
                    .map((ft) => FOOD_TYPE_LABELS[ft] || ft || 'Unknown')
                    .join(', ')}`
            );
        }

        return parts.length > 0 ? parts.join(' • ') : 'Incomplete';
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
        } catch (_error) {
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
            about: 'Food Truck Compliance\nVersion 1.0.0\n\nA compliance management system for food truck operators.',
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
     * Handle navigate to Staff screen
     */
    const handleNavigateToStaff = () => {
        if (!isOwner) {
            Alert.alert('Access restricted', 'Team management is available to owners only.');
            return;
        }
        navigation.navigate(ROUTES.PROFILE.STAFF);
    };

    /**
     * Get user role for avatar
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
            <View
                style={[styles.loadingContainer, { backgroundColor: colors.background }]}
                accessible
                accessibilityLabel="Loading profile"
                accessibilityRole="progressbar"
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const backgroundColor = colors.zinc950 || colors.background;

    return (
        <>
        <ScrollView
            style={[styles.container, { backgroundColor }]}
            showsVerticalScrollIndicator={false}
            accessibilityRole="main"
            accessibilityLabel="Profile and settings"
        >
            {/* Header Section */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.profileHeader}>
                    {/* Profile Picture */}
                    <TouchableOpacity
                        style={styles.profilePictureContainer}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Edit profile photo"
                        accessibilityHint="Opens profile editor"
                    >
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.profilePicture} />
                        ) : (
                            <View style={[styles.profilePicturePlaceholder, { backgroundColor: colors.primary }]}>
                                <Text
                                    style={[styles.profilePictureText, { color: colors.textInverse }]}
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                >
                                    {getUserInitials()}
                                </Text>
                            </View>
                        )}
                        <View
                            style={[styles.editProfileBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        >
                            <MaterialCommunityIcons name="camera" size={16} color={colors.textInverse} />
                        </View>
                    </TouchableOpacity>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text
                            style={[styles.userName, { color: colors.text }]}
                            accessibilityRole="header"
                            accessibilityLevel={1}
                        >
                            {user?.displayName || 'User'}
                        </Text>
                        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity
                        style={[styles.editButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                        onPress={handleEditProfile}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Edit profile"
                    >
                        <MaterialCommunityIcons
                            name="pencil"
                            size={20}
                            color={colors.primary}
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                        />
                        <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Account Settings Section */}
            <SettingsSection title="Account Settings" colors={colors}>
                <SettingsRow
                    icon="account-outline"
                    title="Name"
                    subtitle={user?.displayName || 'Not set'}
                    onPress={() => handleAccountSettings('name')}
                    colors={colors}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="email-outline"
                    title="Email"
                    subtitle={user?.email || 'Not set'}
                    onPress={() => handleAccountSettings('email')}
                    colors={colors}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="lock-outline"
                    title="Password"
                    subtitle="Change your password"
                    onPress={() => handleAccountSettings('password')}
                    colors={colors}
                />
            </SettingsSection>

            {/* Appearance Section */}
            <SettingsSection title="Appearance" colors={colors}>
                <SettingsRow
                    icon="theme-light-dark"
                    title="Theme"
                    subtitle={theme === THEME_MODES.SYSTEM ? 'Follow system' : theme === THEME_MODES.DARK ? 'Dark mode' : 'Light mode'}
                    rightComponent={
                        <View style={styles.themeSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.themeOption,
                                    { borderColor: colors.border },
                                    theme === THEME_MODES.LIGHT && [styles.themeOptionActive, { borderColor: colors.primary }]
                                ]}
                                onPress={() => setTheme(THEME_MODES.LIGHT)}
                                activeOpacity={0.7}
                                accessibilityLabel="Light mode"
                                accessibilityRole="button"
                                accessibilityState={{ selected: theme === THEME_MODES.LIGHT }}
                            >
                                <MaterialCommunityIcons
                                    name="weather-sunny"
                                    size={18}
                                    color={theme === THEME_MODES.LIGHT ? colors.primary : colors.textSecondary}
                                    accessibilityElementsHidden={true}
                                    importantForAccessibility="no-hide-descendants"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.themeOption,
                                    { borderColor: colors.border },
                                    theme === THEME_MODES.SYSTEM && [styles.themeOptionActive, { borderColor: colors.primary }]
                                ]}
                                onPress={() => setTheme(THEME_MODES.SYSTEM)}
                                activeOpacity={0.7}
                                accessibilityLabel="System theme"
                                accessibilityRole="button"
                                accessibilityState={{ selected: theme === THEME_MODES.SYSTEM }}
                            >
                                <MaterialCommunityIcons
                                    name="cellphone-settings"
                                    size={18}
                                    color={theme === THEME_MODES.SYSTEM ? colors.primary : colors.textSecondary}
                                    accessibilityElementsHidden={true}
                                    importantForAccessibility="no-hide-descendants"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.themeOption,
                                    { borderColor: colors.border },
                                    theme === THEME_MODES.DARK && [styles.themeOptionActive, { borderColor: colors.primary }]
                                ]}
                                onPress={() => setTheme(THEME_MODES.DARK)}
                                activeOpacity={0.7}
                                accessibilityLabel="Dark mode"
                                accessibilityRole="button"
                                accessibilityState={{ selected: theme === THEME_MODES.DARK }}
                            >
                                <MaterialCommunityIcons
                                    name="weather-night"
                                    size={18}
                                    color={theme === THEME_MODES.DARK ? colors.primary : colors.textSecondary}
                                    accessibilityElementsHidden={true}
                                    importantForAccessibility="no-hide-descendants"
                                />
                            </TouchableOpacity>
                        </View>
                    }
                    colors={colors}
                    showChevron={false}
                />
            </SettingsSection>

            {/* Notification Preferences Section */}
            <SettingsSection title="Notification Preferences" colors={colors}>
                <SettingsRow
                    icon="email-outline"
                    title="Email Notifications"
                    subtitle="Receive notifications via email"
                    rightComponent={
                        <Switch
                            value={userPreferences.emailNotifications}
                            onValueChange={() => handleNotificationToggle('emailNotifications')}
                            color={colors.primary}
                        />
                    }
                    colors={colors}
                    showChevron={false}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="bell-outline"
                    title="Push Notifications"
                    subtitle="Receive push notifications"
                    rightComponent={
                        <Switch
                            value={userPreferences.pushNotifications}
                            onValueChange={() => handleNotificationToggle('pushNotifications')}
                            color={colors.primary}
                        />
                    }
                    colors={colors}
                    showChevron={false}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="bell-ring-outline"
                    title="Checklist Reminders"
                    subtitle="Get reminders for pending checklists"
                    rightComponent={
                        <Switch
                            value={userPreferences.checklistReminders}
                            onValueChange={() => handleNotificationToggle('checklistReminders')}
                            color={colors.primary}
                        />
                    }
                    colors={colors}
                    showChevron={false}
                />
            </SettingsSection>

            {/* Document Storage Section */}
            <SettingsSection title="Document Storage" colors={colors}>
                <SettingsRow
                    icon="database-outline"
                    title="Storage Used"
                    subtitle="Total space used by your documents"
                    value={storageLoading ? 'Calculating...' : formatFileSize(storageUsed)}
                    colors={colors}
                    showChevron={false}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="cloud-outline"
                    title="Storage Limit"
                    subtitle="Maximum storage capacity"
                    value="10 GB"
                    colors={colors}
                    showChevron={false}
                />
            </SettingsSection>

            {/* Business Profile Section */}
            {isOwner && (
                <SettingsSection title="Business Profile" colors={colors}>
                    <SettingsRow
                        icon="truck-outline"
                        title="Business Profile"
                        subtitle={formatBusinessProfileDisplay()}
                        value={businessProfile?.lastTemplateSync ? `Last synced: ${new Date(businessProfile.lastTemplateSync).toLocaleDateString()}` : null}
                        onPress={handleEditBusinessProfile}
                        colors={colors}
                    />
                    <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                    <SettingsRow
                        icon="information-outline"
                        title="About Business Profile"
                        subtitle="Customize your checklist templates based on your business type, location, and food types"
                        colors={colors}
                        showChevron={false}
                    />
                </SettingsSection>
            )}

            <SettingsSection title="Public Visibility (Consent)" colors={colors}>
                {isStaff ? (
                    <Text style={[styles.roleHint, { color: colors.textSecondary }]}>
                        Team accounts adjust personal consent on your user profile. Business-wide visibility is controlled by the owner.
                    </Text>
                ) : null}
                <SettingsRow
                    icon="shield-account-outline"
                    title="Public Profile Preview"
                    subtitle="Allow future public endpoints to show your profile summary. This can expose business name, truck type, and location context."
                    rightComponent={
                        <Switch
                            value={isOwner ? visibilitySettings.businessPublicProfileEnabled : visibilitySettings.userPublicProfileEnabled}
                            onValueChange={() => handleVisibilityToggle(isOwner && businessId ? 'business' : 'user', 'PublicProfileEnabled')}
                            color={colors.primary}
                        />
                    }
                    colors={colors}
                    showChevron={false}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="chart-line"
                    title="Public Score Preview"
                    subtitle="Allow future public endpoints to show your readiness score. Turn off to keep score private."
                    rightComponent={
                        <Switch
                            value={isOwner ? visibilitySettings.businessPublicScoreEnabled : visibilitySettings.userPublicScoreEnabled}
                            onValueChange={() => handleVisibilityToggle(isOwner && businessId ? 'business' : 'user', 'PublicScoreEnabled')}
                            color={colors.primary}
                        />
                    }
                    colors={colors}
                    showChevron={false}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="information-outline"
                    title="Consent impact"
                    subtitle="Defaults are private. These flags do not create public reads today; they are consent signals for future public API rollout."
                    colors={colors}
                    showChevron={false}
                />
            </SettingsSection>

            {/* Team Management Section (Owner Only) */}
            {isOwner && (
                <SettingsSection title="Team Management" colors={colors}>
                    <SettingsRow
                        icon="account-multiple-outline"
                        title="Staff Management"
                        subtitle="Invite and manage team members"
                        onPress={handleNavigateToStaff}
                        colors={colors}
                    />
                </SettingsSection>
            )}

            {/* Checklist Settings Section */}
            <SettingsSection title="Checklist Settings" colors={colors}>
                <SettingsRow
                    icon="clock-outline"
                    title="Reminder Time"
                    subtitle={`Daily reminders at ${userPreferences.reminderTime}`}
                    onPress={handleChecklistSettings}
                    colors={colors}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="calendar-clock"
                    title="Default Frequency"
                    subtitle={`Default checklist frequency: ${userPreferences.checklistFrequency}`}
                    onPress={handleChecklistSettings}
                    colors={colors}
                />
            </SettingsSection>

            {/* App Information Section */}
            <SettingsSection title="App Information" colors={colors}>
                <SettingsRow
                    icon="information-outline"
                    title="About"
                    onPress={() => handleAppInfo('about')}
                    colors={colors}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="shield-check-outline"
                    title="Privacy Policy"
                    onPress={() => handleAppInfo('privacy')}
                    colors={colors}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="file-document-outline"
                    title="Terms of Service"
                    onPress={() => handleAppInfo('terms')}
                    colors={colors}
                />
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
                <SettingsRow
                    icon="tag-outline"
                    title="App Version"
                    subtitle="1.0.0"
                    colors={colors}
                    showChevron={false}
                />
            </SettingsSection>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.error }]}
                onPress={handleSignOut}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                accessibilityHint="Signs out of your account"
            >
                <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
                <Text style={[styles.logoutButtonText, { color: colors.error }]}>Sign Out</Text>
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

        {/* Business Profile Modal */}
        <BusinessProfileModal
            visible={showBusinessProfileModal}
            onClose={handleBusinessProfileModalClose}
            onSuccess={handleBusinessProfileUpdated}
        />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
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
    },
    profilePicturePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePictureText: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    editProfileBadge: {
        position: 'absolute',
        bottom: Number(0),
        right: Number(0),
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: Number(0), height: Number(2) },
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
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    settingsSection: {
        marginTop: 24,
    },
    settingsSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        paddingHorizontal: 20,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    roleHint: {
        fontSize: 13,
        lineHeight: 18,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    settingsSectionContent: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    themeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    themeOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    themeOptionActive: {
        borderWidth: 2,
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
        fontWeight: '500',
    },
    settingsRowSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    settingsRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsRowValue: {
        fontSize: 14,
        marginRight: 8,
    },
    chevron: {
        marginLeft: 8,
    },
    divider: {
        marginLeft: 68, // Align with content (icon + margin)
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    bottomSpacing: {
        height: 40,
    },
});

export default ProfileScreen;
