/**
 * Document Detail Screen
 * 
 * Screen showing detailed information about a document with actions
 * (download, share, delete, edit). Integrates with Firebase Storage and Firestore.
 * 
 * Firebase Operations:
 * - Fetch document: getDocument('documents', docId)
 * - Download: Open downloadURL from Firebase Storage
 * - Share: Use React Native Share API with downloadURL
 * - Delete: deleteFile(storagePath) + deleteDocument('documents', docId)
 * - Update: updateDocument('documents', docId, { name, category, notes, updatedAt })
 * - Related docs: queryDocuments('documents', [
 *     { field: 'category', operator: '==', value: document.category },
 *     { field: 'userId', operator: '==', value: user.uid }
 *   ])
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    Share,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import EditDocumentModal from '../components/documents/EditDocumentModal';
import DocumentCard from '../components/documents/DocumentCard';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { COLORS } from '../constants/colors';
import { getDocument, updateDocument, deleteDocument, queryDocuments } from '../services/firestore';
import { deleteFile } from '../services/storage';
import { getDocumentExpiryLabel } from '../utils/documentTypes';
import { getDocumentExpiryStatus } from '../utils/documentExpiryStatus';

/**
 * Get file type icon based on MIME type
 */
const getFileIcon = (mimeType) => {
    if (!mimeType) return 'file-document-outline';
    if (mimeType.includes('pdf')) return 'file-pdf-box';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-box';
    if (mimeType.includes('image')) return 'file-image';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel-box';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint-box';
    return 'file-document-outline';
};

/**
 * Get file type color based on MIME type
 */
