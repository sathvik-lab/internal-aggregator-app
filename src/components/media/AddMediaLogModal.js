/**
 * AddMediaLogModal Component
 *
 * Modal for creating a media log entry (photo/video + optional note).
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
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadMediaLog } from '../../services/mediaLogs';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';

/**
 * AddMediaLogModal Component
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onCreateSuccess - Callback when log is created successfully
 */
const AddMediaLogModal = ({ visible, onClose, onCreateSuccess }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const useGlass = colors.glassBackground != null;
  const glassColors = colors.glassBackground
    ? {
        background: colors.glassBackground,
        border: colors.glassBorder,
      }
    : GLASS;

  const [step, setStep] = useState('selection'); // 'selection' | 'form' | 'uploading' | 'success'
  const [selectedMedia, setSelectedMedia] = useState(null); // { uri, mediaType }
  const [note, setNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
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
        setSelectedMedia(null);
        setNote('');
        setUploadProgress(0);
        setError(null);
      }, 300);
    }
  }, [visible]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to add photo or video logs.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

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
        setSelectedMedia({
          uri: asset.uri,
          mediaType: 'photo',
        });
        setStep('form');
      }
    } catch (err) {
      console.error('Error taking photo for media log:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChoosePhoto = async () => {
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
        setSelectedMedia({
          uri: asset.uri,
          mediaType: 'photo',
        });
        setStep('form');
      }
    } catch (err) {
      console.error('Error choosing photo for media log:', err);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleRecordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          mediaType: 'video',
        });
        setStep('form');
      }
    } catch (err) {
      console.error('Error recording video for media log:', err);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    }
  };

  const handleChooseVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          mediaType: 'video',
        });
        setStep('form');
      }
    } catch (err) {
      console.error('Error choosing video for media log:', err);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!selectedMedia) {
      setError('Please select a photo or video first.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create media logs.');
      return;
    }

    setStep('uploading');
    setError(null);
    setUploadProgress(0);

    const { uri, mediaType } = selectedMedia;

    const result = await uploadMediaLog({
      uri,
      mediaType,
      note: note.trim() || null,
      onProgress: (progress) => {
        setUploadProgress(progress);
      },
    });

    if (result.error) {
      console.error('Error uploading media log:', result.error);
      setError(result.error.message || 'Failed to create media log. Please try again.');
      setStep('form');
      setUploadProgress(0);
      return;
    }

    setStep('success');
    setTimeout(() => {
      if (onCreateSuccess) {
        onCreateSuccess();
      }
      onClose();
    }, 1500);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const renderSelectionStep = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.sectionTitle}>Add photo or video log</Text>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={handleTakePhoto}
        activeOpacity={0.7}
        accessible
        accessibilityLabel="Take a photo"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="camera" size={32} color={COLORS.primary} />
        <Text style={styles.optionText}>Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={handleChoosePhoto}
        activeOpacity={0.7}
        accessible
        accessibilityLabel="Choose a photo from gallery"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="image" size={32} color={COLORS.primary} />
        <Text style={styles.optionText}>Choose Photo from Gallery</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={handleRecordVideo}
        activeOpacity={0.7}
        accessible
        accessibilityLabel="Record a video"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="video" size={32} color={COLORS.primary} />
        <Text style={styles.optionText}>Record Video</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={handleChooseVideo}
        activeOpacity={0.7}
        accessible
        accessibilityLabel="Choose a video from gallery"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="video-box" size={32} color={COLORS.primary} />
        <Text style={styles.optionText}>Choose Video from Gallery</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormStep = () => {
    if (!selectedMedia) return null;

    const isPhoto = selectedMedia.mediaType === 'photo';

    return (
      <View style={styles.formContainer}>
        <View style={styles.mediaPreview}>
          <MaterialCommunityIcons
            name={isPhoto ? 'image' : 'video'}
            size={48}
            color={COLORS.primary}
          />
          <Text style={styles.mediaTypeLabel}>
            {isPhoto ? 'Photo log' : 'Video log'}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Add any notes about this log (e.g., location, vehicle, issue observed)"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{`${note.length}/500`}</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
          accessible
          accessibilityLabel="Save media log"
          accessibilityRole="button"
          accessibilityHint="Double tap to save the photo or video with your notes"
        >
          <Text style={styles.saveButtonText}>Save Log</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUploadingStep = () => (
    <View style={styles.uploadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.uploadingText}>Saving media log...</Text>
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
  );

  const renderSuccessStep = () => (
    <View style={styles.uploadingContainer}>
      <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.success} />
      <Text style={styles.uploadingText}>Media log saved!</Text>
    </View>
  );

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
              {useGlass && Platform.OS === 'ios' && (
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              )}
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY }],
                    backgroundColor: useGlass && Platform.OS === 'android' ? glassColors.background : COLORS.surface,
                    borderColor: useGlass ? glassColors.border : COLORS.border,
                    borderWidth: useGlass ? 1 : 0,
                  },
                ]}
              >
                {useGlass && Platform.OS === 'ios' && (
                  <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )}
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {step === 'selection' && 'New Media Log'}
                {step === 'form' && 'Add Notes'}
                {step === 'uploading' && 'Saving...'}
                {step === 'success' && 'Saved'}
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
              {step === 'selection' && renderSelectionStep()}
              {step === 'form' && renderFormStep()}
              {step === 'uploading' && renderUploadingStep()}
              {step === 'success' && renderSuccessStep()}
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
        shadowOffset: { width: Number(0), height: Number(-2) },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  selectionContainer: {
    gap: 16,
    paddingVertical: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
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
  mediaPreview: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  mediaTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 8,
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
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
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
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
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
    textAlign: 'center',
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
});

export default AddMediaLogModal;

