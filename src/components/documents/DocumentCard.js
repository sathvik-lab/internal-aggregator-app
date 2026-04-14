/**
 * DocumentCard Component
 * 
 * Displays a document in a card format with icon, name, metadata, and action menu.
 * Used in grid/list views of the Documents screen.
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { GLASS } from '../../utils/glassmorphism';
import { getDocumentExpiryBadge } from '../../utils/documentTypes';

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
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint-box';
    if (mimeType.includes('text')) return 'file-document-outline';
    
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * DocumentCard Component
 * 
 * @param {Object} props
 * @param {Object} props.document - Document object with name, size, uploadDate, category, mimeType
 * @param {Function} props.onPress - Callback when card is pressed (for viewing details)
 * @param {Function} props.onMenuPress - Callback when menu button is pressed (for actions)
 */
const DocumentCard = ({ document, onPress, onMenuPress }) => {
    const { colors } = useTheme();
    const useGlass = colors.glassBackground != null;

    // Get file type color based on MIME type (moved inside component to avoid module load-time COLORS reference)
    const getFileIconColor = useCallback((mimeType) => {
        if (!mimeType) return COLORS.primary;
        
        if (mimeType.includes('pdf')) return '#DC2626'; // Red for PDF
        if (mimeType.includes('word') || mimeType.includes('document')) return '#2563EB'; // Blue for Word
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#16A34A'; // Green for Excel
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '#DC2626'; // Red for PowerPoint
        if (mimeType.includes('image')) return COLORS.accent;
        
        return COLORS.primary;
    }, []);

    // Memoize icon and color calculations
    const fileIcon = useMemo(() => getFileIcon(document.mimeType), [document.mimeType]);
    const fileIconColor = useMemo(() => getFileIconColor(document.mimeType), [document.mimeType, getFileIconColor]);

    // Fade-in animation for list items
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    // Memoize handlers to prevent re-renders
    const handleCardPress = useCallback(() => {
        if (onPress) {
            onPress(document);
        }
    }, [onPress, document]);

    const handleMenuPress = useCallback((e) => {
        e.stopPropagation(); // Prevent triggering card press
        if (onMenuPress) {
            onMenuPress(document);
        }
    }, [onMenuPress, document]);

    // Memoize accessibility label
    const accessibilityLabel = useMemo(() => {
        return `${document.name}, ${document.category || 'document'}, ${formatFileSize(document.size)}, uploaded ${formatDate(document.uploadDate)}`;
    }, [document.name, document.category, document.size, document.uploadDate]);
    
    const accessibilityHint = onPress ? 'Double tap to view document details' : undefined;
    const expiryBadge = useMemo(() => getDocumentExpiryBadge(document), [document]);

    const containerStyle = useGlass
        ? [
            styles.container,
            styles.glassContainer,
            {
                backgroundColor: Platform.OS === 'android' ? (colors.glassBackground ?? GLASS.background) : 'transparent',
                borderColor: colors.glassBorder ?? GLASS.border,
            },
        ]
        : [styles.container, { backgroundColor: COLORS.surface, borderColor: COLORS.border }];

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <TouchableOpacity
                style={containerStyle}
                onPress={handleCardPress}
                activeOpacity={0.7}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityRole="button"
            >
            {useGlass && Platform.OS === 'ios' && (
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.contentWrapper} pointerEvents="box-none">
            {/* Header with Menu Button */}
            <View style={styles.header}>
                <View 
                    style={styles.iconContainer}
                    accessibilityElementsHidden={true}
                    importantForAccessibility="no-hide-descendants"
                >
                    <MaterialCommunityIcons
                        name={fileIcon}
                        size={40}
                        color={fileIconColor}
                    />
                </View>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={handleMenuPress}
                    activeOpacity={0.7}
                    accessibilityLabel={`Actions for ${document.name}`}
                    accessibilityHint="Double tap to view document actions menu"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons
                        name="dots-vertical"
                        size={20}
                        color={colors.textSecondary ?? COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Document Name */}
                <Text style={[styles.name, { color: colors.text?.primary ?? COLORS.text }]} numberOfLines={2}>
                    {document.name}
                </Text>

                {/* Category Badge */}
                {document.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{document.category}</Text>
                    </View>
                )}

                {/* Expiry status */}
                {expiryBadge && (
                    <View style={[styles.expiryBadge, { backgroundColor: expiryBadge.backgroundColor || 'rgba(0,0,0,0.08)', borderColor: expiryBadge.color }]}> 
                        <Text style={[styles.expiryBadgeText, { color: expiryBadge.color }]}>{expiryBadge.label}</Text>
                    </View>
                )}

                {/* Metadata */}
                <View style={styles.metadata}>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons
                            name="file-outline"
                            size={14}
                            color={colors.textLight ?? COLORS.textLight}
                        />
                        <Text style={[styles.metaText, { color: colors.textSecondary ?? COLORS.textSecondary }]}>{formatFileSize(document.size)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons
                            name="calendar-outline"
                            size={14}
                            color={colors.textLight ?? COLORS.textLight}
                        />
                        <Text style={[styles.metaText, { color: colors.textSecondary ?? COLORS.textSecondary }]}>{formatDate(document.uploadDate)}</Text>
                    </View>
                </View>
            </View>
            </View>
        </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: Number(0), height: Number(2) },
                shadowOpacity: 0.08,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    glassContainer: {
        borderRadius: 24,
    },
    contentWrapper: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    content: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 22,
        minHeight: 44, // Ensure consistent height for 2 lines
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: `${COLORS.primary}15`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    expiryBadge: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 12,
    },
    expiryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    metadata: {
        marginTop: 'auto',
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
    },
});

// Memoize component to prevent unnecessary re-renders
export default memo(DocumentCard, (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
        prevProps.document.id === nextProps.document.id &&
        prevProps.document.name === nextProps.document.name &&
        prevProps.document.size === nextProps.document.size &&
        prevProps.document.uploadDate === nextProps.document.uploadDate &&
        prevProps.document.category === nextProps.document.category &&
        prevProps.document.mimeType === nextProps.document.mimeType &&
        prevProps.document.expiryDate === nextProps.document.expiryDate &&
        prevProps.onPress === nextProps.onPress &&
        prevProps.onMenuPress === nextProps.onMenuPress
    );
});