const getFileIconColor = (mimeType) => {
    if (!mimeType) return COLORS.primary;
    if (mimeType.includes('pdf')) return '#DC2626';
    if (mimeType.includes('word') || mimeType.includes('document')) return '#2563EB';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#16A34A';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '#DC2626';
    if (mimeType.includes('image')) return COLORS.accent;
    return COLORS.primary;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const DocumentDetailScreen = () => {
    const statusToneColors = {
        critical: COLORS.error,
        warning: COLORS.warning,
        success: COLORS.success,
        neutral: COLORS.textSecondary,
    };
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();

    const { documentId } = route.params || {};

    // State management
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    /**
     * Fetch document details from Firestore
     * 
     * Real Firestore implementation:
     * ```javascript
     * import { doc, getDoc } from 'firebase/firestore';
     * import { db } from '../services/firebase';
     * 
     * const docRef = doc(db, 'documents', documentId);
     * const docSnap = await getDoc(docRef);
     * if (docSnap.exists()) {
     *   setDocument({ id: docSnap.id, ...docSnap.data() });
     * }
     * ```
     */
    const fetchDocument = useCallback(async () => {
        if (!documentId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const result = await getDocument('documents', documentId);

            if (result.error) {
                Alert.alert('Error', result.error.message || 'Failed to load document');
                navigation.goBack();
                return;
            }

            if (result.data) {
                setDocument(result.data);
            } else {
                Alert.alert('Not Found', 'Document not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            Alert.alert('Error', 'Failed to load document');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [documentId, navigation]);

    /**
     * Fetch related documents (same category)
     */
    const fetchRelatedDocuments = useCallback(async () => {
        if (!document || !user?.uid) return;

        try {
            const result = await queryDocuments(
                'documents',
                [
                    { field: 'category', operator: '==', value: document.category },
                    { field: 'userId', operator: '==', value: user.uid },
                ],
                {
                    limit: 5,
                }
            );

            if (result.data) {
                // Filter out current document
                const related = result.data.filter((doc) => doc.id !== document.id);
                setRelatedDocuments(related);
            }
        } catch (error) {
            console.error('Error fetching related documents:', error);
        }
    }, [document, user]);

    // Fetch document on mount
    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);

    // Fetch related documents when document is loaded
    useEffect(() => {
        if (document) {
            fetchRelatedDocuments();
        }
    }, [document, fetchRelatedDocuments]);

    // Set navigation header
    useEffect(() => {
        navigation.setOptions({
            title: document?.name || 'Document Details',
            headerBackTitleVisible: false,
        });
    }, [navigation, document]);

    // Handlers
    const handleDownload = async () => {
        if (!document?.storageUrl) {
            Alert.alert('Error', 'Download URL not available');
            return;
        }

        try {
            const supported = await Linking.canOpenURL(document.storageUrl);
            if (supported) {
                await Linking.openURL(document.storageUrl);
            } else {
                Alert.alert('Error', 'Cannot open download URL');
            }
        } catch (error) {
            console.error('Error opening download URL:', error);
            Alert.alert('Error', 'Failed to download document');
        }
    };

    const handleShare = async () => {
        if (!document?.storageUrl) {
            Alert.alert('Error', 'Share URL not available');
            return;
        }

        try {
            const result = await Share.share({
                message: `Check out this document: ${document.name}\n${document.storageUrl}`,
                url: document.storageUrl,
                title: document.name,
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Shared with activity type of result.activityType
                } else {
                    // Shared
                }
            }
        } catch (error) {
            console.error('Error sharing document:', error);
            Alert.alert('Error', 'Failed to share document');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Document',
            `Are you sure you want to delete "${document.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await performDelete();
                    },
                },
            ]
        );
    };

    const performDelete = async () => {
        if (!document) return;

        try {
            setDeleting(true);

            // Delete from Firebase Storage first
            if (document.storagePath) {
                const storageResult = await deleteFile(document.storagePath);
                if (storageResult.error) {
                    console.error('Error deleting from storage:', storageResult.error);
                    // Continue with Firestore deletion even if storage deletion fails
                }
            }

            // Delete from Firestore
            const firestoreResult = await deleteDocument('documents', document.id);

            if (firestoreResult.error) {
                throw new Error(firestoreResult.error.message);
            }

            // Success - navigate back
            Alert.alert('Success', 'Document deleted successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            console.error('Error deleting document:', error);
            Alert.alert('Error', error.message || 'Failed to delete document');
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = () => {
        setEditModalVisible(true);
    };

    const handleSaveEdit = async (updatedData) => {
        if (!document) return;

        try {
            setUpdating(true);

            // Update document in Firestore
            // Real Firestore: updateDocument('documents', document.id, {
            //   ...updatedData,
            //   updatedAt: serverTimestamp()
            // })
            const result = await updateDocument('documents', document.id, {
                ...updatedData,
                updatedAt: new Date().toISOString(),
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Update local state
            setDocument({
                ...document,
                ...updatedData,
            });

            setEditModalVisible(false);
            Alert.alert('Success', 'Document updated successfully');
        } catch (error) {
            console.error('Error updating document:', error);
            Alert.alert('Error', error.message || 'Failed to update document');
        } finally {
            setUpdating(false);
        }
    };

    const handleRelatedDocumentPress = (relatedDoc) => {
        navigation.replace('DocumentDetail', { documentId: relatedDoc.id });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <LoadingSkeleton type="card" count={3} />
            </View>
        );
    }

    if (!document) {
        return (
            <View style={styles.container}>
                <EmptyState
                    icon="file-document-outline"
                    title="Document not found"
                    message="The document you're looking for doesn't exist or has been deleted."
                />
            </View>
        );
    }

    const fileIcon = getFileIcon(document.mimeType);
    const fileIconColor = getFileIconColor(document.mimeType);
    const expiryStatus = useMemo(() => getDocumentExpiryStatus(document?.expiryDate), [document?.expiryDate]);
    const expiryBadgeColor = statusToneColors[expiryStatus.tone] || COLORS.textSecondary;
    const expiryDateLabel = getDocumentExpiryLabel(document.expiryDate);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Document Icon/Thumbnail */}
                <View style={styles.iconContainer}>
                    <View style={[styles.iconWrapper, { backgroundColor: `${fileIconColor}15` }]}>
                        <MaterialCommunityIcons
                            name={fileIcon}
                            size={80}
                            color={fileIconColor}
                        />
                    </View>
                </View>

                {/* Document Name */}
                <Text style={styles.documentName}>{document.name}</Text>
                <View
                    style={[styles.headerStatusBadge, { backgroundColor: `${expiryBadgeColor}18`, borderColor: expiryBadgeColor }]}
                    accessible
                    accessibilityLabel={`Document status ${expiryStatus.label}`}
                >
                    <Text style={[styles.headerStatusText, { color: expiryBadgeColor }]}>{expiryStatus.label}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.downloadButton]}
                        onPress={handleDownload}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="download" size={20} color={COLORS.textInverse} />
                        <Text style={styles.actionButtonText}>Download</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={handleShare}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.textInverse} />
                        <Text style={styles.actionButtonText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={handleEdit}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="pencil" size={20} color={COLORS.textInverse} />
                        <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                        activeOpacity={0.7}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color={COLORS.textInverse} />
                        ) : (
                            <MaterialCommunityIcons name="delete" size={20} color={COLORS.textInverse} />
                        )}
                        <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>

                {/* Metadata Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Document Information</Text>
                    <View style={styles.metadataContainer}>
                        <View style={styles.metadataRow}>
                            <MaterialCommunityIcons
                                name="file-outline"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                            <View style={styles.metadataContent}>
                                <Text style={styles.metadataLabel}>File Type</Text>
                                <Text style={styles.metadataValue}>
                                    {document.mimeType || 'Unknown'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metadataRow}>
                            <MaterialCommunityIcons
                                name="weight"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                            <View style={styles.metadataContent}>
                                <Text style={styles.metadataLabel}>File Size</Text>
                                <Text style={styles.metadataValue}>
                                    {formatFileSize(document.size)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metadataRow}>
                            <MaterialCommunityIcons
                                name="calendar-outline"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                            <View style={styles.metadataContent}>
                                <Text style={styles.metadataLabel}>Upload Date</Text>
                                <Text style={styles.metadataValue}>
                                    {formatDate(document.uploadDate)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metadataRow}>
                            <MaterialCommunityIcons
                                name="calendar-clock"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                            <View style={styles.metadataContent}>
                                <Text style={styles.metadataLabel}>Expiry Date</Text>
                                <View style={styles.expiryRow}>
                                    <Text style={styles.metadataValue}>{expiryDateLabel}</Text>
                                    <View style={[styles.expiryStatusBadge, { backgroundColor: `${expiryBadgeColor}15`, borderColor: expiryBadgeColor }]}> 
                                        <Text style={[styles.expiryStatusText, { color: expiryBadgeColor }]}>{expiryStatus.label}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {document.updatedAt && document.updatedAt !== document.uploadDate && (
                            <View style={styles.metadataRow}>
                                <MaterialCommunityIcons
                                    name="calendar-edit"
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                                <View style={styles.metadataContent}>
                                    <Text style={styles.metadataLabel}>Last Modified</Text>
                                    <Text style={styles.metadataValue}>
                                        {formatDate(document.updatedAt)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.metadataRow}>
                            <MaterialCommunityIcons
                                name="tag-outline"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                            <View style={styles.metadataContent}>
                                <Text style={styles.metadataLabel}>Category</Text>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{document.category}</Text>
                                </View>
                            </View>
                        </View>

                        {document.userId && (
                            <View style={styles.metadataRow}>
                                <MaterialCommunityIcons
                                    name="account-outline"
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                                <View style={styles.metadataContent}>
                                    <Text style={styles.metadataLabel}>Uploaded By</Text>
                                    <Text style={styles.metadataValue}>
                                        {user?.uid === document.userId ? 'You' : 'Another user'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Notes Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notes</Text>
                    {document.notes ? (
                        <View style={styles.notesContainer}>
                            <Text style={styles.notesText}>{document.notes}</Text>
                        </View>
                    ) : (
                        <Text style={styles.noNotesText}>No notes added</Text>
                    )}
                </View>

                {/* Related Documents Section */}
                {relatedDocuments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Related Documents</Text>
                        <Text style={styles.sectionSubtitle}>
                            Other documents in the same category
                        </Text>
                        {relatedDocuments.map((relatedDoc) => (
                            <DocumentCard
                                key={relatedDoc.id}
                                document={relatedDoc}
                                onPress={() => handleRelatedDocumentPress(relatedDoc)}
                                onMenuPress={() => {}}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Edit Modal */}
            <EditDocumentModal
                visible={editModalVisible}
                document={document}
                onClose={() => setEditModalVisible(false)}
                onSave={handleSaveEdit}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    iconContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconWrapper: {
        width: 160,
        height: 160,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    documentName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: COLORS.surface,
    },
    headerStatusBadge: {
        alignSelf: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 12,
    },
    headerStatusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    actionButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    downloadButton: {
        backgroundColor: COLORS.info,
    },
    shareButton: {
        backgroundColor: COLORS.accent,
    },
    editButton: {
        backgroundColor: COLORS.warning,
    },
    deleteButton: {
        backgroundColor: COLORS.error,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textInverse,
    },
    section: {
        padding: 20,
        backgroundColor: COLORS.surface,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 16,
    },
    metadataContainer: {
        gap: 16,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    metadataContent: {
        flex: 1,
    },
    metadataLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    metadataValue: {
        fontSize: 16,
        color: COLORS.text,
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    expiryStatusBadge: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    expiryStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: `${COLORS.primary}15`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 4,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    notesContainer: {
        backgroundColor: COLORS.backgroundSecondary,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notesText: {
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
    },
    noNotesText: {
        fontSize: 14,
        color: COLORS.textLight,
        fontStyle: 'italic',
    },
});

export default DocumentDetailScreen;
