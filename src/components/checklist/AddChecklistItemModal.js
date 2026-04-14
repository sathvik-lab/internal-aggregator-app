/**
 * AddChecklistItemModal Component
 * 
 * Modal for manually adding new checklist items.
 * Includes form validation and Firestore integration.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
} from 'react-native';
import {
    TextInput,
    Button,
    Portal,
    Dialog,
    RadioButton,
    Checkbox,
} from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';
import { MOCK_CHECKLIST_CATEGORIES } from '../../utils/mockData';
import { createDocument } from '../../services/firestore';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

/**
 * Format date for display
 */
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Get date options (Today, Tomorrow, Next Week, etc.)
 */
const getDateOptions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return [
        { label: 'Today', value: today.toISOString() },
        { label: 'Tomorrow', value: tomorrow.toISOString() },
        { label: 'Next Week', value: nextWeek.toISOString() },
        { label: 'Next Month', value: nextMonth.toISOString() },
        { label: 'Custom Date', value: 'custom' },
    ];
};

/**
 * AddChecklistItemModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSuccess - Callback when item is successfully created
 */
const AddChecklistItemModal = ({ visible, onClose, onSuccess }) => {
    const { user, userProfile } = useAuth();
    const { colors } = useTheme();
    const useGlass = colors.glassBackground != null;
    const glassColors = colors.glassBackground
        ? {
            background: colors.glassBackground,
            border: colors.glassBorder,
        }
        : GLASS;

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(null);
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState('daily');

    // UI state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [showPriorityDialog, setShowPriorityDialog] = useState(false);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showRecurringDialog, setShowRecurringDialog] = useState(false);
    const [saving, setSaving] = useState(false);

    // Validation errors
    const [titleError, setTitleError] = useState('');
    const [dueDateError, setDueDateError] = useState('');
    const [categoryError, setCategoryError] = useState('');

    const dateOptions = getDateOptions();

    /**
     * Handle date selection
     */
    const handleDateSelect = (value) => {
        if (value === 'custom') {
            setShowCustomDatePicker(true);
            setShowDatePicker(false);
        } else {
            setDueDate(value);
            setShowDatePicker(false);
            validateDueDate(value);
        }
    };

    /**
     * Handle custom date selection
     * For now, this is a placeholder. Can be enhanced with expo-date-picker
     */
    const handleCustomDateSelect = () => {
        // TODO: Implement full date picker with expo-date-picker
        // For now, default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        const dateString = tomorrow.toISOString();
        setDueDate(dateString);
        setShowCustomDatePicker(false);
        validateDueDate(dateString);
    };

    /**
     * Validate due date
     */
    const validateDueDate = (dateString) => {
        if (!dateString) {
            setDueDateError('');
            return true;
        }

        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setDueDateError('Selected date is in the past');
            return false;
        }

        setDueDateError('');
        return true;
    };

    /**
     * Validate title
     */
    const validateTitle = () => {
        if (!title.trim()) {
            setTitleError('Title is required');
            return false;
        }
        if (title.trim().length < 3) {
            setTitleError('Title must be at least 3 characters');
            return false;
        }
        setTitleError('');
        return true;
    };

    /**
     * Validate category
     * @param {string} [categoryValue] - Optional category value to validate (uses state if not provided)
     */
    const validateCategory = (categoryValue = null) => {
        const valueToCheck = categoryValue !== null ? categoryValue : category;
        if (!valueToCheck) {
            setCategoryError('Category is required');
            return false;
        }
        setCategoryError('');
        return true;
    };

    /**
     * Reset form
     */
    const resetForm = () => {
        setTitle('');
        setDescription('');
        setDueDate(null);
        setPriority('medium');
        setCategory('');
        setIsRecurring(false);
        setRecurringFrequency('daily');
        setTitleError('');
        setDueDateError('');
        setCategoryError('');
    };

    /**
     * Handle save
     */
    const handleSave = async () => {
        // Validate form
        const isTitleValid = validateTitle();
        const isCategoryValid = validateCategory();
        const isDueDateValid = dueDate ? validateDueDate(dueDate) : true;

        if (!isTitleValid || !isCategoryValid || !isDueDateValid) {
            return;
        }

        // Warn if date is in the past but allow
        if (dueDate) {
            const selectedDate = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                Alert.alert(
                    'Past Date Warning',
                    'The selected due date is in the past. Do you want to continue?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: () => saveItem() },
                    ]
                );
                return;
            }
        }

        await saveItem();
    };

    /**
     * Save checklist item to Firestore
     */
    const saveItem = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'You must be signed in to create checklist items.');
            return;
        }

        setSaving(true);

        try {
            const checklistData = {
                userId: user.uid,
                ...(userProfile?.defaultBusinessId ? { businessId: userProfile.defaultBusinessId } : {}),
                title: title.trim(),
                description: description.trim() || null,
                dueDate: dueDate || null,
                priority: priority,
                category: category,
                completed: false,
                status: 'pending',
                frequency: isRecurring ? recurringFrequency : null,
                // createdAt and updatedAt are added by createDocument with serverTimestamp
                createdBy: 'user', // vs 'system' for auto-generated ones
                completedAt: null,
                notes: null,
                photos: [],
                // New fields for template system
                templateId: null, // User-created items don't have a template
                source: 'user', // 'user' | 'osha_generated' | 'system'
            };

            // Real Firestore:
            // await createDocument('checklistItems', {
            //   ...checklistData,
            //   createdAt: serverTimestamp(),
            // });

            const result = await createDocument('checklistItems', checklistData);

            if (result.error) {
                throw new Error(result.error.message || 'Failed to create checklist item');
            }

            // Success
            Alert.alert('Success', 'Checklist item created successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        resetForm();
                        if (onSuccess) onSuccess();
                        onClose();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error creating checklist item:', error);
            Alert.alert('Error', error.message || 'Failed to create checklist item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /**
     * Handle cancel
     */
    const handleCancel = () => {
        if (title || description || dueDate || category) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved changes. Are you sure you want to close?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            resetForm();
                            onClose();
                        },
                    },
                ]
            );
        } else {
            resetForm();
            onClose();
        }
    };

    /**
     * Render date picker dialog
     */
    const renderDatePicker = () => {
        return (
            <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
                <Dialog.Title>Select Due Date</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        {dateOptions.map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={styles.dateOption}
                                onPress={() => handleDateSelect(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.dateOptionText}>{option.label}</Text>
                                {option.value !== 'custom' && (
                                    <Text style={styles.dateOptionSubtext}>
                                        {formatDate(option.value)}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowDatePicker(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render custom date picker dialog
     */
    const renderCustomDatePicker = () => {
        return (
            <Dialog visible={showCustomDatePicker} onDismiss={() => setShowCustomDatePicker(false)}>
                <Dialog.Title>Select Custom Date</Dialog.Title>
                <Dialog.Content>
                    <Text style={styles.datePickerNote}>
                        Full date picker will be implemented with expo-date-picker.
                        For now, please use one of the quick date options.
                    </Text>
                    <Button
                        mode="outlined"
                        onPress={handleCustomDateSelect}
                        style={styles.customDateButton}
                    >
                        Use Tomorrow (Default)
                    </Button>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowCustomDatePicker(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render priority selector dialog
     */
    const renderPriorityDialog = () => {
        return (
            <Dialog visible={showPriorityDialog} onDismiss={() => setShowPriorityDialog(false)}>
                <Dialog.Title>Select Priority</Dialog.Title>
                <Dialog.Content>
                    <RadioButton.Group
                        onValueChange={(value) => {
                            setPriority(value);
                            setShowPriorityDialog(false);
                        }}
                        value={priority}
                    >
                        {PRIORITIES.map((p) => (
                            <View key={p} style={styles.radioOption}>
                                <RadioButton value={p} />
                                <Text style={styles.radioLabel}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowPriorityDialog(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render category selector dialog
     */
    const renderCategoryDialog = () => {
        return (
            <Dialog visible={showCategoryDialog} onDismiss={() => setShowCategoryDialog(false)}>
                <Dialog.Title>Select Category</Dialog.Title>
                <Dialog.Content>
                    <ScrollView>
                        {MOCK_CHECKLIST_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryOption,
                                    category === cat && styles.categoryOptionSelected,
                                ]}
                                onPress={() => {
                                    setCategory(cat);
                                    setShowCategoryDialog(false);
                                    validateCategory(cat);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.categoryOptionText,
                                        category === cat && styles.categoryOptionTextSelected,
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
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowCategoryDialog(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
    };

    /**
     * Render recurring frequency dialog
     */
    const renderRecurringDialog = () => {
        return (
            <Dialog visible={showRecurringDialog} onDismiss={() => setShowRecurringDialog(false)}>
                <Dialog.Title>Select Recurring Frequency</Dialog.Title>
                <Dialog.Content>
                    <RadioButton.Group
                        onValueChange={(value) => {
                            setRecurringFrequency(value);
                            setShowRecurringDialog(false);
                        }}
                        value={recurringFrequency}
                    >
                        {RECURRING_FREQUENCIES.map((freq) => (
                            <View key={freq} style={styles.radioOption}>
                                <RadioButton value={freq} />
                                <Text style={styles.radioLabel}>
                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={() => setShowRecurringDialog(false)}>Cancel</Button>
                </Dialog.Actions>
            </Dialog>
        );
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
                            <Text style={styles.headerTitle}>Add Checklist Item</Text>
                            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                                <MaterialCommunityIcons
                                    name="close"
                                    size={24}
                                    color={COLORS.text}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                            {/* Title */}
                            <TextInput
                                label="Title *"
                                value={title}
                                onChangeText={(text) => {
                                    setTitle(text);
                                    if (titleError) validateTitle();
                                }}
                                onBlur={validateTitle}
                                error={!!titleError}
                                mode="outlined"
                                style={styles.input}
                            />
                            {titleError ? (
                                <Text style={styles.errorText}>{titleError}</Text>
                            ) : null}

                            {/* Description */}
                            <TextInput
                                label="Description"
                                value={description}
                                onChangeText={setDescription}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                style={styles.input}
                                placeholder="Optional description of the checklist item"
                            />

                            {/* Due Date */}
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.selectButtonContent}>
                                    <View>
                                        <Text style={styles.selectLabel}>Due Date</Text>
                                        <Text
                                            style={[
                                                styles.selectValue,
                                                !dueDate && styles.selectValuePlaceholder,
                                            ]}
                                        >
                                            {dueDate ? formatDate(dueDate) : 'Select due date'}
                                        </Text>
                                        {dueDateError ? (
                                            <Text style={styles.errorText}>{dueDateError}</Text>
                                        ) : null}
                                    </View>
                                    <MaterialCommunityIcons
                                        name="calendar"
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Priority */}
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setShowPriorityDialog(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.selectButtonContent}>
                                    <View>
                                        <Text style={styles.selectLabel}>Priority</Text>
                                        <Text style={styles.selectValue}>
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name="chevron-down"
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Category */}
                            <TouchableOpacity
                                style={[
                                    styles.selectButton,
                                    categoryError && styles.selectButtonError,
                                ]}
                                onPress={() => setShowCategoryDialog(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.selectButtonContent}>
                                    <View>
                                        <Text style={styles.selectLabel}>Category *</Text>
                                        <Text
                                            style={[
                                                styles.selectValue,
                                                !category && styles.selectValuePlaceholder,
                                            ]}
                                        >
                                            {category || 'Select category'}
                                        </Text>
                                        {categoryError ? (
                                            <Text style={styles.errorText}>{categoryError}</Text>
                                        ) : null}
                                    </View>
                                    <MaterialCommunityIcons
                                        name="chevron-down"
                                        size={24}
                                        color={COLORS.textSecondary}
                                    />
                                </View>
                            </TouchableOpacity>

                            {/* Recurring Toggle */}
                            <View style={styles.recurringContainer}>
                                <View style={styles.recurringRow}>
                                    <Text style={styles.recurringLabel}>Recurring Task</Text>
                                    <Checkbox
                                        status={isRecurring ? 'checked' : 'unchecked'}
                                        onPress={() => setIsRecurring(!isRecurring)}
                                        color={COLORS.primary}
                                    />
                                </View>
                                {isRecurring && (
                                    <TouchableOpacity
                                        style={styles.selectButton}
                                        onPress={() => setShowRecurringDialog(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.selectButtonContent}>
                                            <View>
                                                <Text style={styles.selectLabel}>Frequency</Text>
                                                <Text style={styles.selectValue}>
                                                    {recurringFrequency.charAt(0).toUpperCase() +
                                                        recurringFrequency.slice(1)}
                                                </Text>
                                            </View>
                                            <MaterialCommunityIcons
                                                name="chevron-down"
                                                size={24}
                                                color={COLORS.textSecondary}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Button
                                mode="outlined"
                                onPress={handleCancel}
                                style={styles.cancelButton}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                loading={saving}
                                disabled={saving}
                            >
                                Save
                            </Button>
                        </View>
                    </View>
                </View>

                {/* Dialogs */}
                {renderDatePicker()}
                {renderCustomDatePicker()}
                {renderPriorityDialog()}
                {renderCategoryDialog()}
                {renderRecurringDialog()}
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
    input: {
        marginBottom: 16,
        backgroundColor: COLORS.surface,
    },
    selectButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        padding: 16,
        marginBottom: 16,
        backgroundColor: COLORS.surface,
    },
    selectButtonError: {
        borderColor: COLORS.error,
    },
    selectButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    selectValue: {
        fontSize: 16,
        color: COLORS.text,
    },
    selectValuePlaceholder: {
        color: COLORS.textLight,
    },
    errorText: {
        fontSize: 12,
        color: COLORS.error,
        marginTop: -12,
        marginBottom: 8,
        marginLeft: 4,
    },
    recurringContainer: {
        marginBottom: 16,
    },
    recurringRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recurringLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
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
    dateOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    dateOptionText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    dateOptionSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    customDatePicker: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    customDateLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    customDateButton: {
        marginTop: 16,
    },
    datePickerNote: {
        fontSize: 12,
        color: COLORS.textLight,
        fontStyle: 'italic',
        marginTop: 8,
        marginBottom: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioLabel: {
        fontSize: 16,
        color: COLORS.text,
        marginLeft: 8,
    },
    categoryOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    categoryOptionSelected: {
        backgroundColor: COLORS.primary + '10',
    },
    categoryOptionText: {
        fontSize: 16,
        color: COLORS.text,
    },
    categoryOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default AddChecklistItemModal;
