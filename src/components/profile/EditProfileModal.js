/**
 * EditProfileModal Component
 * 
 * Modal for editing user profile information.
 * Includes profile picture upload, name, email, phone, company, and job title editing.
 * Integrates with Firebase Auth and Firestore.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TextInput, Button, Portal } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';
import { uploadFile } from '../../services/storage';
import { updateDocument, getDocument } from '../../services/firestore';
import { updateUserProfile } from '../../services/auth';
import { STORAGE_PATHS } from '../../constants/constants';

/**
 * EditProfileModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSuccess - Callback when profile is successfully updated
 */
const EditProfileModal = ({ visible, onClose, onSuccess }) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const useGlass = colors.glassBackground != null;
    const glassColors = colors.glassBackground
        ? {
            background: colors.glassBackground,
            border: colors.glassBorder,
        }
        : GLASS;

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [jobTitle, setJobTitle] = useState('');

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePictureChanged, setProfilePictureChanged] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // UI state
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nameError, setNameError] = useState('');
    const isMounted = useRef(true);
    const initialDataRef = useRef({
        displayName: '',
        phoneNumber: '',
        company: '',
        jobTitle: ''
    });

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    /**
     * Initialize form with user data and fetch extended profile from Firestore
     */
    useEffect(() => {
        if (user && visible) {
            const initialDisplayName = user.displayName || '';
            setDisplayName(initialDisplayName);
            setEmail(user.email || '');
            setProfilePicture(user.photoURL ? { uri: user.photoURL } : null);
            setProfilePictureChanged(false);
            setNameError('');

            // Set initial state from Auth
            initialDataRef.current = {
                displayName: initialDisplayName,
                phoneNumber: '',
                company: '',
                jobTitle: ''
            };

            // Fetch full user document to get phoneNumber, company, and jobTitle
            const fetchExtendedProfile = async () => {
                setLoading(true);
                try {
                    const result = await getDocument('users', user.uid);
                    if (isMounted.current && result.data) {
                        const profile = result.data;
                        const pNumber = profile.phoneNumber || '';
                        const comp = profile.company || '';
                        const title = profile.jobTitle || '';

                        setPhoneNumber(pNumber);
                        setCompany(comp);
                        setJobTitle(title);

                        // Update initial data ref with Firestore values
                        initialDataRef.current = {
                            displayName: initialDisplayName,
                            phoneNumber: pNumber,
                            company: comp,
                            jobTitle: title
                        };
                    }
                } catch (error) {
                    console.error('Error fetching extended profile:', error);
                } finally {
                    if (isMounted.current) setLoading(false);
                }
            };

            fetchExtendedProfile();
        }
    }, [user, visible]);

    /**
     * Get user initials for avatar
     */
    const getUserInitials = () => {
        if (displayName) {
            const names = displayName.split(' ');
            if (names.length >= 2) {
                return `${names[0][0]}${names[1][0]}`.toUpperCase();
            }
            return displayName.substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    /**
     * Request permissions for camera and media library
     */
    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'Camera and media library permissions are required to change your profile picture.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    /**
     * Handle profile picture selection
     */
    const handleSelectProfilePicture = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        Alert.alert(
            'Select Profile Picture',
            'Choose an option',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        try {
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: 'images',
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 0.7, // Compress image to 70% quality
                            });

                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                const asset = result.assets[0];
                                setProfilePicture({ uri: asset.uri });
                                setProfilePictureChanged(true);
                            }
                        } catch (error) {
                            console.error('Error taking photo:', error);
                            Alert.alert('Error', 'Failed to take photo. Please try again.');
                        }
                    },
                },
                {
                    text: 'Choose from Gallery',
                    onPress: async () => {
                        try {
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: 'images',
                                allowsEditing: true,
                                aspect: [1, 1],
                                quality: 0.7, // Compress image to 70% quality
                            });

                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                const asset = result.assets[0];
                                setProfilePicture({ uri: asset.uri });
                                setProfilePictureChanged(true);
                            }
                        } catch (error) {
                            console.error('Error choosing image:', error);
                            Alert.alert('Error', 'Failed to choose image. Please try again.');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    /**
     * Validate form
     */
    const validateForm = () => {
        let isValid = true;

        // Validate display name
        if (!displayName.trim()) {
            setNameError('Name is required');
            isValid = false;
        } else if (displayName.trim().length < 2) {
            setNameError('Name must be at least 2 characters');
            isValid = false;
        } else {
            setNameError('');
        }

        return isValid;
    };

    /**
     * Upload profile picture to Firebase Storage
     */
    const uploadProfilePicture = async () => {
        if (!profilePictureChanged || !profilePicture || !user?.uid) {
            return null;
        }

        setUploadingPhoto(true);

        try {
            // Get file info from URI
            const fileExtension = profilePicture.uri.split('.').pop() || 'jpg';
            const fileName = `avatar_${Date.now()}.${fileExtension}`;
            const storagePath = `${STORAGE_PATHS.PROFILES}/${user.uid}/${fileName}`;

            // Try to get file size from response
            let fileSize = 0;
            try {
                const response = await fetch(profilePicture.uri);
                const blob = await response.blob();
                fileSize = blob.size || 0;
            } catch (error) {
                console.warn('Could not determine file size:', error);
                // Use default size estimate (will be validated by uploadFile)
                fileSize = 1024 * 1024; // 1MB estimate
            }

            const file = {
                uri: profilePicture.uri,
                name: fileName,
                type: 'image/jpeg',
                size: fileSize,
            };

            // Upload to Firebase Storage
            const uploadResult = await uploadFile(file, storagePath);

            if (uploadResult.error) {
                throw new Error(uploadResult.error.message || 'Failed to upload profile picture');
            }

            return uploadResult.url;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            throw error;
        } finally {
            setUploadingPhoto(false);
        }
    };

    /**
     * Handle save
     */
    const handleSave = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'You must be signed in to update your profile.');
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            let photoURL = user.photoURL || null;

            // Upload profile picture if changed
            if (profilePictureChanged) {
                try {
                    photoURL = await uploadProfilePicture();
                } catch (error) {
                    Alert.alert(
                        'Upload Error',
                        'Failed to upload profile picture. Do you want to continue without updating the picture?',
                        [
                            { text: 'Cancel', style: 'cancel', onPress: () => setSaving(false) },
                            {
                                text: 'Continue',
                                onPress: async () => {
                                    // Continue without photo update
                                    await saveProfileData(null);
                                },
                            },
                        ]
                    );
                    return;
                }
            }

            await saveProfileData(photoURL);
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Save profile data to Firebase Auth and Firestore
     */
    const saveProfileData = async (photoURL) => {
        try {
            // Update Firebase Auth profile (displayName and photoURL)
            const updatedDisplayName = displayName.trim();
            const authUpdateResult = await updateUserProfile(updatedDisplayName, photoURL);

            if (authUpdateResult.error) {
                throw new Error(authUpdateResult.error.message || 'Failed to update profile');
            }

            // Update Firestore user document
            // Security Hardening: Explicitly exclude 'role' field from update to prevent privilege escalation
            const firestoreUpdateData = {
                displayName: updatedDisplayName,
                phoneNumber: phoneNumber.trim() || null,
                company: company.trim() || null,
                jobTitle: jobTitle.trim() || null,
                updatedAt: new Date().toISOString(),
            };

            if (photoURL) {
                firestoreUpdateData.photoURL = photoURL;
            }

            const firestoreResult = await updateDocument('users', user.uid, firestoreUpdateData);

            if (firestoreResult.error) {
                // Auth update succeeded but Firestore failed - log but don't block user
                console.error('Firestore update error:', firestoreResult.error);
                Alert.alert(
                    'Partial Update',
                    'Your profile was updated, but some information may not have been saved. Please try again later.',
                    [{ text: 'OK' }]
                );
            }

            // Success
            Alert.alert('Success', 'Profile updated successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (onSuccess) onSuccess();
                        onClose();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error saving profile data:', error);
            throw error;
        }
    };

    /**
     * Handle cancel
     */
    const handleCancel = () => {
        const hasChanges =
            displayName !== initialDataRef.current.displayName ||
            phoneNumber !== initialDataRef.current.phoneNumber ||
            company !== initialDataRef.current.company ||
            jobTitle !== initialDataRef.current.jobTitle ||
            profilePictureChanged;

        if (hasChanges) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved changes. Are you sure you want to close?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            onClose();
                        },
                    },
                ]
            );
        } else {
            onClose();
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onRequestClose={handleCancel}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    {useGlass && Platform.OS === 'ios' && (
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    )}
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: useGlass && Platform.OS === 'android' ? glassColors.background : COLORS.surface,
                                borderColor: useGlass ? glassColors.border : COLORS.border,
                                borderWidth: useGlass ? 1 : 0,
                            },
                        ]}
                    >
                        {useGlass && Platform.OS === 'ios' && (
                            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                        )}
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Loading profile data...</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                                {/* Profile Picture */}
                                <View style={styles.profilePictureSection}>
                                    <TouchableOpacity
                                        style={styles.profilePictureContainer}
                                        onPress={handleSelectProfilePicture}
                                        activeOpacity={0.7}
                                        disabled={uploadingPhoto}
                                    >
                                        {profilePicture ? (
                                            <Image source={profilePicture} style={styles.profilePicture} />
                                        ) : (
                                            <View style={styles.profilePicturePlaceholder}>
                                                <Text style={styles.profilePictureText}>
                                                    {getUserInitials()}
                                                </Text>
                                            </View>
                                        )}
                                        {uploadingPhoto ? (
                                            <View style={styles.uploadingOverlay}>
                                                <ActivityIndicator size="small" color={COLORS.textInverse} />
                                            </View>
                                        ) : (
                                            <View style={styles.editPictureBadge}>
                                                <MaterialCommunityIcons
                                                    name="camera"
                                                    size={16}
                                                    color={COLORS.textInverse}
                                                />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <Text style={styles.profilePictureHint}>
                                        Tap to change profile picture
                                    </Text>
                                </View>

                                {/* Display Name */}
                                <TextInput
                                    label="Full Name *"
                                    value={displayName}
                                    onChangeText={(text) => {
                                        setDisplayName(text);
                                        if (nameError) validateForm();
                                    }}
                                    onBlur={validateForm}
                                    error={!!nameError}
                                    mode="outlined"
                                    style={styles.input}
                                    autoCapitalize="words"
                                />
                                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                                {/* Email (Read-only) */}
                                <TextInput
                                    label="Email"
                                    value={email}
                                    editable={false}
                                    mode="outlined"
                                    style={[styles.input, styles.inputDisabled]}
                                    right={
                                        <TextInput.Icon
                                            icon="information-outline"
                                            onPress={() => {
                                                Alert.alert(
                                                    'Email Verification',
                                                    'Email cannot be changed here. Please contact support if you need to change your email address.'
                                                );
                                            }}
                                        />
                                    }
                                />
                                <Text style={styles.hintText}>
                                    Email cannot be changed. Contact support if needed.
                                </Text>

                                {/* Phone Number */}
                                <TextInput
                                    label="Phone Number"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    mode="outlined"
                                    style={styles.input}
                                    keyboardType="phone-pad"
                                    placeholder="(555) 123-4567"
                                />

                                {/* Company */}
                                <TextInput
                                    label="Company/Organization"
                                    value={company}
                                    onChangeText={setCompany}
                                    mode="outlined"
                                    style={styles.input}
                                    autoCapitalize="words"
                                    placeholder="Your company name"
                                />

                                {/* Job Title */}
                                <TextInput
                                    label="Job Title"
                                    value={jobTitle}
                                    onChangeText={setJobTitle}
                                    mode="outlined"
                                    style={styles.input}
                                    autoCapitalize="words"
                                    placeholder="e.g. Manager, Driver, Owner"
                                />
                            </ScrollView>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Button
                                mode="outlined"
                                onPress={handleCancel}
                                style={styles.cancelButton}
                                disabled={saving || uploadingPhoto || loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={saving}
                                disabled={saving || uploadingPhoto || loading}
                            >
                                Save Changes
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: Number(0), height: Number(-2) },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    form: {
        padding: 20,
        maxHeight: '70%',
    },
    profilePictureSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profilePictureContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.backgroundSecondary,
    },
    profilePicturePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePictureText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.textInverse,
    },
    editPictureBadge: {
        position: 'absolute',
        bottom: Number(0),
        right: Number(0),
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.surface,
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
    uploadingOverlay: {
        position: 'absolute',
        top: Number(0),
        left: Number(0),
        right: Number(0),
        bottom: Number(0),
        borderRadius: 60,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePictureHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: COLORS.surface,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: -12,
        marginBottom: 8,
        marginLeft: 4,
    },
    hintText: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: -12,
        marginBottom: 16,
        marginLeft: 4,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
    },
    saveButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.textSecondary,
    },
});

export default EditProfileModal;
