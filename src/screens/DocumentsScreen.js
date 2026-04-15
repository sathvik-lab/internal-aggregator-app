/**
 * Documents Screen
 * 
 * Screen for managing compliance documents with search, filters, and sorting.
 * Integrates with Firestore for real-time document updates.
 * 
 * Firestore Query Patterns:
 * - Real-time listener: setupRealtimeListener('documents', conditions, callback)
 * - Search: Client-side filtering on document name (Firestore text search is limited)
 * - Filter: Client-side filtering by category
 * - Sort: Client-side sorting (Firestore supports one orderBy per query)
 * - Pagination: Use startAfter with limit for pagination
 * 
 * Example real Firestore query:
 * ```javascript
 * import { collection, query, where, orderBy, limit, onSnapshot, startAfter } from 'firebase/firestore';
 * import { db } from '../services/firebase';
 * 
 * const q = query(
 *   collection(db, 'documents'),
 *   where('userId', '==', currentUser.uid),
 *   orderBy('uploadDate', 'desc'),
 *   limit(20)
 * );
 * 
 * const unsubscribe = onSnapshot(q, (snapshot) => {
 *   const docs = snapshot.docs.map(doc => ({
 *     id: doc.id,
 *     ...doc.data()
 *   }));
 *   setDocuments(docs);
 * });
 * ```
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useEffectiveRole } from '../hooks/useEffectiveRole';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DocumentCard from '../components/documents/DocumentCard';
import SearchBar from '../components/documents/SearchBar';
import FilterChip from '../components/documents/FilterChip';
import SortDropdown from '../components/documents/SortDropdown';
import UploadDocumentModal from '../components/documents/UploadDocumentModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import DocumentExpiryBanner, { shouldShowDocumentExpiryBanner } from '../components/common/DocumentExpiryBanner';
import { COLORS } from '../constants/colors';
import { setupRealtimeListener, fetchDocumentsPage } from '../services/firestore';
import { PAGINATION } from '../constants/constants';
import { ROUTES } from '../navigation/navigationConfig';
import { DOCUMENT_FILTERS, getDocumentFilterLabel } from '../utils/documentTypes';
import { dismissReminder, fetchUserPreferences } from '../services/userPreferences';
import { getFirestoreLoadUserMessage } from '../utils/firestoreUiErrors';

const DOCUMENT_CATEGORIES = DOCUMENT_FILTERS;

/** Estimated row height (DocumentCard marginBottom + card) for getItemLayout; keep in sync with DocumentCard layout. */
const DOCUMENT_LIST_ROW_HEIGHT = 228;
const DOCUMENT_LIST_WINDOW_SIZE = 8;
const DOCUMENT_LIST_INITIAL_RENDER = 10;
const DOCUMENT_LIST_MAX_BATCH = 12;

/**
 * Sort documents based on sort option
 * @param {Array} documents - Array of documents
 * @param {string} sortOption - Sort option value
 * @returns {Array} Sorted documents
 */
const sortDocuments = (documents, sortOption) => {
    const sorted = [...documents];

    switch (sortOption) {
        case 'date-desc':
            return sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        case 'date-asc':
            return sorted.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'size-desc':
            return sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
        case 'size-asc':
            return sorted.sort((a, b) => (a.size || 0) - (b.size || 0));
        case 'type-asc':
            return sorted.sort((a, b) => (a.mimeType || '').localeCompare(b.mimeType || ''));
        default:
            return sorted;
    }
};

/**
 * Filter documents based on search query and category
 * @param {Array} documents - Array of documents
 * @param {string} searchQuery - Search query string
 * @param {string} selectedCategory - Selected category filter
 * @returns {Array} Filtered documents
 */
const filterDocuments = (documents, searchQuery, selectedCategory) => {
    let filtered = [...documents];

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
        filtered = filtered.filter((doc) => getDocumentFilterLabel(doc) === selectedCategory);
    }

    // Filter by search query (case-insensitive search on name)
    if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((doc) =>
            (doc.name || '').toLowerCase().includes(query)
        );
    }

    return filtered;
};

const mergeDocumentsById = (live, extra) => {
    const map = new Map();
    [...live, ...extra].forEach((d) => {
        if (d && d.id) map.set(d.id, d);
    });
    return Array.from(map.values());
};

const DocumentsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const { isOwner, loading: roleLoading } = useEffectiveRole();
    const { colors } = useTheme();

    // State management
    const [liveDocuments, setLiveDocuments] = useState([]);
    const [paginatedDocuments, setPaginatedDocuments] = useState([]);
    const documentsCursorRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('date-desc');
    const [hasMore, setHasMore] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [userPreferences, setUserPreferences] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [documentsListenerKey, setDocumentsListenerKey] = useState(0);

    const mergedDocuments = useMemo(
        () => mergeDocumentsById(liveDocuments, paginatedDocuments),
        [liveDocuments, paginatedDocuments],
    );

    useEffect(() => {
        const nextCategory = route.params?.initialCategory;
        const nextSortOption = route.params?.initialSortOption;
        const nextSearchQuery = route.params?.initialSearchQuery;
        const shouldOpenUpload = route.params?.openUploadModal;

        if (nextCategory && DOCUMENT_CATEGORIES.includes(nextCategory)) {
            setSelectedCategory(nextCategory);
        }

        if (typeof nextSortOption === 'string') {
            setSortOption(nextSortOption);
        }

        if (typeof nextSearchQuery === 'string') {
            setSearchQuery(nextSearchQuery);
        }

        if (shouldOpenUpload) {
            if (roleLoading) {
                return;
            }
            if (isOwner) {
                setUploadModalVisible(true);
            } else {
                Alert.alert(
                    'Owner only',
                    'Only the business owner can upload documents for this workspace.',
                );
            }
            navigation.setParams({ openUploadModal: undefined });
        }
    }, [
        route.params?.focusKey,
        route.params?.initialCategory,
        route.params?.initialSortOption,
        route.params?.initialSearchQuery,
        route.params?.openUploadModal,
        isOwner,
        roleLoading,
        navigation,
    ]);

    /**
     * Set up real-time listener for user's documents
     * 
     * Real Firestore implementation would look like:
     * ```javascript
     * const q = query(
     *   collection(db, 'documents'),
     *   where('userId', '==', user.uid),
     *   orderBy('uploadDate', 'desc'),
     *   limit(PAGINATION.DEFAULT_PAGE_SIZE)
     * );
     * 
     * const unsubscribe = onSnapshot(q, (snapshot) => {
     *   const docs = snapshot.docs.map(doc => ({
     *     id: doc.id,
     *     ...doc.data()
     *   }));
     *   setDocuments(docs);
     *   setLastDocument(snapshot.docs[snapshot.docs.length - 1]);
     *   setHasMore(snapshot.docs.length === PAGINATION.DEFAULT_PAGE_SIZE);
     * });
     * ```
     */
    // Real-time documents query; `documentsListenerKey` bumps to re-subscribe after errors / refresh.
    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return undefined;
        }

        setLoading(true);
        setLoadError('');

        const unsubscribe = setupRealtimeListener(
            'documents',
            [{ field: 'userId', operator: '==', value: user.uid }],
            (docs, error, pagingMeta) => {
                if (error) {
                    console.error('Error fetching documents:', error);
                    setLiveDocuments([]);
                    setPaginatedDocuments([]);
                    documentsCursorRef.current = null;
                    setHasMore(false);
                    setLoadError(getFirestoreLoadUserMessage(error));
                } else {
                    setLoadError('');
                    setLiveDocuments(docs || []);
                    setPaginatedDocuments([]);
                    documentsCursorRef.current = pagingMeta?.lastDocumentSnapshot ?? null;
                    setHasMore(Boolean(pagingMeta?.fullPage));
                }
                setLoading(false);
                setRefreshing(false);
            },
            {
                orderBy: { field: 'uploadDate', direction: 'desc' },
                limit: PAGINATION.DEFAULT_PAGE_SIZE,
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.uid, documentsListenerKey]);

    useEffect(() => {
        const loadPreferences = async () => {
            if (!user?.uid) return;
            const result = await fetchUserPreferences(user.uid);
            if (result.data) {
                setUserPreferences(result.data);
            }
        };
        loadPreferences();
    }, [user?.uid]);

    // Apply filters and sorting to documents
    const filteredAndSortedDocuments = useMemo(() => {
        let filtered = filterDocuments(mergedDocuments, searchQuery, selectedCategory);

        if (route.params?.highlightExpiring) {
            const now = new Date();
            const nextThirtyDays = new Date();
            nextThirtyDays.setDate(nextThirtyDays.getDate() + 30);

            filtered = filtered.filter((doc) => {
                if (!doc.expiryDate) return false;
                const expiryDate = new Date(doc.expiryDate);
                if (Number.isNaN(expiryDate.getTime())) return false;
                return expiryDate >= now && expiryDate <= nextThirtyDays;
            });
        }

        return sortDocuments(filtered, sortOption);
    }, [mergedDocuments, route.params?.highlightExpiring, searchQuery, selectedCategory, sortOption]);

    const documentExpiryCounts = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() + 30);

        return mergedDocuments.reduce((acc, doc) => {
            if (!doc?.expiryDate) return acc;
            const expiryDate = new Date(doc.expiryDate);
            if (Number.isNaN(expiryDate.getTime())) return acc;
            if (expiryDate < now) {
                acc.expired += 1;
            } else if (expiryDate <= cutoff) {
                acc.expiring += 1;
            }
            return acc;
        }, { expired: 0, expiring: 0 });
    }, [mergedDocuments]);

    // Pull-to-refresh handler
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setDocumentsListenerKey((k) => k + 1);
    }, []);

    const handleRetryDocuments = useCallback(() => {
        setLoadError('');
        setDocumentsListenerKey((k) => k + 1);
    }, []);

    // Load more documents (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || loading || loadingMore || !user?.uid || !documentsCursorRef.current) {
            return;
        }
        setLoadingMore(true);
        const res = await fetchDocumentsPage({
            userId: user.uid,
            pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
            startAfterSnapshot: documentsCursorRef.current,
        });
        if (res.error) {
            setLoadingMore(false);
            return;
        }
        setPaginatedDocuments((prev) => [...prev, ...res.data]);
        documentsCursorRef.current = res.cursor;
        setHasMore(res.hasMore);
        setLoadingMore(false);
    }, [hasMore, loading, loadingMore, user?.uid]);

    // Handlers
    const handleDocumentPress = useCallback((document) => {
        navigation.navigate(ROUTES.DOCUMENTS.DETAIL, { documentId: document.id });
    }, [navigation]);

    const handleMenuPress = useCallback((document) => {
        Alert.alert(
            'Document Actions',
            `Actions for: ${document.name}`,
            [
                { text: 'Download', onPress: () => console.log('Download:', document.id) },
                { text: 'Share', onPress: () => console.log('Share:', document.id) },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Delete Document',
                            'Are you sure you want to delete this document?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => {
                                        // TODO: Implement delete functionality
                                        console.log('Delete:', document.id);
                                    },
                                },
                            ]
                        );
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    }, []);

    const handleUploadPress = useCallback(() => {
        if (roleLoading) {
            return;
        }
        if (!isOwner) {
            Alert.alert(
                'Owner only',
                'Only the business owner can upload documents for this workspace.',
            );
            return;
        }
        setUploadModalVisible(true);
    }, [isOwner, roleLoading]);

    const handleUploadSuccess = () => {};

    const handleSearchClear = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Memoize render functions to prevent re-creation on every render
    const renderDocument = useCallback(({ item }) => (
        <DocumentCard
            document={item}
            onPress={handleDocumentPress}
            onMenuPress={handleMenuPress}
        />
    ), [handleDocumentPress, handleMenuPress]);

    // Memoize header to prevent re-renders
    const renderHeader = useCallback(() => (
        <View
            style={styles.header}
            accessibilityRole="region"
            accessibilityLabel="Documents: search, category filters, and sort"
        >
            {shouldShowDocumentExpiryBanner(
                {
                    expiringCount: documentExpiryCounts.expiring,
                    expiredCount: documentExpiryCounts.expired,
                },
                userPreferences
            ) && (
                <DocumentExpiryBanner
                    expiringCount={documentExpiryCounts.expiring}
                    expiredCount={documentExpiryCounts.expired}
                    onOpenDocuments={() => {
                        setSelectedCategory('All');
                        setSortOption('date-asc');
                    }}
                    onDismiss={async () => {
                        if (!user?.uid) return;
                        await dismissReminder(user.uid, 'documentExpiry');
                        const refreshed = await fetchUserPreferences(user.uid);
                        if (refreshed.data) {
                            setUserPreferences(refreshed.data);
                        }
                    }}
                />
            )}
            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={handleSearchClear}
            />

            {/* Filter Chips */}
            <View style={styles.filtersContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={DOCUMENT_CATEGORIES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <FilterChip
                            label={item}
                            selected={selectedCategory === item}
                            onPress={() => setSelectedCategory(item)}
                        />
                    )}
                    contentContainerStyle={styles.filtersList}
                    initialNumToRender={12}
                    maxToRenderPerBatch={12}
                    windowSize={5}
                    removeClippedSubviews={Platform.OS === 'android'}
                />
            </View>

            {/* Sort Dropdown */}
            <View style={styles.sortContainer}>
                <Text
                    style={[styles.sortLabel, { color: colors.textSecondary || colors.text?.secondary || COLORS.textSecondary }]}
                    accessibilityRole="text"
                >
                    Sort:
                </Text>
                <SortDropdown value={sortOption} onChange={setSortOption} />
            </View>
        </View>
    ), [searchQuery, selectedCategory, sortOption, colors, handleSearchClear, documentExpiryCounts.expiring, documentExpiryCounts.expired, userPreferences, user?.uid]);

    // Memoize empty state render
    const renderEmpty = useCallback(() => {
        if (loading) {
            return <LoadingSkeleton type="card" count={3} />;
        }

        if (loadError) {
            return (
                <EmptyState
                    icon="alert-circle-outline"
                    title="Could not load documents"
                    message={loadError}
                    showAction
                    actionLabel="Retry"
                    onAction={handleRetryDocuments}
                />
            );
        }

        if (searchQuery.trim().length > 0 || selectedCategory !== 'All') {
            return (
                <EmptyState
                    icon="file-search-outline"
                    title="No documents found"
                    message="Try adjusting your search or filter criteria."
                />
            );
        }

        return (
            <EmptyState
                icon="file-document-outline"
                title="No documents yet"
                message={
                    isOwner
                        ? 'Upload your first compliance document to get started.'
                        : 'Documents will appear here when the business owner uploads compliance files.'
                }
                showAction={isOwner && !roleLoading}
                actionLabel="Upload Document"
                onAction={handleUploadPress}
            />
        );
    }, [loading, loadError, searchQuery, selectedCategory, handleUploadPress, handleRetryDocuments, isOwner, roleLoading]);

    // Use dark background for glassmorphism
    const backgroundColor = colors.zinc950 || colors.background;
    
    return (
        <View style={[styles.container, { backgroundColor }]}>
            <FlatList
                data={filteredAndSortedDocuments}
                renderItem={renderDocument}
                keyExtractor={(item, index) => (item?.id != null ? String(item.id) : `doc-${index}`)}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator style={styles.listFooterSpinner} color={COLORS.primary} />
                    ) : null
                }
                accessibilityLabel="Documents list"
                contentContainerStyle={[
                    styles.listContent,
                    filteredAndSortedDocuments.length === 0 && styles.listContentEmpty,
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                        progressViewOffset={Platform.OS === 'android' ? 20 : 0}
                        progressBackgroundColor={COLORS.surface}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.35}
                showsVerticalScrollIndicator={false}
                windowSize={DOCUMENT_LIST_WINDOW_SIZE}
                initialNumToRender={DOCUMENT_LIST_INITIAL_RENDER}
                maxToRenderPerBatch={DOCUMENT_LIST_MAX_BATCH}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={Platform.OS === 'android'}
                getItemLayout={(_, index) => ({
                    length: DOCUMENT_LIST_ROW_HEIGHT,
                    offset: DOCUMENT_LIST_ROW_HEIGHT * index,
                    index,
                })}
            />

            {/* Floating Action Button — business doc writes are owner-only (firestore.rules + ROLE_MATRIX) */}
            {isOwner && !roleLoading ? (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleUploadPress}
                    activeOpacity={0.8}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="Upload document"
                    accessibilityHint="Opens the upload document form"
                >
                    <MaterialCommunityIcons
                        name="plus"
                        size={28}
                        color={COLORS.textInverse}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                </TouchableOpacity>
            ) : null}

            {/* Upload Document Modal */}
            <UploadDocumentModal
                visible={uploadModalVisible}
                uploadAllowed={isOwner && !roleLoading}
                onClose={() => setUploadModalVisible(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Space for FAB
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    listFooterSpinner: {
        paddingVertical: 16,
    },
    header: {
        marginBottom: 20,
    },
    filtersContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    filtersList: {
        paddingRight: 20,
    },
    sortContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    sortLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    fab: {
        position: 'absolute',
        right: Number(20),
        bottom: Number(20),
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
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
});

export default DocumentsScreen;
