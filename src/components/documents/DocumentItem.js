/**
 * DocumentItem Component
 * 
 * Displays a single document item in a list.
 * Shows document name, category, upload date, and file type icon.
 */

import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { getDocumentExpiryStatus } from '../../utils/documentExpiryStatus';

/**
 * Get file type icon based on MIME type
 * @param {string} mimeType - MIME type of the file
 * @returns {string} Icon name
 */
const getFileIcon = (mimeType) => {
    if (!mimeType) return 'file-document-outline';
    
    if (mimeType.includes('pdf')) return 'file-pdf-box';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-box';
    if (mimeType.includes('image')) return 'file-image-outline';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel-box';
    
    return 'file-document-outline';
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    const diffTime = today - dateOnly;
    if (diffTime < 0) {
        const futureDays = Math.ceil((-diffTime) / (1000 * 60 * 60 * 24));
        if (futureDays === 1) return 'Tomorrow';
        return `In ${futureDays} days`;
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * DocumentItem Component
 * 
 * @param {Object} props
 * @param {Object} props.document - Document object
 * @param {Function} props.onPress - Callback when document is pressed
 */
const DocumentItem = ({ document, onPress }) => {
    const fileIcon = useMemo(() => getFileIcon(document?.mimeType), [document?.mimeType]);
    const expiryStatus = useMemo(() => getDocumentExpiryStatus(document?.expiryDate), [document?.expiryDate]);
    const expiryToneColor = useMemo(() => {
        if (expiryStatus.tone === 'critical') return COLORS.error;
        if (expiryStatus.tone === 'warning') return COLORS.warning;
        if (expiryStatus.tone === 'success') return COLORS.success;
        return COLORS.textSecondary;
    }, [expiryStatus.tone]);

    const handlePress = useCallback(() => {
        if (onPress && document) {
            onPress(document);
        }
    }, [onPress, document]);

    if (!document) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.7}
            accessibilityLabel={`${document.name}, ${document.category || 'document'}, status ${expiryStatus.label}`}
            accessibilityRole="button"
        >
            {/* File Icon */}
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                    name={fileIcon}
                    size={32}
                    color={COLORS.primary}
                />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>
                    {document.name}
                </Text>
                <View style={styles.metaRow}>
                    <Text style={styles.category}>{document.category}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.size}>{formatFileSize(document.size)}</Text>
                </View>
                <Text style={styles.date}>{formatDate(document.uploadDate)}</Text>
                <View style={[styles.statusBadge, { borderColor: expiryToneColor, backgroundColor: `${expiryToneColor}18` }]}>
                    <Text style={[styles.statusBadgeText, { color: expiryToneColor }]}>{expiryStatus.label}</Text>
                </View>
            </View>

            {/* Arrow Icon */}
            <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={COLORS.textLight}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        // Shadow for depth
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: Number(0), height: Number(1) },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    category: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    separator: {
        fontSize: 13,
        color: COLORS.textLight,
        marginHorizontal: 6,
    },
    size: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    date: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(DocumentItem, (prevProps, nextProps) => {
    return (
        prevProps.document.id === nextProps.document.id &&
        prevProps.document.name === nextProps.document.name &&
        prevProps.document.size === nextProps.document.size &&
        prevProps.document.uploadDate === nextProps.document.uploadDate &&
        prevProps.document.category === nextProps.document.category &&
        prevProps.document.mimeType === nextProps.document.mimeType &&
        prevProps.onPress === nextProps.onPress
    );
});
