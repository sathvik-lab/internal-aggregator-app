/**
 * UploadDocumentModal Component
 * 
 * Modal component for uploading documents with options to take photo,
 * choose from gallery, or select file. Includes upload progress and form.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
    Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../services/storage';
import { createDocument } from '../../services/firestore';
import { COLORS } from '../../constants/colors';
import { FILE_LIMITS, STORAGE_PATHS } from '../../constants/constants';

// Document categories (matching DocumentsScreen)
const DOCUMENT_CATEGORIES = [
    'Certifications',
    'Policies',
    'Legal',
    'Safety Reports',
];

/**
 * UploadDocumentModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onUploadSuccess - Callback when upload succeeds
 */
const UploadDocumentModal = ({ visible, onClose, onUploadSuccess }) => {
    const { user } = useAuth();

    // State management
    const [step, setStep] = useState('selection'); // 'selection' | 'form' | 'uploading' | 'success'
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0]);
    const [notes, setNotes] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [slideAnim] = useState(new Animated.Value(0));

    // Animate modal slide up/down
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    // Reset state when modal closes
    useEffect(() => {
        if (!visible) {
            setTimeout(() => {
                setStep('selection');
                setSelectedFile(null);
                setFileName('');
                setCategory(DOCUMENT_CATEGORIES[0]);
                setNotes('');
                setUploadProgress(0);
                setError(null);
            }, 300);
        }
    }, [visible]);

    // Request permissions for camera and media library
    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
            Alert.alert(
                'Permissions Required',
                'Camera and media library permissions are required to upload photos.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    // Handle take photo
    const handleTakePhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const file = {
                    uri: asset.uri,
                    name: `photo_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    size: asset.fileSize || 0,
                };
                setSelectedFile(file);
                setFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
                setStep('form');
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    // Handle choose from gallery
    const handleChooseFromGallery = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const file = {
                    uri: asset.uri,
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                    type: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize || 0,
                };
                setSelectedFile(file);
                setFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
                setStep('form');
            }
        } catch (error) {
            console.error('Error choosing from gallery:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    // Handle select file
    const handleSelectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                
                // Validate file size
                if (asset.size > FILE_LIMITS.MAX_SIZE_BYTES) {
                    Alert.alert(
                        'File Too Large',
                        `File size exceeds ${FILE_LIMITS.MAX_SIZE_MB}MB limit. Please select a smaller file.`
                    );
                    return;
                }

                const file = {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/pdf',
                    size: asset.size,
                };
                setSelectedFile(file);
                setFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
                setStep('form');
            }
        } catch (error) {
            console.error('Error selecting file:', error);
            Alert.alert('Error', 'Failed to select file. Please try again.');
        }
    };

    // Validate form
    const validateForm = () => {
        if (!fileName.trim()) {
            setError('File name is required');
            return false;
        }
        if (!category) {
            setError('Category is required');
            return false;
        }
        setError(null);
        return true;
    };

    // Handle upload
    const handleUpload = async () => {
        if (!validateForm()) return;
        if (!user?.uid) {
            Alert.alert('Error', 'You must be logged in to upload documents.');
            return;
        }

        setStep('uploading');
        setError(null);
        setUploadProgress(0);

        try {
            // Generate unique file path
            const fileExtension = selectedFile.name.split('.').pop();
            const uniqueId = Date.now();
            const storagePath = `${STORAGE_PATHS.DOCUMENTS}/${user.uid}/${uniqueId}_${fileName}.${fileExtension}`;

            // Upload file to Firebase Storage with progress callback
            const uploadResult = await uploadFile(
                selectedFile,
                storagePath,
                (progress) => {
                    setUploadProgress(progress);
                }
            );

            if (uploadResult.error) {
                throw new Error(uploadResult.error.message);
            }

            // Create document metadata in Firestore
            const documentData = {
                userId: user.uid,
                name: `${fileName}.${fileExtension}`,
                type: selectedFile.type.includes('image') ? 'IMAGE' : 'DOCUMENT',
                size: selectedFile.size,
                category: category,
                notes: notes.trim() || null,
                storageUrl: uploadResult.url,
                storagePath: storagePath,
                uploadDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                status: 'active',
            };

            const createResult = await createDocument('documents', documentData);

            if (createResult.error) {
                throw new Error(createResult.error.message);
            }

            // Success - show success state briefly then close
            setStep('success');
            setTimeout(() => {
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message || 'Failed to upload document. Please try again.');
            setStep('form');
            setUploadProgress(0);
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Get file type icon
    const getFileTypeIcon = (mimeType) => {
        if (mimeType?.includes('pdf')) return 'file-pdf-box';
        if (mimeType?.includes('word') || mimeType?.includes('document')) return 'file-word-box';
        if (mimeType?.includes('image')) return 'file-image';
        return 'file-document-outline';
    };

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [600, 0],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY }] },
                    ]}
                >
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                {step === 'selection' && 'Upload Document'}
                                {step === 'form' && 'Document Details'}
                                {step === 'uploading' && 'Uploading...'}
                                {step === 'success' && 'Upload Complete!'}
                            </Text>
                            {step !== 'uploading' && (
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <MaterialCommunityIcons
                                        name="close"
                                        size={24}
                                        color={COLORS.text}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Selection Step */}
                            {step === 'selection' && (
                                <View style={styles.selectionContainer}>
                                    <TouchableOpacity
                                        style={styles.optionButton}
                                        onPress={handleTakePhoto}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name="camera"
                                            size={32}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.optionText}>Take Photo</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.optionButton}
                                        onPress={handleChooseFromGallery}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name="image"
                                            size={32}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.optionText}>Choose from Gallery</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.optionButton}
                                        onPress={handleSelectFile}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons
                                            name="file-document"
                                            size={32}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.optionText}>Select File</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Form Step */}
                            {step === 'form' && selectedFile && (
                                <View style={styles.formContainer}>
                                    {/* File Preview */}
                                    <View style={styles.filePreview}>
                                        <MaterialCommunityIcons
                                            name={getFileTypeIcon(selectedFile.type)}
                                            size={48}
                                            color={COLORS.primary}
                                        />
                                        <Text style={styles.fileName} numberOfLines={1}>
                                            {selectedFile.name}
                                        </Text>
                                        <Text style={styles.fileSize}>
                                            {formatFileSize(selectedFile.size)}
                                        </Text>
                                    </View>

                                    {/* File Name Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>File Name *</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={fileName}
                                            onChangeText={setFileName}
                                            placeholder="Enter file name"
                                            placeholderTextColor={COLORS.textLight}
                                        />
                                    </View>

                                    {/* Category Dropdown */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Category *</Text>
                                        <TouchableOpacity
                                            style={styles.dropdown}
                                            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.dropdownText}>{category}</Text>
                                            <MaterialCommunityIcons
                                                name="chevron-down"
                                                size={20}
                                                color={COLORS.textSecondary}
                                            />
                                        </TouchableOpacity>
                                        {showCategoryDropdown && (
                                            <View style={styles.dropdownOptions}>
                                                {DOCUMENT_CATEGORIES.map((cat) => (
                                                    <TouchableOpacity
                                                        key={cat}
                                                        style={[
                                                            styles.dropdownOption,
                                                            category === cat && styles.dropdownOptionSelected,
                                                        ]}
                                                        onPress={() => {
                                                            setCategory(cat);
                                                            setShowCategoryDropdown(false);
                                                        }}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.dropdownOptionText,
                                                                category === cat && styles.dropdownOptionTextSelected,
                                                            ]}
                                                        >
                                                            {cat}
                                                        </Text>
                                                        {category === cat && (
                                                            <MaterialCommunityIcons
                                                                name="check"
                                                                size={20}
                                                                color={COLORS.primary}
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {/* Notes Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Notes (Optional)</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={notes}
                                            onChangeText={setNotes}
                                            placeholder="Add any notes about this document"
                                            placeholderTextColor={COLORS.textLight}
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                        />
                                    </View>

                                    {/* Error Message */}
                                    {error && (
                                        <View style={styles.errorContainer}>
                                            <MaterialCommunityIcons
                                                name="alert-circle"
                                                size={20}
                                                color={COLORS.error}
                                            />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    )}

                                    {/* Upload Button */}
                                    <TouchableOpacity
                                        style={styles.uploadButton}
                                        onPress={handleUpload}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.uploadButtonText}>Upload Document</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Uploading Step */}
                            {step === 'uploading' && (
                                <View style={styles.uploadingContainer}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={styles.uploadingText}>Uploading document...</Text>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${uploadProgress}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
                                </View>
                            )}

                            {/* Success Step */}
                            {step === 'success' && (
                                <View style={styles.successContainer}>
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={64}
                                        color={COLORS.success}
                                    />
                                    <Text style={styles.successText}>Document uploaded successfully!</Text>
                                </View>
                            )}
                        </ScrollView>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 10,
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
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    selectionContainer: {
        gap: 16,
        paddingVertical: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSecondary,
        padding: 20,
        borderRadius: 12,
        gap: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
    formContainer: {
        gap: 20,
    },
    filePreview: {
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSecondary,
        padding: 24,
        borderRadius: 12,
        marginBottom: 8,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 12,
        textAlign: 'center',
    },
    fileSize: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundSecondary,
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dropdownText: {
        fontSize: 16,
        color: COLORS.text,
    },
    dropdownOptions: {
        marginTop: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    dropdownOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dropdownOptionSelected: {
        backgroundColor: `${COLORS.primary}15`,
    },
    dropdownOptionText: {
        fontSize: 16,
        color: COLORS.text,
    },
    dropdownOptionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${COLORS.error}15`,
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.error,
    },
    uploadButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textInverse,
    },
    uploadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    uploadingText: {
        fontSize: 16,
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 24,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.success,
        marginTop: 16,
        textAlign: 'center',
    },
});

export default UploadDocumentModal;
