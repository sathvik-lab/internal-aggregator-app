/**
 * SortDropdown Component
 * 
 * Dropdown component for sorting documents.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const SORT_OPTIONS = [
    { value: 'date-desc', label: 'Date (Newest)', icon: 'sort-calendar-descending' },
    { value: 'date-asc', label: 'Date (Oldest)', icon: 'sort-calendar-ascending' },
    { value: 'name-asc', label: 'Name (A-Z)', icon: 'sort-alphabetical-ascending' },
    { value: 'name-desc', label: 'Name (Z-A)', icon: 'sort-alphabetical-descending' },
    { value: 'size-desc', label: 'Size (Largest)', icon: 'sort-numeric-descending' },
    { value: 'size-asc', label: 'Size (Smallest)', icon: 'sort-numeric-ascending' },
    { value: 'type-asc', label: 'Type (A-Z)', icon: 'sort-variant' },
];

/**
 * SortDropdown Component
 * 
 * @param {Object} props
 * @param {string} props.value - Current sort value
 * @param {Function} props.onChange - Callback when sort option is selected
 */
const SortDropdown = ({ value, onChange }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0];

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                style={styles.container}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name={selectedOption.icon}
                    size={18}
                    color={COLORS.textSecondary}
                />
                <Text style={styles.label}>{selectedOption.label}</Text>
                <MaterialCommunityIcons
                    name="chevron-down"
                    size={18}
                    color={COLORS.textSecondary}
                />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sort By</Text>
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.option,
                                    value === option.value && styles.optionSelected,
                                ]}
                                onPress={() => handleSelect(option.value)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={option.icon}
                                    size={20}
                                    color={value === option.value ? COLORS.primary : COLORS.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.optionText,
                                        value === option.value && styles.optionTextSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {value === option.value && (
                                    <MaterialCommunityIcons
                                        name="check"
                                        size={20}
                                        color={COLORS.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        width: '80%',
        maxWidth: 300,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        gap: 12,
    },
    optionSelected: {
        backgroundColor: `${COLORS.primary}15`,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default SortDropdown;
