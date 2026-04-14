/**
 * EditDocumentModal Component
 * 
 * Modal for editing document metadata (name, category, notes).
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
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';
import { DOCUMENT_FILTERS, getDocumentFilterLabel } from '../../utils/documentTypes';

const DOCUMENT_CATEGORIES = DOCUMENT_FILTERS.filter((filterLabel) => filterLabel !== 'All');

/**
 * EditDocumentModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Object} props.document - Document object to edit
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSave - Callback when save is pressed (receives updated data)
 */
const EditDocumentModal = ({ visible, document, onClose, onSave }) => {
    const { colors } = useTheme();
    const useGlass = colors.glassBackground != null;
    const glassColors = colors.glassBackground
        ? {
            background: colors.glassBackground,
            border: colors.glassBorder,
        }
        : GLASS;
    
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [error, setError] = useState(null);

    // Initialize form with document data
    useEffect(() => {
        if (document) {
            setName(document.name || '');
            setCategory(getDocumentFilterLabel(document));
            setNotes(document.notes || '');
            setExpiryDate(document.expiryDate ? new Date(document.expiryDate).toISOString().slice(0, 10) : '');
        }
    }, [document, visible]);

    const handleSave = () => {
        if (!name.trim()) {
            setError('File name is required');
            return;
        }
        if (!category) {
            setError('Category is required');
            return;
        }
        if (expiryDate) {
            const parsedDate = new Date(expiryDate);
            if (Number.isNaN(parsedDate.getTime())) {
                setError('Expiry date must be a valid date in YYYY-MM-DD format');
                return;
            }
        }

        setError(null);
        if (onSave) {
            onSave({
                name: name.trim(),
                category: category,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
                notes: notes.trim() || null,
            });
        }
    };

    if (!document) return null;

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
                <View
                    style={[
                        styles.modalContainer,
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
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Edit Document</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color={COLORS.text}
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* File Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>File Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
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

                            {/* Expiry Date Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Expiry Date (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={expiryDate}
                                    onChangeText={setExpiryDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textLight}
                                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                                />
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

                            {/* Save Button */}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: Number(0), height: Number(4) },
                shadowOpacity: 0.3,
                shadowRadius: 8,
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
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
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
        marginBottom: 16,
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
});

export default EditDocumentModal;
